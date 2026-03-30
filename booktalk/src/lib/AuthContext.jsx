import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authApi, usersApi } from '@/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only attempt to fetch the user if we have an authentication flag set.
    // This prevents unnecessary /me calls before login or after manual logout.
    const hasAuthSession = localStorage.getItem('booktalk_authenticated') === 'true';
    const isAuthPage = window.location.pathname.startsWith('/login') || 
                      window.location.pathname.startsWith('/register') ||
                      window.location.pathname.startsWith('/signup');
    
    // If we're already on an auth page, don't try to background-check /me 
    // to avoid triggering redirects or session-expired toasts prematurely.
    if (!hasAuthSession || isAuthPage) {
      setIsLoading(false);
      return;
    }

    usersApi.getMe()
      .then((userData) => {
        userData.email = userData.email || localStorage.getItem('booktalk_user_email');
        userData.full_name = userData.name || userData.username;
        setUser(userData);
        setIsAuthenticated(true);
      })
      .catch((error) => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('booktalk_authenticated');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await authApi.login({ email, password });
    
    localStorage.setItem('booktalk_user_email', data.email);
    localStorage.setItem('booktalk_authenticated', 'true');

    const basicUser = {
      id: data.id,
      username: data.username,
      email: data.email,
      full_name: data.username || data.name, 
    };
    setUser(basicUser);
    setIsAuthenticated(true);

    usersApi.getMe().then((fullUserData) => {
      fullUserData.email = fullUserData.email || data.email;
      fullUserData.full_name = fullUserData.name || fullUserData.username;
      setUser(fullUserData);
    }).catch(() => {});
    
    return data;
  }, []);

  const register = useCallback(async ({ username, email, password }) => {
    const data = await authApi.register({ username, email, password });
    return data; 
  }, []);

  const verifyOtp = useCallback(async ({ email, otp }) => {
    const data = await authApi.verifyOtp({ email, otp });
    return data; 
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('booktalk_user_email');
    localStorage.removeItem('booktalk_authenticated');
    window.location.href = '/login';
  }, []);

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
