import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useUser, useUserVideos, useMe, useGif, useCollectionGifs, useCollection, useSearch } from './hooks';
import { useAuth } from './AuthContext';
import VideoGrid from './components/VideoGrid';
import VideoPlayer from './components/VideoPlayer';
import UserProfile from './components/UserProfile';
import Sidebar from './components/Sidebar';
import LoginModal from './components/LoginModal';
import FollowingList from './components/FollowingList';
import NichesList from './components/NichesList';
import FeedView from './components/FeedView';
import CollectionsView from './components/CollectionsView';
import TagSelector from './components/TagSelector';
import tags from '../tags.json';

// URL parsing
function parseUrl() {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);

  // Default state
  const state = {
    view: 'search',
    username: '',
    page: 1,
    order: 'recent',
    videoId: null,
    collectionId: null,
    tags: [],
  };

  if (path === '/' || path === '') {
    // Check for tag search on home
    const tagsParam = params.get('tags');
    if (tagsParam) {
      const page = parseInt(params.get('page')) || 1;
      const order = params.get('order') || 'trending';
      return {
        ...state,
        view: 'tag-search',
        tags: tagsParam.split(',').filter(Boolean),
        page,
        order,
      };
    }
    return state;
  }

  // /search - Tag search
  if (path === '/search') {
    const tagsParam = params.get('tags');
    const page = parseInt(params.get('page')) || 1;
    const order = params.get('order') || 'trending';
    const videoIdParam = params.get('v');
    return {
      ...state,
      view: 'tag-search',
      tags: tagsParam ? tagsParam.split(',').filter(Boolean) : [],
      page,
      order,
      videoId: videoIdParam || null,
    };
  }

  // /videos/:videoId - Standalone video
  const videoMatch = path.match(/^\/videos\/([^/]+)$/);
  if (videoMatch) {
    return { ...state, view: 'video', videoId: decodeURIComponent(videoMatch[1]) };
  }

  // /u/:username/:videoId - User video
  const userVideoMatch = path.match(/^\/u\/([^/]+)\/([^/]+)$/);
  if (userVideoMatch) {
    const page = parseInt(params.get('page')) || 1;
    const order = params.get('order') || 'recent';
    return {
      ...state,
      view: 'search',
      username: decodeURIComponent(userVideoMatch[1]),
      videoId: decodeURIComponent(userVideoMatch[2]),
      page,
      order,
    };
  }

  // /u/:username - User profile
  const userMatch = path.match(/^\/u\/([^/]+)$/);
  if (userMatch) {
    const page = parseInt(params.get('page')) || 1;
    const order = params.get('order') || 'recent';
    return {
      ...state,
      view: 'search',
      username: decodeURIComponent(userMatch[1]),
      page,
      order,
    };
  }

  // /collection/:collectionId/:videoId - Collection video
  const collectionVideoMatch = path.match(/^\/collection\/([^/]+)\/([^/]+)$/);
  if (collectionVideoMatch) {
    return {
      ...state,
      view: 'collection',
      collectionId: decodeURIComponent(collectionVideoMatch[1]),
      videoId: decodeURIComponent(collectionVideoMatch[2]),
    };
  }

  // /collection/:collectionId - Collection view
  const collectionMatch = path.match(/^\/collection\/([^/]+)$/);
  if (collectionMatch) {
    return {
      ...state,
      view: 'collection',
      collectionId: decodeURIComponent(collectionMatch[1]),
    };
  }

  // Other routes
  const routes = {
    '/for-you': { view: 'for-you' },
    '/following': { view: 'following-feed' },
    '/liked': { view: 'liked' },
    '/collections': { view: 'collections' },
    '/subscriptions': { view: 'following' },
    '/categories': { view: 'niches' },
  };

  if (routes[path]) {
    return { ...state, ...routes[path] };
  }

  return state;
}

// URL building
function buildUrl(state) {
  const { view, username, page, order, videoId, collectionId, tags } = state;
  let path = '/';
  let params = new URLSearchParams();

  switch (view) {
    case 'video':
      if (videoId) {
        path = `/videos/${encodeURIComponent(videoId)}`;
      }
      break;

    case 'tag-search':
      if (tags && tags.length > 0) {
        path = '/search';
        params.set('tags', tags.join(','));
        if (page > 1) params.set('page', page.toString());
        if (order !== 'trending') params.set('order', order);
        if (videoId) params.set('v', videoId);
      }
      break;

    case 'search':
      if (username) {
        if (videoId) {
          path = `/u/${encodeURIComponent(username)}/${encodeURIComponent(videoId)}`;
        } else {
          path = `/u/${encodeURIComponent(username)}`;
        }
        if (page > 1) params.set('page', page.toString());
        if (order !== 'recent') params.set('order', order);
      }
      break;

    case 'collection':
      if (collectionId) {
        if (videoId) {
          path = `/collection/${encodeURIComponent(collectionId)}/${encodeURIComponent(videoId)}`;
        } else {
          path = `/collection/${encodeURIComponent(collectionId)}`;
        }
      }
      break;

    case 'for-you':
      path = '/for-you';
      break;
    case 'following-feed':
      path = '/following';
      break;
    case 'liked':
      path = '/liked';
      break;
    case 'collections':
      path = '/collections';
      break;
    case 'following':
      path = '/subscriptions';
      break;
    case 'niches':
      path = '/categories';
      break;
  }

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

function App() {
  const initialState = parseUrl();

  const [username, setUsername] = useState(initialState.username);
  const [selectedTags, setSelectedTags] = useState(initialState.tags || []);
  const [page, setPage] = useState(initialState.page);
  const [order, setOrder] = useState(initialState.order);
  const [currentView, setCurrentView] = useState(initialState.view);
  const [videoId, setVideoId] = useState(initialState.videoId);
  const [collectionId, setCollectionId] = useState(initialState.collectionId);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [gridColumns, setGridColumns] = useState(() => {
    const saved = localStorage.getItem('gridColumns');
    return saved ? parseInt(saved, 10) : 4;
  });

  // Track mobile state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile && !sidebarOpen) {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  const isNavigatingRef = useRef(false);

  const { isAuthenticated, logout } = useAuth();
  const { data: me } = useMe();
  const { data: user, isLoading: userLoading, error: userError } = useUser(username);
  const {
    data: videosData,
    isLoading: videosLoading,
    error: videosError,
    isFetching: videosFetching
  } = useUserVideos(username, { page, order, count: 40 });

  // Tag search
  const {
    data: tagSearchData,
    isLoading: tagSearchLoading,
    error: tagSearchError,
    isFetching: tagSearchFetching
  } = useSearch(currentView === 'tag-search' ? { tags: selectedTags, order, page, count: 40 } : {});

  // Fetch standalone video if needed
  const { data: standaloneVideo } = useGif(currentView === 'video' ? videoId : null);

  // Fetch collection data if in collection view
  const { data: collectionData } = useCollection(currentView === 'collection' ? collectionId : null);
  const { data: collectionGifsData, isLoading: collectionGifsLoading, isFetching: collectionGifsFetching } = useCollectionGifs(
    currentView === 'collection' ? collectionId : null,
    { page: 1, count: 80 }
  );

  const videos = videosData?.gifs || [];
  const totalPages = videosData?.pages || 0;
  const tagSearchVideos = tagSearchData?.gifs || [];
  const tagSearchTotalPages = tagSearchData?.pages || 0;
  const tagSearchTotal = tagSearchData?.total || 0;
  const totalVideos = videosData?.total || 0;

  const collectionVideos = collectionGifsData?.gifs || [];

  // Find selected video index from videoId
  const selectedVideoIndex = useMemo(() => {
    if (!videoId) return null;

    if (currentView === 'search' && videos.length > 0) {
      const index = videos.findIndex(v => v.id === videoId);
      return index >= 0 ? index : null;
    }

    if (currentView === 'tag-search' && tagSearchVideos.length > 0) {
      const index = tagSearchVideos.findIndex(v => v.id === videoId);
      return index >= 0 ? index : null;
    }

    if (currentView === 'collection' && collectionVideos.length > 0) {
      const index = collectionVideos.findIndex(v => v.id === videoId);
      return index >= 0 ? index : null;
    }

    return null;
  }, [videoId, currentView, videos, tagSearchVideos, collectionVideos]);

  // Get current video for player
  const currentVideo = useMemo(() => {
    if (currentView === 'video' && standaloneVideo) {
      return standaloneVideo;
    }

    if (currentView === 'search' && selectedVideoIndex !== null && videos[selectedVideoIndex]) {
      return videos[selectedVideoIndex];
    }

    if (currentView === 'tag-search' && selectedVideoIndex !== null && tagSearchVideos[selectedVideoIndex]) {
      return tagSearchVideos[selectedVideoIndex];
    }

    if (currentView === 'collection' && selectedVideoIndex !== null && collectionVideos[selectedVideoIndex]) {
      return collectionVideos[selectedVideoIndex];
    }

    return null;
  }, [currentView, standaloneVideo, selectedVideoIndex, videos, tagSearchVideos, collectionVideos]);

  // Update URL when state changes
  useEffect(() => {
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    const newUrl = buildUrl({ view: currentView, username, page, order, videoId, collectionId, tags: selectedTags });
    const currentUrl = window.location.pathname + window.location.search;

    if (newUrl !== currentUrl) {
      window.history.pushState(
        { view: currentView, username, page, order, videoId, collectionId, tags: selectedTags },
        '',
        newUrl
      );
    }
  }, [currentView, username, page, order, videoId, collectionId, selectedTags]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = (event) => {
      isNavigatingRef.current = true;

      const parsed = event.state || parseUrl();
      setCurrentView(parsed.view || 'search');
      setUsername(parsed.username || '');
      setSelectedTags(parsed.tags || []);
      setPage(parsed.page || 1);
      setOrder(parsed.order || 'recent');
      setVideoId(parsed.videoId || null);
      setCollectionId(parsed.collectionId || null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update document title
  useEffect(() => {
    let title = 'RedGifs Viewer';

    if (currentVideo && videoId) {
      const videoTitle = currentVideo.description || currentVideo.tags?.join(', ') || 'Video';
      title = `${videoTitle} - RedGifs Viewer`;
    } else if (currentView === 'tag-search' && selectedTags.length > 0) {
      const tagLabels = selectedTags.map(t => tags[t] || t).join(', ');
      title = `${tagLabels} - RedGifs Viewer`;
    } else if (username) {
      title = `@${username} - RedGifs Viewer`;
    } else if (collectionId && collectionData) {
      title = `${collectionData.folderName || 'Collection'} - RedGifs Viewer`;
    } else {
      const titles = {
        'for-you': 'For You',
        'following-feed': 'Following',
        'liked': 'Liked',
        'collections': 'Collections',
        'following': 'Subscriptions',
        'niches': 'Categories',
        'collection': 'Collection',
      };
      if (titles[currentView]) {
        title = `${titles[currentView]} - RedGifs Viewer`;
      }
    }

    document.title = title;
  }, [currentView, username, videoId, collectionId, currentVideo, collectionData, selectedTags]);

  const handleTagSearch = () => {
    if (selectedTags.length > 0) {
      setUsername('');
      setPage(1);
      setVideoId(null);
      setCollectionId(null);
      // Set valid order for tag search API
      const validTagOrders = ['trending', 'latest', 'top', 'top7', 'top28', 'score'];
      if (!validTagOrders.includes(order)) {
        setOrder('trending');
      }
      setCurrentView('tag-search');
      // Close sidebar on mobile when searching
      if (isMobile) {
        setSidebarOpen(false);
      }
    }
  };

  const handleCreatorSelect = (creatorUsername) => {
    setUsername(creatorUsername);
    setSelectedTags([]);
    setPage(1);
    setVideoId(null);
    setCollectionId(null);
    setCurrentView('search');
    // Close sidebar on mobile when selecting a creator
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleVideoSelect = useCallback((index) => {
    const videoList = currentView === 'collection' ? collectionVideos : currentView === 'tag-search' ? tagSearchVideos : videos;
    if (videoList[index]) {
      setVideoId(videoList[index].id);
    }
  }, [currentView, videos, tagSearchVideos, collectionVideos]);

  const handleClosePlayer = useCallback(() => {
    setVideoId(null);
    if (currentView === 'video') {
      // Go back to home if we were on a standalone video page
      setCurrentView('search');
    }
  }, [currentView]);

  const handlePrevVideo = useCallback(() => {
    const videoList = currentView === 'collection' ? collectionVideos : currentView === 'tag-search' ? tagSearchVideos : videos;
    if (selectedVideoIndex !== null && selectedVideoIndex > 0) {
      setVideoId(videoList[selectedVideoIndex - 1].id);
    }
  }, [currentView, videos, tagSearchVideos, collectionVideos, selectedVideoIndex]);

  const handleNextVideo = useCallback(() => {
    const videoList = currentView === 'collection' ? collectionVideos : currentView === 'tag-search' ? tagSearchVideos : videos;
    if (selectedVideoIndex !== null && selectedVideoIndex < videoList.length - 1) {
      setVideoId(videoList[selectedVideoIndex + 1].id);
    }
  }, [currentView, videos, tagSearchVideos, collectionVideos, selectedVideoIndex]);

  const handleOrderChange = (newOrder) => {
    setOrder(newOrder);
    setPage(1);
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    setVideoId(null);
    setCollectionId(null);
    setSelectedTags([]);
    if (view !== 'search' && view !== 'tag-search') {
      setUsername('');
    }
    // Close sidebar on mobile when navigating
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleCollectionSelect = useCallback((collection) => {
    const id = collection.folderId || collection.id;
    setCollectionId(id);
    setCurrentView('collection');
    setVideoId(null);
  }, []);

  const handleBackToCollections = useCallback(() => {
    setCollectionId(null);
    setVideoId(null);
    setCurrentView('collections');
  }, []);

  const handleLogoClick = (e) => {
    e.preventDefault();
    setUsername('');
    setSelectedTags([]);
    setCurrentView('search');
    setPage(1);
    setOrder('recent');
    setVideoId(null);
    setCollectionId(null);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't interfere with tag selector input
      if (e.target.closest('.tag-selector')) {
        return;
      }

      // Grid column controls (work everywhere except in video player)
      if (!videoId) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setGridColumns((cols) => {
            const newCols = Math.max(1, cols - 1);
            localStorage.setItem('gridColumns', newCols.toString());
            return newCols;
          });
          return;
        }
        if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          setGridColumns((cols) => {
            const newCols = Math.min(5, cols + 1);
            localStorage.setItem('gridColumns', newCols.toString());
            return newCols;
          });
          return;
        }
      }

      const videoList = currentView === 'collection' ? collectionVideos : currentView === 'tag-search' ? tagSearchVideos : videos;

      if (videoId && currentVideo) {
        switch (e.key) {
          case 'ArrowLeft':
          case 'a':
          case 'A':
            e.preventDefault();
            handlePrevVideo();
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            e.preventDefault();
            handleNextVideo();
            break;
          case 'Escape':
            e.preventDefault();
            handleClosePlayer();
            break;
        }
      } else {
        switch (e.key) {
          case 'ArrowLeft':
            if ((currentView === 'search' || currentView === 'tag-search') && page > 1) {
              e.preventDefault();
              setPage((p) => p - 1);
            }
            break;
          case 'ArrowRight':
            const maxPages = currentView === 'tag-search' ? tagSearchTotalPages : totalPages;
            if ((currentView === 'search' || currentView === 'tag-search') && page < maxPages) {
              e.preventDefault();
              setPage((p) => p + 1);
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [videoId, currentVideo, handlePrevVideo, handleNextVideo, handleClosePlayer, page, totalPages, tagSearchTotalPages, currentView, videos, tagSearchVideos, collectionVideos]);

  const isLoading = userLoading || videosLoading;
  const error = userError || videosError;

  // Determine video list and navigation for player
  const getVideoNavigation = () => {
    if (currentView === 'video') {
      return { hasPrev: false, hasNext: false, totalVideos: 1, currentIndex: 0 };
    }

    const videoList = currentView === 'collection' ? collectionVideos : currentView === 'tag-search' ? tagSearchVideos : videos;
    const idx = selectedVideoIndex ?? 0;

    return {
      hasPrev: idx > 0,
      hasNext: idx < videoList.length - 1,
      totalVideos: videoList.length,
      currentIndex: idx,
    };
  };

  const renderMainContent = () => {
    // Standalone video view
    if (currentView === 'video') {
      if (!standaloneVideo) {
        return (
          <div className="loading">
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Loading video...</p>
          </div>
        );
      }
      // Video will be shown in the player overlay
      return null;
    }

    // Collection view
    if (currentView === 'collection' && collectionId) {
      const collectionName = collectionData?.folderName || collectionData?.name || 'Collection';
      const collectionCount = collectionData?.contentCount ?? collectionGifsData?.total ?? 0;

      return (
        <div className="collections-view">
          <div className="collection-detail-header">
            <button className="back-btn" onClick={handleBackToCollections}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              Collections
            </button>
            <div className="collection-detail-info">
              <h2>{collectionName}</h2>
              <span className="collection-detail-count">
                {collectionCount} videos
              </span>
            </div>
          </div>

          <VideoGrid
            videos={collectionVideos}
            isLoading={collectionGifsLoading}
            isFetching={collectionGifsFetching}
            onVideoSelect={handleVideoSelect}
            showCreator={true}
            onCreatorClick={handleCreatorSelect}
            linkBuilder={(video) => `/collection/${encodeURIComponent(collectionId)}/${encodeURIComponent(video.id)}`}
            columns={gridColumns}
          />
        </div>
      );
    }

    switch (currentView) {
      case 'for-you':
        return <FeedView type="for-you" onCreatorSelect={handleCreatorSelect} columns={gridColumns} />;
      case 'following-feed':
        return <FeedView type="following-feed" onCreatorSelect={handleCreatorSelect} columns={gridColumns} />;
      case 'liked':
        return <FeedView type="liked" onCreatorSelect={handleCreatorSelect} columns={gridColumns} />;
      case 'following':
        return <FollowingList onCreatorSelect={handleCreatorSelect} />;
      case 'niches':
        return <NichesList />;
      case 'collections':
        return <CollectionsView onCreatorSelect={handleCreatorSelect} onCollectionSelect={handleCollectionSelect} />;

      case 'tag-search':
        return (
          <>
            <div className="list-header">
              <h2>
                {selectedTags.map(t => tags[t] || t).join(', ')}
              </h2>
              {tagSearchTotal > 0 && (
                <span className="list-count">{tagSearchTotal} videos</span>
              )}
            </div>

            <div className="controls">
              <div className="controls-left">
                <div className="select-wrapper">
                  <select value={order} onChange={(e) => handleOrderChange(e.target.value)}>
                    <option value="trending">Trending</option>
                    <option value="latest">Latest</option>
                    <option value="top">Top</option>
                    <option value="top7">Top This Week</option>
                    <option value="top28">Top This Month</option>
                  </select>
                </div>
              </div>
            </div>

            <VideoGrid
              videos={tagSearchVideos}
              isLoading={tagSearchLoading}
              isFetching={tagSearchFetching}
              onVideoSelect={handleVideoSelect}
              showCreator={true}
              onCreatorClick={handleCreatorSelect}
              linkBuilder={(video) => `/search?tags=${selectedTags.join(',')}&v=${encodeURIComponent(video.id)}`}
              columns={gridColumns}
            />

            {tagSearchTotalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1 || tagSearchFetching}
                >
                  Previous
                </button>
                <span>Page {page} of {tagSearchTotalPages}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= tagSearchTotalPages || tagSearchFetching}
                >
                  Next
                </button>
              </div>
            )}
          </>
        );

      case 'search':
      default:
        if (!username) {
          return (
            <div className="welcome">
              <h2>Welcome to RedGifs Viewer</h2>
              <p>
                Search by tags using the search bar above. Select multiple tags to find exactly what you're looking for.
                {!isAuthenticated && ' Sign in to access your personalized feed, following, and collections.'}
              </p>
              {isAuthenticated && (
                <div className="welcome-actions">
                  <button className="btn btn-primary" onClick={() => handleViewChange('for-you')}>
                    Explore For You
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleViewChange('following-feed')}>
                    Following Feed
                  </button>
                </div>
              )}
            </div>
          );
        }

        if (error) {
          return (
            <div className="error">
              <p>Error: {error.message}</p>
              <p>Make sure the username is correct and try again.</p>
            </div>
          );
        }

        return (
          <>
            {user && <UserProfile user={user} />}

            <div className="controls">
              <div className="controls-left">
                <div className="select-wrapper">
                  <select value={order} onChange={(e) => handleOrderChange(e.target.value)}>
                    <option value="recent">Recent</option>
                    <option value="best">Best</option>
                    <option value="oldest">Oldest</option>
                  </select>
                </div>
                {totalVideos > 0 && (
                  <span className="results-count">{totalVideos} videos</span>
                )}
              </div>
            </div>

            <VideoGrid
              videos={videos}
              isLoading={isLoading}
              isFetching={videosFetching}
              onVideoSelect={handleVideoSelect}
              linkBuilder={(video) => `/u/${encodeURIComponent(username)}/${encodeURIComponent(video.id)}`}
              columns={gridColumns}
            />

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1 || videosFetching}
                >
                  Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages || videosFetching}
                >
                  Next
                </button>
              </div>
            )}
          </>
        );
    }
  };

  const nav = getVideoNavigation();

  return (
    <div className="app">
      <header className="header">
        <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Menu">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        </button>

        <a href="/" className="logo" onClick={handleLogoClick}>
          <span>RG</span> Viewer
        </a>

        <TagSelector
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          onSearch={handleTagSearch}
        />

        <div className="header-actions">
          {isAuthenticated ? (
            <div className="user-menu">
              <span className="user-greeting">
                {me?.username || 'User'}
              </span>
              <button className="btn btn-secondary btn-sm" onClick={logout}>
                Logout
              </button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => setShowLoginModal(true)}>
              Login
            </button>
          )}
        </div>
      </header>

      <div className="app-body">
        {/* Mobile sidebar backdrop */}
        {isMobile && (
          <div
            className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar
          currentView={currentView === 'collection' ? 'collections' : currentView}
          onViewChange={handleViewChange}
          isOpen={sidebarOpen}
        />

        <main className={`main-content ${sidebarOpen ? 'with-sidebar' : ''}`}>
          {renderMainContent()}
        </main>
      </div>

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}

      {/* Video Player Overlay */}
      {currentVideo && videoId && (
        <VideoPlayer
          video={currentVideo}
          currentIndex={nav.currentIndex}
          totalVideos={nav.totalVideos}
          onClose={handleClosePlayer}
          onPrev={handlePrevVideo}
          onNext={handleNextVideo}
          hasPrev={nav.hasPrev}
          hasNext={nav.hasNext}
        />
      )}
    </div>
  );
}

export default App;
