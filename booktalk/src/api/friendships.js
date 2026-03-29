import apiClient from './client';

/**
 * Retrieve a list of all currently accepted social connections
 * GET /api/friends
 */
export const filter = async () => {
  const { data } = await apiClient.get('/friends');
  // API returns an array of UserProfileDto
  return data || [];
};

/**
 * Dispatch a friendship invitation to the specified target username
 * POST /api/friends/request/{targetUsername}
 */
export const create = async (payload) => {
  const targetUsername = payload.target_username || payload.targetUsername;
  const { data } = await apiClient.post(`/friends/request/${encodeURIComponent(targetUsername)}`);
  return data;
};

/**
 * Accept or reject an incoming friendship invitation
 * POST /api/friends/respond/{friendshipId}?accept=true/false
 */
export const respond = async (friendshipId, accept) => {
  const { data } = await apiClient.post(`/friends/respond/${friendshipId}?accept=${accept}`);
  return data;
};

/**
 * Enable or mute activity notifications from a specific friend
 * POST /api/friends/{friendshipId}/toggle-notifications
 */
export const update = async (id, partial) => {
  // If notifications_enabled is being toggled
  if (partial.notifications_enabled !== undefined || partial.notificationsEnabled !== undefined) {
    const { data } = await apiClient.post(`/friends/${id}/toggle-notifications`);
    return data;
  }
  return true;
};

/**
 * Sever an existing social connection or cancel an outbound request
 * DELETE /api/friends/{friendshipId}
 */
export const remove = async (id) => {
  await apiClient.delete(`/friends/${id}`);
  return true;
};

export const friendshipsApi = {
  filter,
  create,
  respond,
  update,
  remove,
};

export default friendshipsApi;
