import apiClient from '../apiClient';

// Uses the shared API client so requests use the active tab's Bearer token.
// Backend routes were verified in Phase 4B/4B.1.
export const commentsService = {
  getForListing(listingId) {
    return apiClient.get(`/api/listings/${encodeURIComponent(listingId)}/comments`);
  },
  create(listingId, content, parentCommentId = null) {
    return apiClient.post(`/api/listings/${encodeURIComponent(listingId)}/comments`, {
      content,
      ...(parentCommentId == null ? {} : { parent_comment_id: parentCommentId }),
    });
  },
  update(commentId, content) {
    return apiClient.put(`/api/comments/${encodeURIComponent(commentId)}`, { content });
  },
  remove(commentId) {
    return apiClient.delete(`/api/comments/${encodeURIComponent(commentId)}`);
  },
};

export default commentsService;
