const API_BASE = '/api';

// Proxy media URLs through our server to avoid CORS issues
export function proxyMediaUrl(url) {
  if (!url) return url;
  return `/api/media?url=${encodeURIComponent(url)}`;
}

async function filterOutAi(response) {
  if ('gifs' in response && Array.isArray(response.gifs)) {
    response.gifs = response.gifs.filter(g => g.tags.filter(tag => tag.toLowerCase() === "ai generated" || tag.toLowerCase() === "3d").length === 0)
  }
  return response
}

export async function fetchApi(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = data.error?.message || data.message || data.error || `API error: ${response.status}`;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return response.json();
}

export async function getUser(username) {
  return fetchApi(`/v1/users/${encodeURIComponent(username)}`);
}

export async function getUserVideos(username, { page = 1, count = 40, order = 'recent' } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    count: String(count),
    order,
  });
  return fetchApi(`/v2/users/${encodeURIComponent(username)}/search?${params}`).then(filterOutAi);
}

export async function getCreatorTags(username) {
  return fetchApi(`/v2/creators/${encodeURIComponent(username)}/tags`);
}

export async function getPinnedVideos(username) {
  return fetchApi(`/v2/pins/${encodeURIComponent(username)}`).then(filterOutAi);
}

export async function getUserCollections(username, { page = 1, count = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    count: String(count),
  });
  return fetchApi(`/v2/users/${encodeURIComponent(username)}/collections?${params}`);
}

// ============ Authenticated API endpoints ============

export async function getMe() {
  return fetchApi('/v1/me');
}

export async function getMyFollowing({ page = 1, count = 40 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    count: String(count),
  });
  return fetchApi(`/v2/me/following?${params}`);
}

export async function getMyNiches() {
  return fetchApi('/v2/niches/following');
}

export async function getForYouFeed({ page = 1, count = 40 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    count: String(count),
  });
  return fetchApi(`/v2/feeds/for-you?${params}`).then(filterOutAi);
}

export async function getLikedFeed({ page = 1, count = 40, type = 'g' } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    count: String(count),
    type,
  });
  return fetchApi(`/v2/feeds/liked?${params}`).then(filterOutAi);
}

export async function getMyCollections({ page = 1, count = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    count: String(count),
  });
  return fetchApi(`/v2/me/collections?${params}`);
}

export async function getCollectionGifs(collectionId, { page = 1, count = 40 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    count: String(count),
  });
  return fetchApi(`/v2/me/collections/${encodeURIComponent(collectionId)}/gifs?${params}`).then(filterOutAi);
}

export async function getGif(gifId) {
  const data = await fetchApi(`/v1/gifs/${encodeURIComponent(gifId)}`);
  return data.gif;
}

export async function search({ tags = [], order = 'trending', count = 40, page = 1 } = {}) {
  const params = new URLSearchParams({
    type: 'g',
    order,
    count: String(count),
    page: String(page),
  });

  // Tags should be comma-separated
  if (tags.length > 0) {
    params.set('tags', tags.join(','));
  }

  return fetchApi(`/v2/gifs/search?${params}`).then(filterOutAi);
}

export async function getCollection(collectionId) {
  return fetchApi(`/v2/me/collections/${encodeURIComponent(collectionId)}`);
}

export async function followUser(username) {
  return fetchApi(`/v1/me/follows/${encodeURIComponent(username)}`, {
    method: 'PUT',
    body: JSON.stringify({ source: 'profile', position: 0 }),
  });
}

export async function unfollowUser(username) {
  return fetchApi(`/v1/me/follows/${encodeURIComponent(username)}`, {
    method: 'DELETE',
    body: JSON.stringify({ source: 'profile' }),
  });
}
