import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token/user (Mocking for now)
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      // Mock Login Logic based on the prompt's default accounts
      if (username === 'admin' && password === 'Admin@123') {
        setUser({ username, role: 'ADMIN', name: 'Admin User' });
        setIsLoading(false);
        return { success: true };
      } else if (username === 'pharmacist' && password === 'Pharmacy@123') {
        setUser({ username, role: 'PHARMACIST', name: 'Pharmacist User' });
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, message: 'Invalid credentials' };
      }
    } catch (e) {
      setIsLoading(false);
      return { success: false, message: 'Login failed' };
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
