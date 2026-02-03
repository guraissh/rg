import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
const app = express();
const PORT = 3001;

// Load refresh token from session.json, fall back to env var
function loadRefreshToken() {
	try {
		const sessionPath = path.join(import.meta.dirname, 'session.json');
		const session = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));
		if (session.refreshToken) {
			console.log('Loaded refresh token from session.json');
			return session.refreshToken;
		}
	} catch (err) {
		console.log('Could not load session.json, falling back to env var');
	}
	return null;
}


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
	let USER_REFRESH_TOKEN = loadRefreshToken();
	if (!USER_REFRESH_TOKEN) {
		console.error("No refresh token in env")
		return null;
	}
	console.log(`refresh token found. ${USER_REFRESH_TOKEN.slice(10)}`)

	if (!forceRefresh && userTokenCache.accessToken && Date.now() < userTokenCache.expiresAt) {
		return userTokenCache.accessToken;
	}

	console.log('Refreshing user access token...');
	const response = await fetch('https://auth2.redgifs.com/oauth2/token', {
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

	const response = await fetch(url.toString(), {
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

// Media proxy endpoint for videos and images
app.get('/api/media', async (req, res) => {
	const mediaUrl = req.query.url;

	if (!mediaUrl) {
		return res.status(400).json({ error: 'Missing url parameter' });
	}

	// Validate URL is from RedGifs CDN
	const allowedHosts = ['redgifs.com', 'userpic.redgifs.com', 'thumbs2.redgifs.com', 'thumbs3.redgifs.com', 'thumbs4.redgifs.com', 'thumbs44.redgifs.com', 'thumbs45.redgifs.com', 'thumbs46.redgifs.com'];
	try {
		const urlObj = new URL(mediaUrl);
		const isAllowed = allowedHosts.some(host => urlObj.hostname === host || urlObj.hostname.endsWith('.' + host));
		if (!isAllowed) {
			return res.status(403).json({ error: 'URL not allowed' });
		}
	} catch (e) {
		return res.status(400).json({ error: 'Invalid URL' });
	}

	try {
		const headers = {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
			'Referer': 'https://www.redgifs.com/',
			'Origin': 'https://www.redgifs.com'
		};

		// Forward range header for video seeking
		if (req.headers.range) {
			headers['Range'] = req.headers.range;
		}

		const response = await fetch(mediaUrl, { headers });

		// Forward relevant headers
		const headersToForward = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control', 'etag', 'last-modified'];
		headersToForward.forEach(header => {
			const value = response.headers.get(header);
			if (value) {
				res.setHeader(header, value);
			}
		});

		// Ensure accept-ranges is set for video streaming
		if (!response.headers.get('accept-ranges')) {
			res.setHeader('Accept-Ranges', 'bytes');
		}

		// Set status (206 for partial content, 200 for full)
		res.status(response.status);

		// Stream the response body
		const reader = response.body.getReader();
		const stream = async () => {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				res.write(value);
			}
			res.end();
		};
		stream().catch(err => {
			console.error('Stream error:', err);
			if (!res.headersSent) {
				res.status(500).json({ error: 'Stream failed' });
			}
		});
	} catch (error) {
		console.error('Media proxy error:', error);
		if (!res.headersSent) {
			res.status(500).json({ error: error.message });
		}
	}
});

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

		const response = await fetch(url.toString(), fetchOptions);
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

// Login endpoint - accepts refresh token from frontend
app.post('/auth/login', async (req, res) => {
	const { refresh_token } = req.body;

	if (!refresh_token) {
		return res.status(400).json({ error: 'Missing refresh_token' });
	}

	// Test the token by trying to refresh
	const response = await fetch('https://auth2.redgifs.com/oauth2/token', {
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

	if (!response.ok) {
		const errorText = await response.text();
		console.error('Login failed:', response.status, errorText);
		return res.status(401).json({ error: 'Invalid refresh token' });
	}

	const data = await response.json();
	const token = data.id_token || data.access_token;

	if (!token) {
		return res.status(401).json({ error: 'Failed to get access token' });
	}

	// Save to session.json
	const sessionPath = path.join(import.meta.dirname, 'session.json');
	const sessionData = {
		accessToken: token,
		refreshToken: refresh_token,
		idToken: data.id_token,
		expiresAt: Date.now() + ((data.expires_in || 82800) * 1000),
	};
	fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, '\t'));

	// Update in-memory state
	userTokenCache = {
		accessToken: token,
		expiresAt: sessionData.expiresAt
	};

	res.json({ success: true });
});

// Logout endpoint
app.post('/auth/logout', (req, res) => {
	const sessionPath = path.join(import.meta.dirname, 'session.json');
	try {
		fs.unlinkSync(sessionPath);
	} catch (e) {
		// File might not exist
	}
	userTokenCache = { accessToken: null, expiresAt: 0 };
	res.json({ success: true });
});

// Auth status endpoint
app.get('/status', async (req, res) => {
	let USER_REFRESH_TOKEN = loadRefreshToken();
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
