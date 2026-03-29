import axios from 'axios';
import { toast } from '@/components/ui/use-toast';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ;

export const TOKEN_KEY = 'booktalk_token';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject JWT token into every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle global response errors and session expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Handle session expiration (401)
    // 1. Handle session expiration (401)
    // ONLY redirect if we are NOT already on the login page and NOT attempting to login
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    const isLoginPage = window.location.pathname === '/login';

    if (error.response?.status === 401 && !isLoginRequest && !isLoginPage) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // 2. Extract and clean error message
    // Prioritize backend-provided message, fallback to axios message or generic string
    let message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    
    // Strip "Error: " prefix if present (backend common pattern)
    message = message.replace(/^Error:\s*/i, '');

    // 3. Trigger global toast notification
    toast({
      title: 'Action Failed',
      description: message,
      variant: 'destructive',
    });

    return Promise.reject(error);
  }
);

export default apiClient;
