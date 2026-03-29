import apiClient from './client';

/**
 * Retrieve a list of all active reminders configured by the user
 * GET /api/reminders
 */
export const list = async () => {
  const { data } = await apiClient.get('/reminders');
  // Returns ReminderDto[]
  return data || [];
};

/**
 * Schedule a recurring or one-off reading reminder
 * POST /api/reminders
 */
export const create = async (payload) => {
  // Extract and format time string (HH:mm:ss)
  let timeStr = '12:00:00';
  if (typeof payload.scheduleTime === 'string') {
    timeStr = payload.scheduleTime;
  } else if (payload.scheduleTime && typeof payload.scheduleTime.hour !== 'undefined') {
    const h = String(payload.scheduleTime.hour).padStart(2, '0');
    const m = String(payload.scheduleTime.minute || 0).padStart(2, '0');
    const s = String(payload.scheduleTime.second || 0).padStart(2, '0');
    timeStr = `${h}:${m}:${s}`;
  } else if (typeof payload.hour !== 'undefined') {
    const h = String(payload.hour).padStart(2, '0');
    const m = String(payload.minute || 0).padStart(2, '0');
    timeStr = `${h}:${m}:00`;
  }

  const createReq = {
    type: payload.type || 'DAILY',
    scheduleTime: timeStr,
    dayOfWeek: Math.max(1, Math.min(7, parseInt(payload.dayOfWeek || payload.day_of_week || 1))), // Ensure 1-7
  };

  const { data } = await apiClient.post('/reminders', createReq);
  return data;
};

/**
 * Update reminder (fallback to create since there is no put endpoint in swagger)
 */
export const update = async (id, payload) => {
  // Can delete the old one and create a new one, or just call create if backend handles duplicates.
  await remove(id);
  const data = await create(payload);
  return data;
};

/**
 * Remove an existing reminder
 * DELETE /api/reminders/{reminderId}
 */
export const remove = async (reminderId) => {
  await apiClient.delete(`/reminders/${reminderId}`);
  return true;
};

export const remindersApi = {
  list,
  create,
  update,
  remove,
};

export default remindersApi;
