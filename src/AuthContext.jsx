import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'redgifs_auth';
const REFRESH_BUFFER = 5 * 60 * 1000; // Refresh 5 minutes before expiration

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimeoutRef = useRef(null);
  const isRefreshingRef = useRef(false);

  // Load auth from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Check if token is still valid (with buffer for refresh)
        if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
          setAuth(parsed);
        } else if (parsed.refreshToken) {
          // Token expired but we have refresh token - try to refresh
          performRefresh(parsed.refreshToken);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Perform token refresh
  const performRefresh = async (refreshToken) => {
    if (isRefreshingRef.current) return null;
    isRefreshingRef.current = true;

    try {
      const response = await fetch('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data = await response.json();

      if (response.ok) {
        const authData = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token || refreshToken,
          idToken: data.id_token,
          expiresAt: Date.now() + (data.expires_in * 1000),
        };
        setAuth(authData);
        return authData;
      } else {
        setAuth(null);
        return null;
      }
    } catch {
      setAuth(null);
      return null;
    } finally {
      isRefreshingRef.current = false;
    }
  };

  // Automatic token refresh scheduler
  useEffect(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    if (!auth?.expiresAt || !auth?.refreshToken) return;

    const timeUntilRefresh = auth.expiresAt - Date.now() - REFRESH_BUFFER;

    if (timeUntilRefresh <= 0) {
      // Token is expired or about to expire, refresh now
      performRefresh(auth.refreshToken);
      return;
    }

    // Schedule refresh before token expires
    refreshTimeoutRef.current = setTimeout(() => {
      performRefresh(auth.refreshToken);
    }, timeUntilRefresh);

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [auth?.expiresAt, auth?.refreshToken]);

  // Save auth to localStorage when it changes
  useEffect(() => {
    if (auth) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [auth]);

  const login = useCallback(async (refreshToken) => {
    // Reset refreshing flag to allow login attempt
    isRefreshingRef.current = false;

    const result = await performRefresh(refreshToken);
    if (!result) {
      throw new Error('Authentication failed');
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    setAuth(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!auth?.refreshToken) {
      throw new Error('No refresh token available');
    }
    const result = await performRefresh(auth.refreshToken);
    if (!result) {
      throw new Error('Token refresh failed');
    }
    return result;
  }, [auth?.refreshToken]);

  const getToken = useCallback(async () => {
    if (!auth) return null;

    // If token expires soon, trigger refresh and return current token
    // The automatic refresh will handle getting a new one
    if (auth.expiresAt && Date.now() > auth.expiresAt - REFRESH_BUFFER) {
      // Trigger refresh in background if not already refreshing
      if (!isRefreshingRef.current && auth.refreshToken) {
        performRefresh(auth.refreshToken);
      }
    }

    return auth.idToken;
  }, [auth]);

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
