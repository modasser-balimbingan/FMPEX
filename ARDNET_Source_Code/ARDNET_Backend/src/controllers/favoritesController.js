// Phase 5B: per-user saved listings. Uses the approved test favorite_listings table.
const pool = require('../config/database');

function listingId(value) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

// GET /api/favorites — only this authenticated user can see their saved listings.
exports.getMyFavorites = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.favorite_id, f.user_id AS saved_by_user_id, f.created_at AS favorited_at,
             pl.listing_id, pl.user_id, pl.category_id, pc.category_name,
             pl.produce_name, pl.description, pl.quantity, pl.unit,
             pl.asking_price, pl.location, pl.status, pl.created_at,
             u.user_name AS farmer_name
      FROM public.favorite_listings f
      JOIN public.produce_listings pl ON pl.listing_id = f.listing_id
      JOIN public.produce_categories pc ON pc.category_id = pl.category_id
      JOIN public.users u ON u.user_id = pl.user_id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC, f.favorite_id DESC
    `, [req.user.id]);

    if (result.rows.length === 0) {
      res.set('Cache-Control', 'no-store');
      return res.json([]);
    }

    const ids = result.rows.map((row) => row.listing_id);
    const photoResult = await pool.query(`
      SELECT photo_id, listing_id, file_name AS original_name,
             file_path AS photo_url
      FROM public.produce_photos
      WHERE listing_id = ANY($1::int[])
      ORDER BY photo_id ASC
    `, [ids]);
    const photos = new Map();
    for (const photo of photoResult.rows) {
      const key = Number(photo.listing_id);
      if (!photos.has(key)) photos.set(key, []);
      photos.get(key).push(photo);
    }
    res.set('Cache-Control', 'no-store');
    return res.json(result.rows.map((row) => ({
      ...row,
      photos: photos.get(Number(row.listing_id)) || [],
    })));
  } catch (error) {
    console.error('[Favorites] Fetch failed:', error.message);
    return res.status(500).json({ error: 'Failed to fetch favorites' });
  }
};

// POST /api/listings/:id/favorite — idempotent; an existing favorite is not duplicated.
exports.addFavorite = async (req, res) => {
  const id = listingId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid listing ID' });
  try {
    const listing = await pool.query(
      'SELECT listing_id, status FROM public.produce_listings WHERE listing_id = $1',
      [id]
    );
    if (!listing.rows.length) return res.status(404).json({ error: 'Listing not found' });
    if (String(listing.rows[0].status).toLowerCase() !== 'active') {
      return res.status(409).json({ error: 'Only active listings can be saved' });
    }

    const inserted = await pool.query(`
      INSERT INTO public.favorite_listings (user_id, listing_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, listing_id) DO NOTHING
      RETURNING favorite_id
    `, [req.user.id, id]);
    if (inserted.rows.length) {
      return res.status(201).json({ favorited: true, listing_id: id,
        favorite_id: inserted.rows[0].favorite_id });
    }
    // Duplicate request or concurrent click: return the existing favorite.
    const existing = await pool.query(`
      SELECT favorite_id FROM public.favorite_listings
      WHERE user_id = $1 AND listing_id = $2
    `, [req.user.id, id]);
    if (!existing.rows.length) return res.status(409).json({ error: 'Listing is no longer available' });
    return res.json({ favorited: true, listing_id: id,
      favorite_id: existing.rows[0].favorite_id });
  } catch (error) {
    if (error.code === '23503') return res.status(404).json({ error: 'Listing no longer exists' });
    console.error('[Favorites] Save failed:', error.message);
    return res.status(500).json({ error: 'Failed to save favorite' });
  }
};

// DELETE /api/listings/:id/favorite — can remove inactive listings; idempotent.
exports.removeFavorite = async (req, res) => {
  const id = listingId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid listing ID' });
  try {
    await pool.query(`
      DELETE FROM public.favorite_listings
      WHERE user_id = $1 AND listing_id = $2
    `, [req.user.id, id]);
    return res.json({ favorited: false, listing_id: id });
  } catch (error) {
    console.error('[Favorites] Remove failed:', error.message);
    return res.status(500).json({ error: 'Failed to remove favorite' });
  }
};
