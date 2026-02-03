import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check server auth status on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/status');
        const data = await response.json();
        setIsAuthenticated(data.mode === 'authenticated');
      } catch (e) {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    }
    checkAuth();
  }, []);

  const login = useCallback(async (refreshToken) => {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Login failed');
    }

    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await fetch('/auth/logout', { method: 'POST' });
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
