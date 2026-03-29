import apiClient from './client';

/**
 * Fetch the paginated chat history for a specific group
 * GET /api/groups/{groupId}/messages
 */
export const filter = async ({ group_id, page = 0, size = 50 }) => {
  if (!group_id) return [];
  const { data } = await apiClient.get(`/groups/${group_id}/messages?page=${page}&size=${size}`);
  return data.content || [];
};

/**
 * Broadcast a chat message to the specified group
 * POST /api/groups/{groupId}/messages
 */
export const create = async (payload) => {
  const { data } = await apiClient.post(`/groups/${payload.group_id}/messages`, {
    content: payload.body || payload.content,
  });
  return data;
};

export const messagesApi = {
  filter,
  create,
};

export default messagesApi;
