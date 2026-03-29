import apiClient from './client';

/**
 * Retrieve summarized activity statistics for the authenticated user
 * GET /api/dashboard
 */
export const getStats = async () => {
  const { data } = await apiClient.get('/dashboard');
  // Returns DashboardDto { totalBooksRead, totalQuotesSaved, totalPostsMade, totalLikesReceived, totalCommentsReceived, activeDaysStreak }
  return data || {
    totalBooksRead: 0,
    totalQuotesSaved: 0,
    totalPostsMade: 0,
    totalLikesReceived: 0,
    totalCommentsReceived: 0,
    activeDaysStreak: 0,
  };
};

export const dashboardApi = {
  getStats,
};

export default dashboardApi;
