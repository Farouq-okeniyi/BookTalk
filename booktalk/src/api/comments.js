import apiClient from './client';

/**
 * Filter comments by postId
 * GET /api/posts/{postId}/comments
 */
export const filter = async ({ post_id, page = 0, size = 50 }) => {
  if (!post_id) return [];
  const { data } = await apiClient.get(`/posts/${post_id}/comments?page=${page}&size=${size}`);
  return data.content || [];
};

/**
 * Add a comment to a specific post
 * POST /api/posts/{postId}/comments
 */
export const create = async (payload) => {
  const { data } = await apiClient.post(`/posts/${payload.post_id}/comments`, {
    content: payload.body || payload.content,
  });
  return data;
};

/**
 * Delete a specific comment
 * DELETE /api/posts/{postId}/comments/{commentId}
 */
export const remove = async (id, post_id) => {
  if (!post_id) {
    console.warn('post_id required to delete comment in new API');
    return false;
  }
  await apiClient.delete(`/posts/${post_id}/comments/${id}`);
  return true;
};

export const commentsApi = {
  filter,
  create,
  remove,
};

export default commentsApi;
