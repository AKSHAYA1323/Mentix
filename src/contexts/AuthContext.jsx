import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  const persistAuth = (user, authToken) => {
    localStorage.setItem('userLoggedIn', 'true');
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('token', authToken);
    setIsLoggedIn(true);
    setUserEmail(user.email);
    setUserName(user.name);
    setToken(authToken);
  };

  useEffect(() => {
    const loggedIn = localStorage.getItem('userLoggedIn');
    const email = localStorage.getItem('userEmail');
    const name = localStorage.getItem('userName');
    const storedToken = localStorage.getItem('token');
    if (loggedIn === 'true' && email && storedToken) {
      setIsLoggedIn(true);
      setUserEmail(email);
      setUserName(name || '');
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(buildApiUrl('/api/auth/login'), {
        email: email.trim().toLowerCase(),
        password,
      });
      const { token, user } = res.data;
      persistAuth(user, token);
      return user;
    } catch (err) {
      if (err.response?.data?.msg) {
        throw new Error(err.response.data.msg);
      }
      throw new Error('Unable to reach login service. Please start the backend server on port 5000.');
    }
  };

  const register = async ({ name, email, password }) => {
    try {
      const res = await axios.post(buildApiUrl('/api/auth/register'), {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      const { token, user } = res.data;
      persistAuth(user, token);
      return user;
    } catch (err) {
      if (err.response?.data?.msg) {
        throw new Error(err.response.data.msg);
      }
      throw new Error('Unable to reach signup service. Please start the backend server on port 5000.');
    }
  };

  const logout = () => {
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserEmail('');
    setUserName('');
    setToken('');
  };

  const value = {
    isLoggedIn,
    userEmail,
    userName,
    token,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
