import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, logoutUser } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      try {
        const user = await getCurrentUser();
        if (active) {
          setCurrentUser(user);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setCurrentUser(null);
          // Session doesn't exist or is invalid - this is expected
          setError(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    try {
      await logoutUser();
      setCurrentUser(null);
      setError(null);
    } catch (err) {
      setError(err?.message || 'Logout failed');
      throw err;
    }
  }

  async function login(user) {
    setCurrentUser(user);
    setError(null);
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        error,
        logout,
        login,
        isAuthenticated: !!currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
