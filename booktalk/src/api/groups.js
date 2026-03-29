import apiClient from './client';

/**
 * Instantiate a new private or public reading group
 * POST /api/groups
 */
export const create = async (payload) => {
  const { data } = await apiClient.post('/groups', {
    name: payload.name || payload.title,
    description: payload.description || '',
  });
  return data;
};

/**
 * Retrieve a paginated list of all groups the authenticated user belongs to
 * GET /api/groups/me
 */
export const list = async ({ page = 0, size = 50 } = {}) => {
  const { data } = await apiClient.get(`/groups/me?page=${page}&size=${size}`);
  return data.content || [];
};

/**
 * Alias for backward compatibility
 */
export const filter = list;

/**
 * Leave an existing group
 * DELETE /api/groups/{groupId}/leave
 */
export const leave = async (groupId) => {
  await apiClient.delete(`/groups/${groupId}/leave`);
  return true;
};

/**
 * Alias for remove mapping to leave
 */
export const remove = leave;

/**
 * Invite a member to the group
 * POST /api/groups/{groupId}/invite?targetUsername={username}
 */
export const inviteMember = async (groupId, targetUsername) => {
  await apiClient.post(`/groups/${groupId}/invite?targetUsername=${encodeURIComponent(targetUsername)}`);
  return true;
};

/**
 * Get group single (fallback)
 */
export const getById = async (id) => {
  const allGroups = await list({ size: 100 });
  return allGroups.find(g => g.id === id) || null;
};

export const groupsApi = {
  create,
  list,
  filter,
  leave,
  remove,
  inviteMember,
  getById,
};

export default groupsApi;
