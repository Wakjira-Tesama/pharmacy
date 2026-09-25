import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in when the app starts
  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.data);
        } else {
          await AsyncStorage.removeItem('userToken');
        }
      }
    } catch (e) {
      console.error('Failed to fetch user token or verify user', e);
      await AsyncStorage.removeItem('userToken');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkToken();
  }, []);

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      
      if (response.data.success) {
        await AsyncStorage.setItem('userToken', response.data.data.token);
        setUser(response.data.data.user);
        setIsLoading(false);
        return { success: true };
      }
    } catch (e) {
      setIsLoading(false);
      return { 
        success: false, 
        message: e.response?.data?.message || 'Login failed. Check connection.' 
      };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem('userToken');
      setUser(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name, username, password, role) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', { name, username, password, role });
      
      if (response.data.success) {
        await AsyncStorage.setItem('userToken', response.data.data.token);
        setUser(response.data.data.user);
        setIsLoading(false);
        return { success: true };
      }
    } catch (e) {
      setIsLoading(false);
      return { 
        success: false, 
        message: e.response?.data?.message || 'Registration failed. Check connection.' 
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
