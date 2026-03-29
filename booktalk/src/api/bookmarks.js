import apiClient from './client';

/**
 * Retrieve a paginated list of all posts the user has bookmarked
 * GET /api/bookmarks
 */
export const filter = async ({ page = 0, size = 50 } = {}) => {
  const { data } = await apiClient.get(`/bookmarks?page=${page}&size=${size}`);
  return data.content || [];
};

/**
 * Bookmark a specific post
 * POST /api/bookmarks/{postId}
 */
export const create = async (payload) => {
  const postId = payload.post_id || payload.postId;
  await apiClient.post(`/bookmarks/${postId}`);
  return true;
};

/**
 * Remove a bookmark
 * DELETE /api/bookmarks/{postId}
 */
export const remove = async (postId) => {
  await apiClient.delete(`/bookmarks/${postId}`);
  return true;
};

export const bookmarksApi = {
  filter,
  create,
  remove,
};

export default bookmarksApi;
