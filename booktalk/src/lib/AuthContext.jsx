import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authApi, usersApi } from '@/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await authApi.login({ email, password });
    
    localStorage.setItem('booktalk_user_email', data.email);

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
