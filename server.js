import express from 'express';
import cors from 'cors';
import { fetchWrapper } from './fetch';
const app = express();
const PORT = 3001;

// Your refresh token from redgifs.com (grab from browser cookies/storage after logging in)
const USER_REFRESH_TOKEN = process.env.REDGIFS_REFRESH_TOKEN || null;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cache for authenticated user token
let userTokenCache = {
  accessToken: null,
  expiresAt: 0
};

// Cache for anonymous fallback token
let anonTokenCache = {
  token: null,
  sessionId: null,
  expiresAt: 0
};

// Get authenticated user access token (refreshes automatically via Kinde OAuth)
async function getUserAccessToken(forceRefresh = false) {
  if (!USER_REFRESH_TOKEN) {
    return null;
  }

  if (!forceRefresh && userTokenCache.accessToken && Date.now() < userTokenCache.expiresAt) {
    return userTokenCache.accessToken;
  }

  console.log('Refreshing user access token...');
  const response = await fetchWrapper('https://auth2.redgifs.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
      'Origin': 'https://www.redgifs.com',
      'Referer': 'https://www.redgifs.com/',
      'Cookie': `refresh_token=${USER_REFRESH_TOKEN}`
    },
    body: new URLSearchParams({
      client_id: 'e06c34dac7654821bcb37e0393b54350',
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to refresh user token:', response.status, errorText);
    return null;
  }

  const data = await response.json();
  console.log('Refresh response keys:', Object.keys(data));
  // RedGifs API expects the id_token (JWT), not the access_token
  const token = data.id_token || data.access_token;

  if (!token) {
    console.error('No token in refresh response:', Object.keys(data));
    return null;
  }

  userTokenCache = {
    accessToken: token,
    expiresAt: Date.now() + ((data.expires_in || 82800) * 1000)
  };

  console.log('User token refreshed successfully');
  return userTokenCache.accessToken;
}

// Get anonymous access token (fallback)
async function getAnonAccessToken(forceRefresh = false) {
  if (!forceRefresh && anonTokenCache.token && Date.now() < anonTokenCache.expiresAt) {
    return { token: anonTokenCache.token, sessionId: anonTokenCache.sessionId };
  }

  const url = new URL('https://api.redgifs.com/v2/auth/temporary');
  if (anonTokenCache.sessionId) {
    url.searchParams.append('session_id', anonTokenCache.sessionId);
  }

  const response = await fetchWrapper(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
      'Origin': 'https://www.redgifs.com',
      'Referer': 'https://www.redgifs.com/'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to get access token');
  }

  const data = await response.json();
  anonTokenCache = {
    token: data.token,
    sessionId: data.session,
    expiresAt: Date.now() + (23 * 60 * 60 * 1000)
  };

  return { token: anonTokenCache.token, sessionId: anonTokenCache.sessionId };
}

// Get best available token (user token preferred, anon fallback)
async function getAccessToken(forceRefresh = false) {
  const userToken = await getUserAccessToken(forceRefresh);
  if (userToken) {
    return { token: userToken, sessionId: null, isAuthenticated: true };
  }

  const anon = await getAnonAccessToken(forceRefresh);
  return { ...anon, isAuthenticated: false };
}

// Proxy endpoint for RedGifs API
app.all('/api/*', async (req, res) => {
  const RETRY_LIMIT = 3;

  async function makeRequest(retry = 0) {
    const path = req.params[0];
    const forceRefresh = retry > 0;
    const { token, sessionId, isAuthenticated } = await getAccessToken(forceRefresh);

    const url = new URL(`https://api.redgifs.com/${path}`);

    // Add query parameters
    Object.entries(req.query).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const fetchOptions = {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
        'Origin': 'https://www.redgifs.com',
        'Referer': 'https://www.redgifs.com/'
      }
    };

    // Add session ID header for anonymous sessions
    if (sessionId && !isAuthenticated) {
      fetchOptions.headers['X-Session-Id'] = sessionId;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetchWrapper(url.toString(), fetchOptions);
    const data = await response.json();

    // Handle 401 with retry logic
    if (response.status === 401 && retry < RETRY_LIMIT) {
      console.debug(`Request failed with 401, refreshing token, retry=${retry + 1}`);
      // Clear cached tokens to force refresh
      userTokenCache.expiresAt = 0;
      anonTokenCache.expiresAt = 0;
      return makeRequest(retry + 1);
    }

    return { status: response.status, data };
  }

  try {
    const { status, data } = await makeRequest();
    res.status(status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth status endpoint
app.get('/status', async (req, res) => {
  const hasRefreshToken = !!USER_REFRESH_TOKEN;
  const userToken = await getUserAccessToken();
  const isAuthenticated = !!userToken;

  res.json({
    mode: isAuthenticated ? 'authenticated' : 'anonymous',
    refreshTokenConfigured: hasRefreshToken,
    userTokenCached: !!userTokenCache.accessToken,
    anonTokenCached: !!anonTokenCache.token
  });
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
