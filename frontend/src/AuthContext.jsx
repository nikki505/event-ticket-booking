import { createContext, useContext, useEffect, useState } from 'react';
import { api, saveToken, clearToken, getToken } from './api';

// Keeps track of who is signed in. I used context so I do not have to pass the user
// down through every single component as a prop.

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Requirement R2 AC4, staying signed in after a refresh.
  // The token is in localStorage, but I do not trust it just because it is there. I ask
  // the server who it belongs to. If it has expired the server says 401 and the api
  // helper clears it for me.
  useEffect(() => {
    async function restoreSession() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.me();
        setUser(data.user);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  async function login(email, password) {
    const data = await api.login({ email, password });
    saveToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(email, password, role) {
    const data = await api.register({ email, password, role });
    saveToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth has to be used inside AuthProvider');
  return ctx;
}
