import { createContext, useContext, useState, useEffect } from 'react';
import axiosClient, { setTokens, clearTokens } from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const persistSession = (data) => {
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await axiosClient.post('/auth/login', { email, password });
      persistSession(data);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ username, email, password, bio }) => {
    setLoading(true);
    try {
      const { data } = await axiosClient.post('/auth/register', { username, email, password, bio });
      persistSession(data);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await axiosClient.post('/auth/logout', { refreshToken });
      }
    } catch {
      // even if the server call fails, still clear the local
      // session 
    }
    clearTokens();
    setUser(null);
  };

    const updateUser = (partialUser) => {
    setUser((prev) => {
      const next = { ...prev, ...partialUser };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    setInitializing(false);
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => setUser(null);
    window.addEventListener('auth:sessionExpired', handleSessionExpired);
    return () => window.removeEventListener('auth:sessionExpired', handleSessionExpired);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, initializing, login, register, logout, updateUser, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
