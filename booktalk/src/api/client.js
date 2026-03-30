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

// 1. Request Interceptor: Attach the Access Token to every outgoing request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Handle global response errors and session expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // A. Handle session expiration (401)
    const isLoginRequest = originalRequest.url?.includes('/auth/login');
    const isRefreshRequest = originalRequest.url?.includes('/auth/refresh-token');
    const isSignUpRequest = originalRequest.url?.includes('/auth/signup');
    const isLoginPage = window.location.pathname.startsWith('/login');
    const isSignUpPage = window.location.pathname.startsWith('/signup') || window.location.pathname.startsWith('/register');
    
    // Check if we have an active session flag
    const hasAuthSession = localStorage.getItem('booktalk_authenticated') === 'true' || !!localStorage.getItem(TOKEN_KEY);

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
        // Attempt to refresh the token using HttpOnly cookies (withCredentials: true)
        const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh-token`, {}, { withCredentials: true });
        
        // Extract new Access Token from the response body (JSON)
        const newAccessToken = refreshResponse.data.accessToken || refreshResponse.data.token;
        
        if (newAccessToken) {
          localStorage.setItem(TOKEN_KEY, newAccessToken);
          localStorage.setItem('booktalk_authenticated', 'true');
          
          // Update the original request with the new token and retry
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('booktalk_authenticated');
        // Only redirect if we are NOT already on an auth page
        if (!isLoginPage && !isSignUpPage) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    } else if (error.response?.status === 401 && !isLoginRequest && !isSignUpRequest) {
      // Clear session data if refresh was skipped or not applicable
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('booktalk_authenticated');
      
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
