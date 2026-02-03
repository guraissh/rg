import express from 'express';
import cors from 'cors';
import { fetchWrapper } from './fetch';
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cache for the anonymous access token
let tokenCache = {
  token: null,
  expiresAt: 0
};

// Cache for authenticated user tokens (keyed by access_token)
const userTokenCache = new Map();

// Get or refresh anonymous access token
async function getAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const response = await fetchWrapper('https://api.redgifs.com/v2/auth/temporary', {
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
  tokenCache = {
    token: data.token,
    expiresAt: Date.now() + (23 * 60 * 60 * 1000) // 23 hours
  };

  return tokenCache.token;
}

// OAuth token exchange endpoint
app.post('/auth/token', async (req, res) => {
  try {
    const { client_id, grant_type = 'client_credentials' } = req.body;

    if (!client_id) {
      return res.status(400).json({ error: 'client_id is required' });
    }

    const response = await fetchWrapper('https://auth2.redgifs.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: new URLSearchParams({
        client_id,
        grant_type
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Cache the user token
    if (data.access_token) {
      userTokenCache.set(data.access_token, {
        ...data,
        expiresAt: Date.now() + (data.expires_in * 1000)
      });
    }

    res.json(data);
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Refresh token endpoint
app.post('/auth/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'refresh_token is required' });
    }

    const response = await fetchWrapper('https://auth2.redgifs.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
        'Origin': 'https://www.redgifs.com',
        'Referer': 'https://www.redgifs.com/',
        'Cookie': `refresh_token=${refresh_token}`
      },
      body: new URLSearchParams({
        client_id: 'e06c34dac7654821bcb37e0393b54350',
        grant_type: 'refresh_token'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Update cached token
    if (data.access_token) {
      userTokenCache.set(data.access_token, {
        ...data,
        expiresAt: Date.now() + (data.expires_in * 1000)
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for RedGifs API
app.all('/api/*', async (req, res) => {
  try {
    const path = req.params[0];

    // Check if client provided their own auth token
    const clientAuth = req.headers['x-user-token'];
    const token = clientAuth || await getAccessToken();

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

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetchWrapper(url.toString(), fetchOptions);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
