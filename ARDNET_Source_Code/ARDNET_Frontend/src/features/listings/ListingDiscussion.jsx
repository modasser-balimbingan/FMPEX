import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import commentsService from '../../api/services/commentsService';
import ListingIcon from './ListingIcon';
import '../../styles/listings-discussion.scss';

const MAX_LENGTH = 1000;

function userIdOf(user) {
  const id = Number(user?.id ?? user?.user_id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function dateText(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : 'Recently';
}

function buildThreads(comments) {
  const byParent = new Map();
  const knownIds = new Set(comments.map((item) => Number(item.comment_id)));
  for (const item of comments) {
    const parent = Number(item.parent_comment_id);
    const key = item.parent_comment_id != null && knownIds.has(parent) && parent !== Number(item.comment_id)
      ? parent : 0;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(item);
  }
  return byParent;
}

function CommentEntry({ comment, depth, parentAuthor, visited = new Set(), threads, viewerId, canPost, busy, editingId,
  editingText, setEditingText, replyId, replyText, setReplyText, onBeginReply,
  onCancelReply, onReply, onBeginEdit, onCancelEdit, onEdit, onDelete }) {
  const commentId = Number(comment.comment_id);
  const active = comment.status === 'Active';
  const own = active && viewerId != null && Number(comment.user_id) === viewerId;
  const author = active ? (comment.author_name || 'ArdNet member') : 'Comment unavailable';
  const children = (threads.get(commentId) || []).filter(child => !visited.has(Number(child.comment_id)));
  const nextVisited = new Set([...visited, commentId]);
  const edited = active && comment.updated_at && new Date(comment.updated_at).getTime() > new Date(comment.created_at).getTime();

  return <article className={'produce-discussion__comment' + (depth > 0 ? ' is-reply' : '') + (!active ? ' is-unavailable' : '')}>
    <div className="produce-discussion__entry">
      <div className="produce-discussion__avatar" aria-hidden="true">{active ? author.slice(0, 1).toUpperCase() : '–'}</div>
      <div className="produce-discussion__comment-body">
        {depth > 0 && <p className="produce-discussion__reply-context"><ListingIcon name="reply" size={13} />Reply to <span>{parentAuthor}</span></p>}
        <div className="produce-discussion__comment-heading">
          <span className="produce-discussion__author">{author}</span>
          {active && comment.is_listing_owner && <span className="produce-discussion__owner">Listing owner</span>}
          {own && !comment.is_listing_owner && <span className="produce-discussion__you">You</span>}
        </div>
        <div className="produce-discussion__meta"><time className="produce-discussion__date" dateTime={comment.created_at}>{dateText(comment.created_at)}</time>{edited && <span className="produce-discussion__edited">Edited</span>}</div>
        {editingId === commentId ? <form className="produce-discussion__inline-form" onSubmit={event => { event.preventDefault(); onEdit(commentId); }}>
          <label htmlFor={'edit-comment-' + commentId}>Edit your comment</label>
          <textarea id={'edit-comment-' + commentId} rows={3} maxLength={MAX_LENGTH} value={editingText} disabled={busy} onChange={event => setEditingText(event.target.value)} />
          <div className="produce-discussion__inline-actions"><span>{editingText.length}/{MAX_LENGTH}</span><button type="button" className="produce-discussion__text-button" disabled={busy} onClick={onCancelEdit}>Cancel</button><button type="submit" className="produce-discussion__small-submit" disabled={busy || !editingText.trim()}>Save changes</button></div>
        </form> : <p className={'produce-discussion__message' + (!active ? ' is-unavailable' : '')}>{active ? comment.content : comment.status === 'Hidden' ? 'This comment was hidden by a moderator.' : 'This comment was deleted. Its replies are kept below.'}</p>}
        {active && editingId !== commentId && <div className="produce-discussion__actions">
          {canPost && <button type="button" disabled={busy} aria-expanded={replyId === commentId} aria-controls={'reply-form-' + commentId} onClick={() => replyId === commentId ? onCancelReply() : onBeginReply(commentId)}><ListingIcon name="reply" size={15} />Reply</button>}
          {own && <><button type="button" disabled={busy} onClick={() => onBeginEdit(comment)}><ListingIcon name="edit" size={14} />Edit</button><button type="button" className="is-danger" disabled={busy} onClick={() => onDelete(commentId)}><ListingIcon name="trash" size={14} />Delete</button></>}
        </div>}
        {replyId === commentId && <form id={'reply-form-' + commentId} className="produce-discussion__inline-form" onSubmit={event => { event.preventDefault(); onReply(commentId); }}>
          <label htmlFor={'reply-comment-' + commentId}>Reply to {author}</label>
          <textarea id={'reply-comment-' + commentId} rows={3} maxLength={MAX_LENGTH} placeholder="Keep the conversation going…" value={replyText} disabled={busy} onChange={event => setReplyText(event.target.value)} />
          <div className="produce-discussion__inline-actions"><span>{replyText.length}/{MAX_LENGTH}</span><button type="button" className="produce-discussion__text-button" disabled={busy} onClick={onCancelReply}>Cancel</button><button type="submit" className="produce-discussion__small-submit" disabled={busy || !replyText.trim()}><ListingIcon name="send" size={14} />Post reply</button></div>
        </form>}
      </div>
    </div>
    {children.length > 0 && <div className={'produce-discussion__replies' + (depth > 0 ? ' is-flat' : '')}>
      {children.map(child => <CommentEntry key={child.comment_id} comment={child} depth={depth + 1} parentAuthor={author} visited={nextVisited}
        threads={threads} viewerId={viewerId} canPost={canPost} busy={busy}
        editingId={editingId} editingText={editingText} setEditingText={setEditingText}
        replyId={replyId} replyText={replyText} setReplyText={setReplyText}
        onBeginReply={onBeginReply} onCancelReply={onCancelReply} onReply={onReply}
        onBeginEdit={onBeginEdit} onCancelEdit={onCancelEdit} onEdit={onEdit} onDelete={onDelete} />)}
    </div>}
  </article>;
}

/** Mounted only while a listing's details dialog is open. */
export default function ListingDiscussion({ listingId, listingStatus, user }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [newText, setNewText] = useState('');
  const [replyId, setReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const viewerId = userIdOf(user);
  const role = String(user?.role || '').toLowerCase();
  const allowedRole = role === 'farmer' || role === 'buyer' || role === 'buyer/vendor';
  const canPost = Boolean(viewerId && allowedRole && String(listingStatus).toLowerCase() === 'active');

  const refresh = useCallback(async ({ initial = false } = {}) => {
    setRefreshing(true);
    if (initial) setLoading(true);
    try {
      const result = await commentsService.getForListing(listingId);
      if (result.success && Array.isArray(result.data)) { setComments(result.data); setError(''); }
      else setError(result.error || 'Could not load the discussion.');
      return result;
    } catch {
      setError('Could not load the discussion. Please try again.');
      return { success: false };
    } finally { setRefreshing(false); if (initial) setLoading(false); }
  }, [listingId]);

  useEffect(() => {
    let live = true;
    const load = async () => {
      const result = await commentsService.getForListing(listingId);
      if (!live) return;
      if (result.success && Array.isArray(result.data)) {
        setComments(result.data);
        setError('');
      } else {
        setError(result.error || 'Could not load the discussion.');
      }
      setLoading(false);
    };
    setLoading(true);
    load();
    // A recipient who was offline can refresh manually; when this dialog is open,
    // keep the conversation reasonably fresh without a websocket dependency.
    const timer = setInterval(load, 30000);
    return () => { live = false; clearInterval(timer); };
  }, [listingId]);

  const threads = useMemo(() => buildThreads(comments), [comments]);
  const activeCount = comments.filter((comment) => comment.status === 'Active').length;

  async function write(action, successMessage) {
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await action();
      if (!result.success) throw new Error(result.error || 'Request failed');
      const reloaded = await refresh();
      if (!reloaded.success) {
        setNotice('Saved successfully. Refresh the discussion to see the latest comments.');
      } else {
        setNotice(successMessage);
      }
      return true;
    } catch (err) {
      setError(err.message || 'Could not save your comment.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submitNew(event) {
    event.preventDefault();
    if (!canPost || !newText.trim() || busy) return;
    if (await write(() => commentsService.create(listingId, newText.trim()), 'Comment posted.')) {
      setNewText('');
    }
  }

  async function submitReply(parentId) {
    if (!canPost || !replyText.trim() || busy) return;
    if (await write(() => commentsService.create(listingId, replyText.trim(), parentId), 'Reply posted.')) {
      setReplyId(null); setReplyText('');
    }
  }

  async function submitEdit(commentId) {
    if (!editingText.trim() || busy) return;
    if (await write(() => commentsService.update(commentId, editingText.trim()), 'Comment updated.')) {
      setEditingId(null); setEditingText('');
    }
  }

  async function removeComment(commentId) {
    if (busy || !window.confirm('Delete this comment? Its replies will remain visible.')) return;
    await write(() => commentsService.remove(commentId), 'Comment deleted.');
  }

  useEffect(() => {
    const id = editingId !== null ? 'edit-comment-' + editingId : replyId !== null ? 'reply-comment-' + replyId : null;
    if (!id) return;
    const frame = window.requestAnimationFrame(() => {
      const field = document.getElementById(id);
      field?.focus({ preventScroll: true });
      field?.closest('form')?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [replyId, editingId]);

  const entryProps = {
    threads, viewerId, canPost, busy, editingId, editingText, setEditingText,
    replyId, replyText, setReplyText,
    onBeginReply: (id) => { setReplyId(id); setReplyText(''); setEditingId(null); },
    onCancelReply: () => { setReplyId(null); setReplyText(''); },
    onReply: submitReply,
    onBeginEdit: (comment) => { setEditingId(Number(comment.comment_id)); setEditingText(comment.content || ''); setReplyId(null); },
    onCancelEdit: () => { setEditingId(null); setEditingText(''); },
    onEdit: submitEdit,
    onDelete: removeComment,
  };

  return <section className="produce-discussion" aria-labelledby="produce-discussion-title">
    <header className="produce-discussion__header">
      <div><span className="produce-discussion__eyebrow"><ListingIcon name="message" size={16} />FROM THE COMMUNITY</span><h3 id="produce-discussion-title" tabIndex={-1}>Questions &amp; replies <span aria-label={activeCount + ' active messages'}>{activeCount}</span></h3><p>A good conversation starts with a question. Ask about availability, harvests, or pickup.</p></div>
      <button type="button" className="produce-discussion__refresh" onClick={() => void refresh()} disabled={busy || loading || refreshing}>{refreshing ? 'Refreshing…' : 'Refresh'}</button>
    </header>
    {error && <div className="produce-discussion__alert" role="alert">{error}</div>}
    {notice && <div className="produce-discussion__notice" role="status"><ListingIcon name="check" size={16} />{notice}</div>}
    {canPost ? <form className="produce-discussion__composer" onSubmit={submitNew}>
      <div className="produce-discussion__composer-heading"><span className="produce-discussion__avatar" aria-hidden="true">{(user?.name || 'A').slice(0, 1).toUpperCase()}</span><div><label htmlFor={'new-comment-' + listingId}>Start a conversation</label><p>Posting as {user?.name || 'an ArdNet member'}</p></div></div>
      <textarea id={'new-comment-' + listingId} rows={3} maxLength={MAX_LENGTH} placeholder="Ask about this produce…" value={newText} disabled={busy} onChange={event => setNewText(event.target.value)} />
      <div className="produce-discussion__composer-footer"><span>{newText.length}/{MAX_LENGTH} characters</span><button type="submit" disabled={busy || !newText.trim()}><ListingIcon name="send" size={16} />{busy ? 'Saving…' : 'Post comment'}</button></div>
    </form> : <div className="produce-discussion__sign-in" role="status"><ListingIcon name="message" size={20} /><div><strong>{String(listingStatus).toLowerCase() !== 'active' ? 'This conversation is read-only.' : 'Join the conversation.'}</strong><p>{String(listingStatus).toLowerCase() !== 'active' ? 'This listing is no longer active. You can still read its existing questions and replies.' : viewerId ? 'Comments are available to farmer and buyer/vendor accounts.' : <><Link to="/login">Sign in</Link> as a farmer or buyer/vendor to ask a question or leave a reply.</>}</p></div></div>}
    {loading ? <div className="produce-discussion__empty" role="status"><ListingIcon name="message" size={25} /><p>Loading the conversation…</p></div> : comments.length === 0 ? <div className="produce-discussion__empty"><ListingIcon name="message" size={27} /><h4>No questions yet</h4><p>Be the first to ask about this produce.</p></div> :
      <div className="produce-discussion__thread">{(threads.get(0) || []).map(comment => <CommentEntry key={comment.comment_id} comment={comment} depth={0} {...entryProps} />)}</div>}
  </section>;
}
