import axios from 'axios';
import { toast } from '@/components/ui/use-toast';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ;

export const TOKEN_KEY = 'booktalk_token';
export const REFRESH_TOKEN_KEY = 'booktalk_refresh';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// NOTE: In cookie-based auth, we no longer need the request interceptor
// to inject Authorization headers. The browser handles it automatically.

// Handle global response errors and session expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 1. Handle session expiration (401)
    const isLoginRequest = originalRequest.url?.includes('/auth/login');
    const isRefreshRequest = originalRequest.url?.includes('/auth/refresh-token');
    const isLoginPage = window.location.pathname === '/login';

    if (error.response?.status === 401 && !isLoginRequest && !isRefreshRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token using HttpOnly cookies
        // The browser will automatically send the refreshToken cookie
        await axios.post(`${BASE_URL}/auth/refresh-token`, {}, { withCredentials: true });
        
        // Retry the original request (it will now use the new accessToken cookie)
        return apiClient(originalRequest);
      } catch (refreshError) {
        if (!isLoginPage) {
          window.location.href = '/login?session=expired';
        }
        return Promise.reject(refreshError);
      }
    }

    // 2. Extract and clean error message
    // Prioritize backend-provided message, fallback to axios message or generic string
    let message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    
    // Strip "Error: " prefix if present (backend common pattern)
    message = message.replace(/^Error:\s*/i, '');

    // 3. Trigger global toast notification
    // Only show toast if not a 401 (which we handled above) or if refresh failed
    if (error.response?.status !== 401 || isLoginRequest || isRefreshRequest) {
      toast({
        title: 'Action Failed',
        description: message,
        variant: 'destructive',
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
