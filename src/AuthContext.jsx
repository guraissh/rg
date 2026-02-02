import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'redgifs_auth';

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Check if token is still valid
        if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
          setAuth(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Save auth to localStorage when it changes
  useEffect(() => {
    if (auth) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [auth]);

  const login = useCallback(async (refreshToken) => {
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Authentication failed');
    }

    const authData = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      idToken: data.id_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    };

    setAuth(authData);
    return authData;
  }, []);

  const logout = useCallback(() => {
    setAuth(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!auth?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: auth.refreshToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setAuth(null);
      throw new Error(data.error || 'Token refresh failed');
    }

    const authData = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || auth.refreshToken,
      idToken: data.id_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    };

    setAuth(authData);
    return authData;
  }, [auth]);

  const getToken = useCallback(async () => {
    if (!auth) return null;

    // Refresh if token expires in less than 5 minutes
    if (auth.expiresAt && Date.now() > auth.expiresAt - 5 * 60 * 1000) {
      try {
        const newAuth = await refresh();
        return newAuth.idToken;
      } catch {
        return auth.idToken;
      }
    }

    return auth.idToken;
  }, [auth, refresh]);

  return (
    <AuthContext.Provider value={{
      auth,
      isAuthenticated: !!auth,
      isLoading,
      login,
      logout,
      refresh,
      getToken,
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
