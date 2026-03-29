import apiClient from './client';

/**
 * Get the currently authenticated user's profile
 * GET /api/users/me
 */
export const getMe = async () => {
  const { data } = await apiClient.get('/users/me');
  return data;
};

/**
 * Update the authenticated user's profile
 * PUT /api/users/me
 * @param {Object} payload { name, bio, avatar }
 */
export const updateProfile = async (payload) => {
  // Translate fields from frontend components if needed (e.g. fullName -> name)
  const mappedPayload = {};
  if (payload.full_name || payload.fullName || payload.name) {
    mappedPayload.name = payload.full_name || payload.fullName || payload.name;
  }
  if (payload.bio !== undefined) mappedPayload.bio = payload.bio;
  if (payload.avatar !== undefined) mappedPayload.avatar = payload.avatar;

  const { data } = await apiClient.put('/users/me', mappedPayload);
  return data;
};

/**
 * Get another user's profile by username
 * GET /api/users/{username}
 */
export const getUserProfile = async (username) => {
  const { data } = await apiClient.get(`/users/${encodeURIComponent(username)}`);
  return data;
};

/**
 * Search for users by username or email
 * GET /api/users/search?query=...
 */
export const search = async (query) => {
  const { data } = await apiClient.get(`/users/search?query=${encodeURIComponent(query)}`);
  return data; // Array of UserProfileDto
};

export const usersApi = {
  getMe,
  updateProfile,
  getUserProfile,
  search,
};

export default usersApi;
