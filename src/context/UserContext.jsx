import { createContext, useContext, useState, useCallback } from 'react';
import {
  getCurrentUser,
  getCurrentUserKey,
  loginUser,
  registerUser,
  resetPassword,
  logout as storageLogout,
} from '../utils/storage';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser());
  const [userKey, setUserKey] = useState(() => getCurrentUserKey());

  const login = useCallback((username, password) => {
    const result = loginUser(username, password);
    if (result.success) {
      setUser(result.displayName);
      setUserKey(username.toLowerCase());
    }
    return result;
  }, []);

  const register = useCallback((username, password) => {
    return registerUser(username, password);
  }, []);

  const reset = useCallback((username, newPassword) => {
    return resetPassword(username, newPassword);
  }, []);

  const logoutUser = useCallback(() => {
    storageLogout();
    setUser(null);
    setUserKey(null);
  }, []);

  return (
    <UserContext.Provider
      value={{ user, userKey, login, register, reset, logout: logoutUser }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
}
