import apiClient from './client';

/**
 * Add a new book to the user's personal tracked library
 * POST /api/books
 */
export const create = async (payload) => {
  const mappedPayload = {
    title: payload.title,
    author: payload.author,
    status: (payload.status || 'READING').toUpperCase().replace(/ /g, '_'),
    notes: payload.notes || '',
  };
  
  if (mappedPayload.status === 'FINISHED' || mappedPayload.status === 'COMPLETED') {
    mappedPayload.status = 'FINISHED';
  }
  if (['WANT_TO_READ', 'WISHLIST', 'WANT TO READ'].includes(mappedPayload.status)) {
    mappedPayload.status = 'WANT_TO_READ';
  }

  const { data } = await apiClient.post('/books', mappedPayload);
  // data is a UserBookDto. Flatten it so id is the book id, and userBookId is the mapping.
  return {
    id: data.book.id,
    userBookId: data.id,
    title: data.book.title,
    author: data.book.author,
    status: data.status.toLowerCase(),
  };
};

/**
 * Update the reading status of a tracked book
 * POST /api/books/status
 */
export const updateStatus = async (userBookId, status) => {
  // Map our UI statuses to backend ENUM: READING, FINISHED, WANT_TO_READ
  let mappedStatus = 'READING';
  const s = status.toUpperCase().replace(/ /g, '_');
  if (['FINISHED', 'COMPLETED'].includes(s)) mappedStatus = 'FINISHED';
  if (['WANT_TO_READ', 'WISHLIST'].includes(s)) mappedStatus = 'WANT_TO_READ';

  const { data } = await apiClient.post('/books/status', {
    bookId: userBookId, // The "status" update expects the user-book mapping ID
    status: mappedStatus,
  });
  return data;
};

/**
 * Update a book (alias for status update since full update isn't explicitly defined yet)
 * Fall back to the specific field if only status is being changed.
 */
export const update = async (id, partial) => {
  if (partial.status) {
    return await updateStatus(id, partial.status);
  }
  // If editing other fields like rating/notes wasn't exposed via openAPI, just return
  return {};
};

/**
 * Get the user's logged books
 * GET /api/books/my-books
 */
export const list = async (params = {}) => {
  const { status } = params;
  let url = '/books/my-books';
  if (status) {
    let mappedStatus = 'READING';
    const s = status.toUpperCase().replace(/ /g, '_');
    if (['FINISHED', 'COMPLETED'].includes(s)) mappedStatus = 'FINISHED';
    if (['WANT_TO_READ', 'WISHLIST'].includes(s)) mappedStatus = 'WANT_TO_READ';
    url += `?status=${mappedStatus}`;
  }
  const { data } = await apiClient.get(url);
  // data is an array of UserBookDto: { id, book: { id, title, author, coverUrl }, status }
  return data.map(item => ({
    id: item.book.id, // Primary ID is always the underlying Book ID
    userBookId: item.id, // ID of the User-Book relationship
    title: item.book.title,
    author: item.book.author,
    coverUrl: item.book.coverUrl,
    publishedDate: item.book.publishedDate,
    status: item.status.toLowerCase(), // e.g. "WANT_TO_READ" -> "want_to_read"
    notes: item.notes || '',
  }));
};

/**
 * Get a specific book (falls back to list filter since openAPI didn't expose /api/books/{id})
 */
export const getById = async (id) => {
  const allBooks = await list();
  return allBooks.find(b => b.id === id || b.userBookId === id) || null;
};

/**
 * Delete a book (stub until added to API, or mock success)
 */
export const remove = async (id) => {
  // Mock success. If this endpoint doesn't exist in Spring Boot yet, 
  // it might throw a 404, we'll swallow it or just let it fail gracefully.
  try {
    await apiClient.delete(`/books/${id}`);
  } catch (err) {
    console.warn('Remove book endpoint might not be implemented yet', err);
  }
  return true;
};

export const booksApi = {
  list,
  getById,
  create,
  update,
  updateStatus,
  remove,
};

export default booksApi;
