import apiClient from './client';

/**
 * Retrieve a chronological feed of posts and reposts
 * GET /api/posts/feed
 */
export const list = async (params = {}) => {
  const { page = 0, size = 50, sort } = params;
  let url = `/posts/feed?page=${page}&size=${size}`;
  if (sort) {
    url += `&sort=${sort}`;
  }
  const { data } = await apiClient.get(url);
  // data is a PagePostDto. Return its content array.
  return data.content || [];
};

/**
 * Filter posts locally (shim for backwards compatibility)
 */
export const filter = async (params = {}) => {
  let allPosts = await list({ size: 200 }); // fetch a large chunk
  
  if (params.author_email) {
    allPosts = allPosts.filter(p => p.user?.email === params.author_email || p.user?.username === params.author_email);
  }
  return allPosts;
};

/**
 * Publish a new text post or book review
 * POST /api/posts
 */
export const create = async (payload) => {
  // payload might still have old shape: quote_text, book_title, body...
  // Map it to CreatePostRequest: { content, visibility, quoteId, bookId }
  const createReq = {
    content: payload.body || payload.content || '',
    visibility: payload.visibility || 'PUBLIC',
  };
  if (payload.quoteId) createReq.quoteId = payload.quoteId;
  if (payload.bookId) createReq.bookId = payload.bookId;

  const { data } = await apiClient.post('/posts', createReq);
  return data;
};

/**
 * Toggle like for a post (smart fallback to the correct HTTP method if user knows state)
 */
export const toggleLike = async (postId, userEmail, currentLikedByMe) => {
  if (currentLikedByMe === undefined) {
    // If we don't know, we'll try to POST like. If it fails (maybe already liked?), we can't do much.
    // The preferred way is the UI passes `likedByMe`.
    try {
      await apiClient.post(`/posts/${postId}/like`);
      return true;
    } catch (err) {
      await apiClient.delete(`/posts/${postId}/like`);
      return false;
    }
  }

  if (currentLikedByMe) {
    await apiClient.delete(`/posts/${postId}/like`);
    return false;
  } else {
    await apiClient.post(`/posts/${postId}/like`);
    return true;
  }
};

/**
 * Share an existing post to your feed
 * POST /api/posts/{postId}/repost
 */
export const repost = async (postId, quoteText = '') => {
  let url = `/posts/${postId}/repost`;
  if (quoteText) {
    url += `?content=${encodeURIComponent(quoteText)}`;
  }
  const { data } = await apiClient.post(url);
  return data;
};

/**
 * Delete an existing post
 * DELETE /api/posts/{postId}
 */
export const remove = async (postId) => {
  await apiClient.delete(`/posts/${postId}`);
  return true;
};

/**
 * Update a post (stub map)
 * Put/Update isn't officially in the swagger for posts besides like/repost.
 */
export const update = async (id, payload) => {
  return await create(payload); // fallback stub
};

/**
 * Get single post (fallback to feed search since GET /api/posts/{postId} is missing in swagger)
 */
export const getById = async (id) => {
  const feed = await list({ size: 100 });
  return feed.find(p => p.id === id) || null;
};

export const postsApi = {
  list,
  getById,
  create,
  update,
  remove,
  toggleLike,
  repost,
};

export default postsApi;
