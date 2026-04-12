import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { login as loginService } from '../services/authService';

const AuthContext = createContext(null);

const loadFromStorage = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    return { user, token };
  } catch {
    return { user: null, token: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => loadFromStorage().user);
  const [token, setToken] = useState(() => loadFromStorage().token);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await loginService(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'admin';
  const isTeamOwner = user?.role === 'team_owner';
  const isAuthenticated = !!token;
  const isPendingApproval = user?.approvalStatus === 'pending';

  return (
    <AuthContext.Provider value={{ user, token, loading, isAdmin, isTeamOwner, isAuthenticated, isPendingApproval, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
