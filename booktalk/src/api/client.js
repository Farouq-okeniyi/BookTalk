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
    const isSignUpRequest = originalRequest.url?.includes('/auth/signup');
    const isLoginPage = window.location.pathname.startsWith('/login');
    const isSignUpPage = window.location.pathname.startsWith('/signup') || window.location.pathname.startsWith('/register');
    
    // We only attempt to refresh if the user was supposedly authenticated.
    // This prevents /refresh-token calls on initial mount if the session was already dead.
    const hasAuthSession = localStorage.getItem('booktalk_authenticated') === 'true';

    if (
      error.response?.status === 401 && 
      !isLoginRequest && 
      !isRefreshRequest && 
      !isSignUpRequest &&
      hasAuthSession &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token using HttpOnly cookies
        await axios.post(`${BASE_URL}/auth/refresh-token`, {}, { withCredentials: true });
        
        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('booktalk_authenticated');
        // CRITICAL: Only redirect if we are NOT already on the login page to avoid loops
        if (!isLoginPage && !isSignUpPage) {
          window.location.href = '/login?session=expired';
        }
        return Promise.reject(refreshError);
      }
    } else if (error.response?.status === 401 && !isLoginRequest && !isSignUpRequest) {
      // If we got a 401 and didn't refresh (maybe because flag is missing), 
      // ensure the flag is definitely cleared.
      localStorage.removeItem('booktalk_authenticated');
      
      // If this was a protected route and we aren't on an auth page, redirect
      if (!isLoginPage && !isSignUpPage && !originalRequest.url?.includes('/users/me')) {
        window.location.href = '/login';
      }
    }

    // 2. Extract and clean error message
    // Prioritize backend-provided message, fallback to axios message or generic string
    let message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    
    // Strip "Error: " prefix if present (backend common pattern)
    message = message.replace(/^Error:\s*/i, '');

    // 3. Trigger global toast notification
    // Only show toast if not a 401 (handled silenty for background auth checks)
    // or if it's an explicit login failure where we want the user to see the error.
    const isMeRequest = originalRequest.url?.includes('/users/me');
    const skipToast = error.response?.status === 401 && (isMeRequest || isRefreshRequest);

    if (!skipToast && (error.response?.status !== 401 || isLoginRequest)) {
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
