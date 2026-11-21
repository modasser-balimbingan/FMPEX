// ARDNET Phase 4B — produce listing discussions.
// Uses the approved TEST produce_comments schema; does not alter existing tables.
const pool = require('../config/database');
const crypto = require('crypto');

const positiveId = (value) => {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
};

const commentText = (value) => {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text.length >= 1 && text.length <= 1000 ? text : null;
};

async function findListing(listingId) {
  const result = await pool.query(
    'SELECT listing_id, user_id, status FROM public.produce_listings WHERE listing_id = $1',
    [listingId]
  );
  return result.rows[0] || null;
}

// GET /api/listings/:id/comments
// Public listing discussions. Keep the reply structure while masking hidden/deleted text.
exports.getListingComments = async (req, res) => {
  const listingId = positiveId(req.params.id);
  if (!listingId) return res.status(400).json({ error: 'Invalid listing ID' });

  try {
    if (!await findListing(listingId)) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    const result = await pool.query(`
      SELECT c.comment_id, c.listing_id, c.user_id, c.parent_comment_id,
             CASE WHEN c.status = 'Active' THEN c.content ELSE NULL END AS content,
             c.status, c.created_at, c.updated_at,
             CASE WHEN c.status = 'Active' THEN u.user_name ELSE NULL END AS author_name,
             (c.user_id = l.user_id) AS is_listing_owner
      FROM public.produce_comments c
      JOIN public.users u ON u.user_id = c.user_id
      JOIN public.produce_listings l ON l.listing_id = c.listing_id
      WHERE c.listing_id = $1
      ORDER BY c.created_at ASC, c.comment_id ASC
    `, [listingId]);
    res.set('Cache-Control', 'no-store');
    return res.json(result.rows);
  } catch (err) {
    console.error('[Comments] Fetch failed:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve comments' });
  }
};

// POST /api/listings/:id/comments — persistent, asynchronous comments and replies.
// Creating a comment and recording an in-app notification are one atomic transaction.
// The other participant NEVER needs to be online or currently signed in.
exports.createComment = async (req, res) => {
  const listingId = positiveId(req.params.id);
  if (!listingId) return res.status(400).json({ error: 'Invalid listing ID' });

  const actorId = positiveId(req.user?.id);
  if (!actorId) return res.status(401).json({ error: 'Authentication required' });

  const content = commentText(req.body?.content);
  if (!content) {
    return res.status(400).json({ error: 'Comment must contain 1–1000 characters' });
  }

  const rawParent = req.body?.parent_comment_id;
  const parentId = rawParent === undefined || rawParent === null || rawParent === ''
    ? null : positiveId(rawParent);
  if (rawParent !== undefined && rawParent !== null && rawParent !== '' && !parentId) {
    return res.status(400).json({ error: 'Invalid parent comment ID' });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // A valid active listing is required, but no presence/online check is involved.
    const listingResult = await client.query(
      `SELECT listing_id, user_id, status
       FROM public.produce_listings
       WHERE listing_id = $1 FOR SHARE`,
      [listingId]
    );
    const listing = listingResult.rows[0];
    if (!listing) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (String(listing.status).toLowerCase() !== 'active') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Comments are closed for this listing' });
    }

    // Top-level inquiries notify the listing owner. Replies notify the parent author.
    // Multiple levels of replies are supported without requiring either user online.
    let recipientId = Number(listing.user_id);
    let title = 'New comment on your produce listing';
    if (parentId !== null) {
      const parentResult = await client.query(
        `SELECT comment_id, listing_id, user_id, status
         FROM public.produce_comments
         WHERE comment_id = $1 AND listing_id = $2 FOR SHARE`,
        [parentId, listingId]
      );
      const parent = parentResult.rows[0];
      if (!parent || parent.status !== 'Active') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Parent comment does not exist on this listing or is no longer active. Use a saved active comment_id from GET /api/listings/:id/comments.'
        });
      }
      recipientId = Number(parent.user_id);
      title = 'New reply to your produce comment';
    }

    const created = await client.query(`
      INSERT INTO public.produce_comments (listing_id, user_id, parent_comment_id, content)
      VALUES ($1, $2, $3, $4)
      RETURNING comment_id, listing_id, user_id, parent_comment_id, content,
                status, created_at, updated_at
    `, [listingId, actorId, parentId, content]);
    const comment = created.rows[0];

    // Don't notify someone about their own comments/replies.
    if (recipientId !== actorId) {
      const eventId = crypto.createHash('sha256')
        .update(`produce-comment:${comment.comment_id}:recipient:${recipientId}`)
        .digest('hex');
      const textPreview = content.length > 240 ? `${content.slice(0, 237)}...` : content;
      const action = parentId === null ? 'commented on your listing' : 'replied to your comment';
      const message = `Someone ${action} (listing #${listingId}).\n${textPreview}`;

      // In-app notification only: no Brevo email and no RabbitMQ event.
      // Both the comment and notification succeed or roll back together.
      await client.query(`
        INSERT INTO public.notifications
          (user_id, title, message, status, event_id, email_status)
        VALUES ($1, $2, $3, 'Unread', $4, 'not_applicable')
        ON CONFLICT DO NOTHING
      `, [recipientId, title, message, eventId]);
    }

    await client.query('COMMIT');
    res.set('Cache-Control', 'no-store');
    return res.status(201).json(comment);
  } catch (err) {
    if (client) {
      try { await client.query('ROLLBACK'); }
      catch (rollbackError) { console.error('[Comments] Rollback failed:', rollbackError.message); }
    }
    if (err.code === '23503') {
      return res.status(409).json({ error: 'Listing, parent comment, or notification recipient no longer exists' });
    }
    console.error('[Comments] Create failed:', err.message);
    return res.status(500).json({ error: 'Failed to create comment' });
  } finally {
    if (client) client.release();
  }
};

async function mutationFailure(res, commentId, userId) {
  const result = await pool.query(
    'SELECT user_id, status FROM public.produce_comments WHERE comment_id = $1',
    [commentId]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Comment not found' });
  if (String(result.rows[0].user_id) !== String(userId)) {
    return res.status(403).json({ error: 'You can only modify your own comments' });
  }
  return res.status(409).json({ error: 'Comment is no longer active' });
}

// PUT /api/comments/:commentId — only the author can edit an active comment.
exports.updateComment = async (req, res) => {
  const commentId = positiveId(req.params.commentId);
  if (!commentId) return res.status(400).json({ error: 'Invalid comment ID' });
  const content = commentText(req.body?.content);
  if (!content) return res.status(400).json({ error: 'Comment must contain 1–1000 characters' });
  try {
    const result = await pool.query(`
      UPDATE public.produce_comments
      SET content = $1, updated_at = NOW()
      WHERE comment_id = $2 AND user_id = $3 AND status = 'Active'
      RETURNING comment_id, listing_id, user_id, parent_comment_id, content,
                status, created_at, updated_at
    `, [content, commentId, req.user.id]);
    if (!result.rows.length) return await mutationFailure(res, commentId, req.user.id);
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('[Comments] Update failed:', err.message);
    return res.status(500).json({ error: 'Failed to update comment' });
  }
};

// DELETE /api/comments/:commentId — soft delete preserves replies and discussion context.
exports.deleteComment = async (req, res) => {
  const commentId = positiveId(req.params.commentId);
  if (!commentId) return res.status(400).json({ error: 'Invalid comment ID' });
  try {
    const result = await pool.query(`
      UPDATE public.produce_comments
      SET status = 'Deleted', updated_at = NOW()
      WHERE comment_id = $1 AND user_id = $2 AND status = 'Active'
      RETURNING comment_id
    `, [commentId, req.user.id]);
    if (!result.rows.length) return await mutationFailure(res, commentId, req.user.id);
    return res.json({ message: 'Comment deleted', comment_id: result.rows[0].comment_id });
  } catch (err) {
    console.error('[Comments] Delete failed:', err.message);
    return res.status(500).json({ error: 'Failed to delete comment' });
  }
};

// PATCH /api/admin/comments/:commentId/moderate — administrator only.
exports.moderateComment = async (req, res) => {
  const commentId = positiveId(req.params.commentId);
  if (!commentId) return res.status(400).json({ error: 'Invalid comment ID' });
  const status = req.body?.status;
  if (!['Active', 'Hidden'].includes(status)) {
    return res.status(400).json({ error: 'Status must be Active or Hidden' });
  }
  try {
    const result = await pool.query(`
      UPDATE public.produce_comments
      SET status = $1, updated_at = NOW()
      WHERE comment_id = $2 AND status <> 'Deleted'
      RETURNING comment_id, listing_id, user_id, status, updated_at
    `, [status, commentId]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Comment not found or deleted' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('[Comments] Moderation failed:', err.message);
    return res.status(500).json({ error: 'Failed to moderate comment' });
  }
};
