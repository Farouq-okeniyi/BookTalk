import apiClient, { TOKEN_KEY } from './client';

/**
 * Register a new user
 * POST /api/auth/signup
 */
export const register = async ({ username, email, password }) => {
  const { data } = await apiClient.post('/auth/signup', {
    username,
    email,
    password,
  });
  return data;
};

/**
 * Login with email and password
 * POST /api/auth/login
 */
export const login = async ({ email, password }) => {
  const { data } = await apiClient.post('/auth/login', { email, password });
  if (data.accessToken) {
    localStorage.setItem(TOKEN_KEY, data.accessToken);
  }
  return data;
};

/**
 * Verify OTP code after registration
 * POST /api/auth/verify-email
 */
export const verifyOtp = async ({ email, otp }) => {
  const { data } = await apiClient.post('/auth/verify-email', { email, otp });
  return data;
};

/**
 * Resend OTP to the user's email
 * (Fallback to forgot-password if the backend lacks a dedicated resend endpoint)
 */
export const resendOtp = async ({ email }) => {
  const { data } = await apiClient.post('/auth/forgot-password', { email });
  return data;
};

/**
 * Send forgot-password email
 * POST /api/auth/forgot-password?email=...
 */
export const forgotPassword = async ({ email }) => {
  const { data } = await apiClient.post('/auth/forgot-password', { email });
  return data;
};

/**
 * Reset password using token/otp from email
 * POST /api/auth/reset-password
 */
export const resetPassword = async ({ email, token, newPassword }) => {
  const { data } = await apiClient.post('/auth/reset-password', {
    email,
    otp: token,
    newPassword,
  });
  return data;
};

/**
 * Logout — clears token locally and notifies the server
 * POST /api/auth/logout
 */
export const logout = async () => {
  try {
    const refreshToken = localStorage.getItem('booktalk_refresh') || '';
    await apiClient.post('/auth/logout', { refreshToken });
  } catch (_) {
    // Ignore server errors on logout; we always clear locally
  } finally {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('booktalk_refresh');
  }
};

export const authApi = {
  register,
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  logout,
};

export default authApi;
