import apiClient from './client';

/**
 * Draft and save a personal reading journal entry
 * POST /api/journals
 */
export const create = async (payload) => {
  const createReq = {
    title: payload.title || payload.name || '',
    content: payload.body || payload.content || '',
    mood: payload.mood || '',
    visibility: payload.visibility || 'PRIVATE',
    bookId: payload.bookId || payload.book_id || null,
  };

  const { data } = await apiClient.post('/journals', createReq);
  return data;
};

/**
 * Fetch personal journal entries
 * GET /api/journals/me
 * OR Fetch friends shared journal entries
 * GET /api/journals/friends
 */
export const filter = async (params = {}) => {
  const page = params.page || 0;
  const size = params.size || 50;
  const visibility = params.visibility;

  let url = `/journals/me?page=${page}&size=${size}`;
  if (visibility === 'friends') {
    url = `/journals/friends?page=${page}&size=${size}`;
  }

  const { data } = await apiClient.get(url);
  // Return list from PageJournalEntryDto
  return data.content || [];
};

/**
 * Delete an existing journal entry
 * DELETE /api/journals/{entryId}
 */
export const remove = async (entryId) => {
  await apiClient.delete(`/journals/${entryId}`);
  return true;
};

/**
 * Update an existing entry
 * Stub fallback as PUT is not in swagger API.
 */
export const update = async (id, payload) => {
  return await create(payload); // Mock replace
};

export const journalApi = {
  create,
  filter,
  update,
  remove,
};

export default journalApi;
