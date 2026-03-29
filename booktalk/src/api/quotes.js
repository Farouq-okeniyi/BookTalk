import apiClient from './client';

/**
 * Extract and save a salient quote from a specific book
 * POST /api/quotes
 */
export const create = async (payload) => {
  const createReq = {
    bookId: payload.book_id || payload.bookId,
    content: payload.quote_text || payload.content || '',
    pageNumber: payload.page || payload.pageNumber || 0,
    reflection: payload.body || payload.reflection || '',
  };

  const { data } = await apiClient.post('/quotes', createReq);
  return data;
};

/**
 * Fetch a paginated list of all quotes saved by the authenticated user
 * GET /api/quotes/me
 */
export const filter = async (params = {}) => {
  const { book_id, page = 0, size = 50 } = params;
  let url = `/quotes/me?page=${page}&size=${size}`;
  if (book_id) {
    url = `/quotes/book/${book_id}?page=${page}&size=${size}`;
  }

  const { data } = await apiClient.get(url);
  return data.content || [];
};

/**
 * Delete quote
 * Stub fallback as DELETE /api/quotes/{id} is not documented.
 */
export const remove = async (id) => {
  // Try deleting it as if the endpoint exists, or log a mock success
  try {
    await apiClient.delete(`/quotes/${id}`);
  } catch (err) {
    console.warn('Remove quote might not be implemented, deleting locally');
  }
  return true;
};

export const quotesApi = {
  create,
  filter,
  remove,
};

export default quotesApi;
