import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authApi, usersApi } from '@/api';
import { TOKEN_KEY } from '@/api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check if we have a valid token and fetch user
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      usersApi.getMe()
        .then((userData) => {
          // ensure backwards compatibility with UI expecting these property names
          userData.email = userData.email || localStorage.getItem('booktalk_user_email');
          userData.full_name = userData.name || userData.username;
          setUser(userData);
          setIsAuthenticated(true);
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
          setIsAuthenticated(false);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login with email + password
   * POST /api/auth/login
   */
  const login = useCallback(async ({ email, password }) => {
    const data = await authApi.login({ email, password });
    if (data.accessToken) {
      localStorage.setItem('booktalk_user_email', data.email); // For quick access

      // Map basic details from JWT payload immediately to unblock UI while full profile loads
      const basicUser = {
        id: data.id,
        username: data.username,
        email: data.email,
        full_name: data.username, 
      };
      setUser(basicUser);
      setIsAuthenticated(true);

      // Async fetch full profile in the background
      usersApi.getMe().then((fullUserData) => {
        fullUserData.email = fullUserData.email || data.email;
        fullUserData.full_name = fullUserData.name || fullUserData.username;
        setUser(fullUserData);
      }).catch(() => {});
    }
    return data;
  }, []);

  /**
   * Register a new account
   * POST /api/auth/signup
   */
  const register = useCallback(async ({ username, email, password }) => {
    const data = await authApi.register({ username, email, password });
    return data; // Typically returns a MessageResponse to check email for OTP
  }, []);

  /**
   * Verify OTP — on success, user will be redirected to Login
   * POST /api/auth/verify-email
   */
  const verifyOtp = useCallback(async ({ email, otp }) => {
    const data = await authApi.verifyOtp({ email, otp });
    return data; // Doesn't log in automatically in this API version
  }, []);

  /**
   * Logout — clears tokens and resets state
   */
  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('booktalk_user_email');
    window.location.href = '/login';
  }, []);

  /**
   * Refresh current user from server (e.g. after profile update)
   */
  const refreshUser = useCallback(async () => {
    const userData = await usersApi.getMe();
    userData.email = userData.email || localStorage.getItem('booktalk_user_email');
    userData.full_name = userData.name || userData.username;
    setUser(userData);
    return userData;
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      verifyOtp,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
