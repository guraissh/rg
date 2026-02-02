# RedGifs Viewer - Project Documentation

## Overview

**RedGifs Viewer** is a React-based web application that provides an alternative interface for browsing RedGifs content. It consists of a frontend React application and a backend Express proxy server that handles authentication and API requests to the RedGifs API.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite |
| State Management | TanStack React Query v5 |
| Backend | Express.js (Bun runtime) |
| Styling | CSS (custom properties/variables) |
| Build Tool | Vite 5 |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    React App (Vite)                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │ AuthContext │  │ React Query │  │   Components    │  │   │
│  │  │  (Auth)     │  │  (Caching)  │  │   (UI Layer)    │  │   │
│  │  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │   │
│  │         │                │                   │           │   │
│  │         └────────────────┼───────────────────┘           │   │
│  │                          │                               │   │
│  │                    ┌─────▼─────┐                         │   │
│  │                    │  api.js   │                         │   │
│  │                    │ (Client)  │                         │   │
│  │                    └─────┬─────┘                         │   │
│  └──────────────────────────┼───────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTP
┌─────────────────────────────┼───────────────────────────────────┐
│                    Express Proxy Server                          │
│  ┌──────────────────────────▼──────────────────────────────┐    │
│  │                      server.js                           │    │
│  │  ┌────────────────┐  ┌────────────────┐                 │    │
│  │  │ Token Cache    │  │ User Token     │                 │    │
│  │  │ (Anonymous)    │  │ Cache (Auth)   │                 │    │
│  │  └────────────────┘  └────────────────┘                 │    │
│  │                                                          │    │
│  │  Endpoints:                                              │    │
│  │  - POST /auth/token    (OAuth token exchange)           │    │
│  │  - POST /auth/refresh  (Token refresh)                  │    │
│  │  - ALL  /api/*         (Proxy to RedGifs API)           │    │
│  │  - GET  /health        (Health check)                   │    │
│  └──────────────────────────┬──────────────────────────────┘    │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTPS
                              ▼
                    ┌─────────────────────┐
                    │   RedGifs API       │
                    │  api.redgifs.com    │
                    │  auth2.redgifs.com  │
                    └─────────────────────┘
```

---

## Appearance & Navigation

The application features a **YouTube-inspired dark theme** with a clean, modern interface optimized for media browsing.

### Design System

#### Color Palette

| Variable | Value | Usage |
|----------|-------|-------|
| `--yt-bg-primary` | `#0f0f0f` | Main background |
| `--yt-bg-secondary` | `#0f0f0f` | Secondary surfaces |
| `--yt-bg-elevated` | `#212121` | Cards, thumbnails |
| `--yt-bg-hover` | `#272727` | Hover states |
| `--yt-bg-active` | `#3d3d3d` | Active/pressed states |
| `--yt-text-primary` | `#f1f1f1` | Primary text |
| `--yt-text-secondary` | `#aaa` | Secondary text, metadata |
| `--yt-text-muted` | `#717171` | Placeholders, disabled |
| `--yt-border` | `#303030` | Borders, dividers |
| `--yt-accent` | `#ff0000` | Brand accent (red) |
| `--yt-blue` | `#3ea6ff` | Links, focus states |
| `--yt-chip-bg` | `#272727` | Filter chips, tags |
| `--yt-chip-active` | `#f1f1f1` | Active chip (inverted) |

#### Typography

- **Font Family**: Roboto, Arial, sans-serif
- **Primary Text**: 14-16px, weight 400-500
- **Headings**: 20-24px, weight 500-600
- **Metadata**: 12px, secondary color

### Layout Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  HEADER (fixed, 56px height)                                      │
│  ┌────┬────────┬─────────────────────────────┬──────────────┐    │
│  │ ☰  │ RG Logo│      Search Input           │ User Menu    │    │
│  └────┴────────┴─────────────────────────────┴──────────────┘    │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────┬────────────────────────────────────────────┐    │
│  │  SIDEBAR    │              MAIN CONTENT                   │    │
│  │  (240px)    │                                             │    │
│  │             │  ┌─────────────────────────────────────┐   │    │
│  │  🏠 Home    │  │  User Profile (when viewing creator) │   │    │
│  │  🔥 For You │  └─────────────────────────────────────┘   │    │
│  │  ─────────  │                                             │    │
│  │  You        │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │    │
│  │  ▶️ Following│  │     │ │     │ │     │ │     │          │    │
│  │  👍 Liked   │  │Video│ │Video│ │Video│ │Video│          │    │
│  │  📁 Collect.│  │Card │ │Card │ │Card │ │Card │          │    │
│  │  ─────────  │  │     │ │     │ │     │ │     │          │    │
│  │  Explore    │  └─────┘ └─────┘ └─────┘ └─────┘          │    │
│  │  📺 Subs    │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │    │
│  │  🎯 Categor.│  │     │ │     │ │     │ │     │          │    │
│  │             │  └─────┘ └─────┘ └─────┘ └─────┘          │    │
│  │             │                                             │    │
│  │             │  ┌─────────────────────────────────────┐   │    │
│  │             │  │  ← Previous   Page 1 of 5   Next →  │   │    │
│  │             │  └─────────────────────────────────────┘   │    │
│  └─────────────┴────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### Header Components

| Element | Description |
|---------|-------------|
| **Menu Toggle** | Hamburger button (☰) to show/hide sidebar |
| **Logo** | "RG" badge + "RedGifs" text, clickable to reset to home |
| **Search Bar** | Pill-shaped input (max 640px) with search icon button |
| **User Menu** | Shows username + Logout button (authenticated) or Login button |

### Sidebar Navigation

The sidebar is 240px wide, fixed position, and can be toggled via the hamburger menu.

**Sections:**

| Section | Items | Auth Required |
|---------|-------|---------------|
| **Main** | Home, For You | For You only |
| **You** | Following, Liked, Collections | Yes |
| **Explore** | Subscriptions, Categories | Yes |

**Visual States:**
- Default: Transparent background
- Hover: `#272727` background
- Active: `#272727` background + bold text

### Video Grid

- **Layout**: CSS Grid with `auto-fill`, minimum 320px columns
- **Card Aspect Ratio**: 16:9 thumbnails
- **Card Elements**:
  - Thumbnail with rounded corners (12px)
  - Duration badge (bottom-right, black pill)
  - Creator name (clickable, secondary color)
  - Title (2-line clamp)
  - Metadata row (views • likes • date)

**Hover Behavior:**
1. After 500ms delay, thumbnail image swaps to video
2. Silent/muted video auto-plays in loop
3. On mouse leave, reverts to static thumbnail

### Video Player Modal

Full-screen modal overlay with:

```
┌────────────────────────────────────────────────────────────┐
│  Title by @creator                          [Close (Esc)]  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│    ‹                                              ›        │
│   prev                    VIDEO                  next      │
│                                                            │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  123K views • 5.2K likes • 🔊 Has audio  [HD ▼]           │
│                              Video 3 of 40  Use ← → to nav │
└────────────────────────────────────────────────────────────┘
```

**Features:**
- 95% opacity black backdrop
- Circular nav buttons (prev/next) at viewport edges
- Quality selector (HD/SD dropdown)
- Native video controls
- Auto-advances to next video on end
- Body scroll locked while open

### Creator Profile Header

Displayed when viewing a creator's content:

```
┌──────────────────────────────────────────────────────────┐
│  ┌──────┐                                                │
│  │Avatar│  username ✓                                    │
│  │ 80px │  1.2M followers • 234 videos • 50M views      │
│  └──────┘  Bio text here...                              │
└──────────────────────────────────────────────────────────┘
```

### Collections View

**Grid View:**
- Card thumbnails with right-side overlay showing video count
- Animated thumbnail preview on hover (mp4)
- Click to enter collection detail

**Detail View:**
- Back button (← Back to Collections)
- Collection name + video count header
- Standard video grid with pagination

### Responsive Breakpoints

| Breakpoint | Changes |
|------------|---------|
| **> 1312px** | 4+ column video grid |
| **1024-1312px** | 3-4 column grid, sidebar overlay |
| **768-1024px** | 2-3 column grid, logo hidden on mobile |
| **< 768px** | Single column grid, full-width thumbnails, sidebar drawer |
| **< 480px** | Collections grid becomes single column |

**Mobile Adaptations:**
- Logo hidden, search takes full width
- Video thumbnails extend edge-to-edge (negative margins)
- User profile stacks vertically, centered
- Sidebar becomes slide-out drawer (not inline)

### Keyboard Navigation

| Key | Context | Action |
|-----|---------|--------|
| `/` | Anywhere | Focus search input |
| `Escape` | Search focused | Blur search input |
| `Escape` | Player open | Close video player |
| `←` or `A` | Player open | Previous video |
| `→` or `D` | Player open | Next video |
| `←` | Grid view | Previous page |
| `→` | Grid view | Next page |

### Loading & Empty States

**Loading:**
- Centered spinner (36px circular, animated)
- "Loading..." text below

**Empty:**
- Centered icon (emoji)
- Heading + description text
- Optional action buttons

**Error:**
- Red accent color
- Error message
- Suggestion text

### Buttons & Controls

| Type | Style |
|------|-------|
| **Primary** | White text on light bg (`#f1f1f1`), dark text |
| **Secondary** | Light text on dark chip (`#272727`) |
| **Pagination** | Pill-shaped (18px radius), chip style |
| **Dropdown** | Chip background, custom arrow icon |

### Custom Scrollbar

- 8px width
- Transparent track
- `#717171` thumb with 4px radius
- Hover: `#909090` thumb

---

## File Structure

```
rg/
├── server.js                    # Express proxy server
├── package.json                 # Dependencies and scripts
├── vite.config.js              # Vite configuration
├── index.html                   # HTML entry point
├── openapi-devtools-spec.json  # OpenAPI spec (26 endpoints)
│
└── src/
    ├── main.jsx                 # React entry point
    ├── App.jsx                  # Main application component
    ├── api.js                   # API client functions
    ├── hooks.js                 # React Query custom hooks
    ├── AuthContext.jsx          # Authentication context provider
    ├── index.css                # Global styles
    │
    └── components/
        ├── VideoGrid.jsx        # Grid display of video thumbnails
        ├── VideoPlayer.jsx      # Modal video player
        ├── VideoCard.jsx        # Individual video card
        ├── UserProfile.jsx      # Creator profile header
        ├── Sidebar.jsx          # Navigation sidebar
        ├── LoginModal.jsx       # Authentication modal
        ├── FeedView.jsx         # For You/Liked/Following feeds
        ├── FollowingList.jsx    # List of followed creators
        ├── NichesList.jsx       # Categories/niches browser
        └── CollectionsView.jsx  # User collections manager
```

---

## API Layer

### Proxy Server (`server.js`)

The Express server acts as a reverse proxy to handle CORS and authentication with the RedGifs API.

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/token` | OAuth2 token exchange |
| `POST` | `/auth/refresh` | Refresh token exchange |
| `ALL` | `/api/*` | Proxy all requests to `api.redgifs.com` |
| `GET` | `/health` | Health check endpoint |

#### Token Management

- **Anonymous Token**: Automatically obtained from `/v2/auth/temporary` and cached for 23 hours
- **User Token**: Cached in a Map keyed by `access_token`, includes expiration tracking
- **Header Forwarding**: Client can pass `X-User-Token` header to use authenticated requests

### Client API (`src/api.js`)

The API client provides typed functions for all supported endpoints.

#### Public Endpoints (No Auth Required)

| Function | Endpoint | Description |
|----------|----------|-------------|
| `getUser(username)` | `GET /v1/users/{userId}` | Get user profile |
| `getUserVideos(username, opts)` | `GET /v2/users/{userId}/search` | Get user's videos (paginated) |
| `getCreatorTags(username)` | `GET /v2/creators/{username}/tags` | Get creator's tags |
| `getPinnedVideos(username)` | `GET /v2/pins/{username}` | Get pinned videos |
| `getUserCollections(username, opts)` | `GET /v2/users/{userId}/collections` | Get user's public collections |

#### Authenticated Endpoints (Token Required)

| Function | Endpoint | Description |
|----------|----------|-------------|
| `getMe(token)` | `GET /v1/me` | Get current user profile |
| `getMyFollowing(opts)` | `GET /v2/me/following` | Get followed creators |
| `getMyNiches(token)` | `GET /v2/niches/following` | Get subscribed niches |
| `getForYouFeed(opts)` | `GET /v2/feeds/for-you` | Get personalized feed |
| `getLikedFeed(opts)` | `GET /v2/feeds/liked` | Get liked videos feed |
| `getMyCollections(opts)` | `GET /v2/me/collections` | Get user's collections |
| `getCollectionGifs(id, opts)` | `GET /v2/me/collections/{id}/gifs` | Get videos in collection |

---

## RedGifs API Reference (from OpenAPI Spec)

The project includes an OpenAPI 3.1.0 specification (`openapi-devtools-spec.json`) documenting 26 endpoints. Key endpoints include:

### Authentication

| Endpoint | Host | Description |
|----------|------|-------------|
| `POST /oauth2/token` | `auth2.redgifs.com` | OAuth2 token exchange |
| `GET /v2/auth/temporary` | `api.redgifs.com` | Get anonymous access token |

### User Data

| Endpoint | Description |
|----------|-------------|
| `GET /v1/me` | Current user profile (authenticated) |
| `GET /v1/me/follows` | List of followed users |
| `GET /v1/users/{userId}` | Get user by ID/username |
| `GET /v2/users/{userId}/collections` | User's collections |

### Feeds

| Endpoint | Description |
|----------|-------------|
| `GET /v2/feeds/liked` | Liked videos feed |
| `GET /v2/feeds/for-you` | Personalized "For You" feed |
| `GET /v2/feeds/modules` | Feed module configuration |

### Content

| Endpoint | Description |
|----------|-------------|
| `GET /v2/likes` | List of liked content IDs |
| `GET /v2/me/following` | Followed creators with details |
| `GET /v2/me/collections/{id}` | Collection metadata |
| `GET /v2/me/collections/{id}/gifs` | Videos in a collection |

### Other

| Endpoint | Description |
|----------|-------------|
| `GET /v2/geolocation` | User's geolocation data |
| `GET /v2/experiments/all` | A/B test experiments |
| `GET /v2/notify/broadcast/last-seen` | Notification tracking |
| `GET /v2/adv/slots` | Advertising slots |

### Response Data Models

#### Video (Gif) Object

```typescript
interface Gif {
  id: string;
  createDate: number;              // Unix timestamp
  description: string | null;
  duration: number;                // Seconds
  hasAudio: boolean;
  height: number;
  width: number;
  likes: number;
  views: number;
  tags: string[];
  niches: string[];
  userName: string;
  verified: boolean;
  urls: {
    poster: string;                // Thumbnail image
    thumbnail: string;             // Small thumbnail
    sd: string;                    // SD quality video
    hd: string;                    // HD quality video
    silent?: string;               // Muted preview video
    html: string;                  // Embed URL
  };
}
```

#### User Object

```typescript
interface User {
  username: string;
  name: string | null;
  description: string | null;
  profileImageUrl: string | null;
  profileUrl: string;
  verified: boolean;
  ageVerified: boolean;
  followers: number;
  following: number;
  gifs: number;
  publishedGifs: number;
  publishedCollections: number;
  views: number;
  likes: number;
  creationtime: number;
  status: string;
  subscription: number;
  studio: boolean;
}
```

#### Collection Object

```typescript
interface Collection {
  folderId: string;
  folderName: string;
  description: string | null;
  contentCount: number;
  createDate: number;
  published: boolean;
  thumb: string;                   // Standard thumbnail
  thumbs: string;                  // Static thumbnail
  thumba: string;                  // Animated thumbnail (mp4)
  userId: string;
}
```

---

## State Management

### React Query Configuration (`src/main.jsx`)

```javascript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 minutes
      gcTime: 1000 * 60 * 30,        // 30 minutes (garbage collection)
      refetchOnWindowFocus: false,
    },
  },
});
```

### Custom Hooks (`src/hooks.js`)

| Hook | Query Key | Description |
|------|-----------|-------------|
| `useUser(username)` | `['user', username]` | Fetch user profile |
| `useUserVideos(username, opts)` | `['userVideos', username, page, count, order]` | Fetch user videos |
| `useInfiniteUserVideos(username, opts)` | `['infiniteUserVideos', ...]` | Infinite scroll videos |
| `useMe()` | `['me']` | Current authenticated user |
| `useMyFollowing(opts)` | `['myFollowing', page, count]` | Followed creators |
| `useMyNiches()` | `['myNiches']` | Subscribed niches |
| `useForYouFeed(opts)` | `['forYouFeed', page, count]` | For You feed |
| `useLikedFeed(opts)` | `['likedFeed', page, count, type]` | Liked videos |
| `useMyCollections(opts)` | `['myCollections', page, count]` | User collections |
| `useCollectionGifs(id, opts)` | `['collectionGifs', id, page, count]` | Collection videos |

---

## Authentication Flow

### Login Process

```
1. User opens Login Modal
2. User enters refresh_token (obtained from redgifs.com cookies)
3. Frontend calls POST /auth/refresh with refresh_token
4. Server exchanges refresh_token at auth2.redgifs.com/oauth2/token
5. Server returns access_token, id_token, refresh_token, expires_in
6. Frontend stores auth data in localStorage ('redgifs_auth')
7. AuthContext provides token to all authenticated hooks
```

### Token Refresh

```
1. Before API call, AuthContext.getToken() checks expiration
2. If token expires within 5 minutes, automatic refresh is triggered
3. POST /auth/refresh called with stored refresh_token
4. New tokens stored and returned
```

### Auth Context API

```typescript
interface AuthContext {
  auth: AuthData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login(refreshToken: string): Promise<AuthData>;
  logout(): void;
  refresh(): Promise<AuthData>;
  getToken(): Promise<string | null>;
}
```

---

## Components

### App (`src/App.jsx`)

Main application shell with:
- Header (logo, search, user menu)
- Sidebar navigation
- Main content area (view router)
- Login modal

**State:**
- `currentView`: 'search' | 'for-you' | 'following-feed' | 'liked' | 'following' | 'niches' | 'collections'
- `username`: Currently viewed creator
- `page`, `order`: Pagination and sorting for search view
- `selectedVideoIndex`: Currently playing video in modal

**Keyboard Shortcuts:**
- `/`: Focus search input
- `Escape`: Close player or blur search
- `←/→` or `A/D`: Navigate videos in player
- `←/→`: Navigate pages (when player closed)

### VideoGrid (`src/components/VideoGrid.jsx`)

Responsive grid of video thumbnails with:
- Hover preview (500ms delay, plays silent video)
- Duration overlay
- View/like counts
- Creator name (optional, clickable)
- Lazy loading images

### VideoPlayer (`src/components/VideoPlayer.jsx`)

Modal video player featuring:
- HD/SD quality toggle
- Navigation buttons (prev/next)
- Keyboard navigation
- Auto-advance on video end
- View/like counts display
- Body scroll lock

### CollectionsView (`src/components/CollectionsView.jsx`)

Two-level view:
1. **Collections Grid**: Shows all user collections with animated thumbnails on hover
2. **Collection Detail**: Shows videos in selected collection with pagination

### FeedView (`src/components/FeedView.jsx`)

Generic feed component supporting three modes:
- **for-you**: Uses `useForYouFeed` hook
- **liked**: Uses `useLikedFeed` hook
- **following-feed**: Aggregates recent videos from top 10 followed creators

### Sidebar (`src/components/Sidebar.jsx`)

Navigation with sections:
- **Main**: Home, For You (auth only)
- **You** (auth only): Following, Liked, Collections
- **Explore** (auth only): Subscriptions, Categories

---

## Running the Project

### Development

```bash
# Install dependencies
bun install

# Run both server and client concurrently
bun run dev

# Or run separately:
bun run server    # Express proxy on :3001
bun run client    # Vite dev server on :5173
```

### Production

```bash
# Build frontend
bun run build

# Preview production build
bun run preview
```

### Environment

- Server runs on port `3001`
- Vite dev server runs on port `5173` (proxies `/api` and `/auth` to server)
- No environment variables required (uses default RedGifs client ID)

---

## Security Considerations

1. **No Credential Storage**: The app only stores refresh tokens, not passwords
2. **Token Expiration**: Tokens are validated against expiration time before use
3. **Proxy Pattern**: All API requests go through the local server, hiding auth tokens from browser
4. **CORS Handling**: Server enables CORS for local development
5. **Input Sanitization**: Usernames are URL-encoded before API calls

---

## Data Flow Example: Viewing a Creator's Videos

```
1. User enters "exampleuser" in search
2. handleSearch() sets username state
3. useUser("exampleuser") triggers getUser() API call
4. useUserVideos("exampleuser", {page: 1}) triggers getUserVideos() API call
5. api.js fetchApi() sends request to /api/v1/users/exampleuser
6. server.js receives request, gets/uses cached anonymous token
7. server.js proxies to https://api.redgifs.com/v1/users/exampleuser
8. Response flows back, React Query caches result
9. Components re-render with user profile and video grid
10. User clicks video thumbnail
11. handleVideoSelect(index) sets selectedVideoIndex
12. VideoPlayer modal opens with video[index] data
```

---

## OpenAPI Specification

The included `openapi-devtools-spec.json` was generated using [openapi-devtools](https://github.com/AndrewWalsh/openapi-devtools) by observing actual API traffic. It documents:

- **26 total endpoints** across multiple hosts
- **Request/response schemas** with TypeScript-like type definitions
- **Security requirements** (bearer token, API keys)
- **Query parameters** for pagination and filtering
- **Response headers** including Cloudflare caching info

This spec can be used with tools like Swagger UI, Postman, or code generators to explore the full API surface.
