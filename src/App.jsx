import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useUserVideos, useMe } from './hooks';
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

function App() {
  const [searchInput, setSearchInput] = useState('');
  const [username, setUsername] = useState('');
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState('recent');
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(null);
  const [currentView, setCurrentView] = useState('search');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const searchInputRef = useRef(null);

  const { isAuthenticated, logout } = useAuth();
  const { data: me } = useMe();
  const { data: user, isLoading: userLoading, error: userError } = useUser(username);
  const {
    data: videosData,
    isLoading: videosLoading,
    error: videosError,
    isFetching: videosFetching
  } = useUserVideos(username, { page, order, count: 40 });

  const videos = videosData?.gifs || [];
  const totalPages = videosData?.pages || 0;
  const totalVideos = videosData?.total || 0;

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed) {
      setUsername(trimmed);
      setPage(1);
      setSelectedVideoIndex(null);
      setCurrentView('search');
    }
  };

  const handleCreatorSelect = (creatorUsername) => {
    setSearchInput(creatorUsername);
    setUsername(creatorUsername);
    setPage(1);
    setSelectedVideoIndex(null);
    setCurrentView('search');
  };

  const handleVideoSelect = useCallback((index) => {
    setSelectedVideoIndex(index);
  }, []);

  const handleClosePlayer = useCallback(() => {
    setSelectedVideoIndex(null);
  }, []);

  const handlePrevVideo = useCallback(() => {
    setSelectedVideoIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const handleNextVideo = useCallback(() => {
    setSelectedVideoIndex((prev) => (prev < videos.length - 1 ? prev + 1 : prev));
  }, [videos.length]);

  const handleOrderChange = (newOrder) => {
    setOrder(newOrder);
    setPage(1);
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    setSelectedVideoIndex(null);
    if (view !== 'search') {
      setUsername('');
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle shortcuts when typing in search
      if (document.activeElement === searchInputRef.current) {
        if (e.key === 'Escape') {
          searchInputRef.current.blur();
        }
        return;
      }

      if (selectedVideoIndex !== null) {
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
          case '/':
            e.preventDefault();
            searchInputRef.current?.focus();
            break;
          case 'ArrowLeft':
            if (currentView === 'search' && page > 1) {
              e.preventDefault();
              setPage((p) => p - 1);
            }
            break;
          case 'ArrowRight':
            if (currentView === 'search' && page < totalPages) {
              e.preventDefault();
              setPage((p) => p + 1);
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedVideoIndex, handlePrevVideo, handleNextVideo, handleClosePlayer, page, totalPages, currentView]);

  const isLoading = userLoading || videosLoading;
  const error = userError || videosError;

  const renderMainContent = () => {
    switch (currentView) {
      case 'for-you':
        return <FeedView type="for-you" onCreatorSelect={handleCreatorSelect} />;
      case 'following-feed':
        return <FeedView type="following-feed" onCreatorSelect={handleCreatorSelect} />;
      case 'liked':
        return <FeedView type="liked" onCreatorSelect={handleCreatorSelect} />;
      case 'following':
        return <FollowingList onCreatorSelect={handleCreatorSelect} />;
      case 'niches':
        return <NichesList />;
      case 'collections':
        return <CollectionsView onCreatorSelect={handleCreatorSelect} />;
      case 'search':
      default:
        if (!username) {
          return (
            <div className="welcome">
              <h2>Welcome to RedGifs Viewer</h2>
              <p>
                Enter a username in the search bar above to browse their videos.
                {!isAuthenticated && ' Login to access your personalized feed, followed creators, and more.'}
              </p>
              {isAuthenticated && (
                <div className="welcome-actions">
                  <button className="btn btn-primary" onClick={() => setCurrentView('for-you')}>
                    Browse For You Feed
                  </button>
                  <button className="btn btn-secondary" onClick={() => setCurrentView('following-feed')}>
                    See Following Feed
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
            />

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1 || videosFetching}
                >
                  &larr; Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages || videosFetching}
                >
                  Next &rarr;
                </button>
              </div>
            )}

            {selectedVideoIndex !== null && videos[selectedVideoIndex] && (
              <VideoPlayer
                video={videos[selectedVideoIndex]}
                currentIndex={selectedVideoIndex}
                totalVideos={videos.length}
                onClose={handleClosePlayer}
                onPrev={handlePrevVideo}
                onNext={handleNextVideo}
                hasPrev={selectedVideoIndex > 0}
                hasNext={selectedVideoIndex < videos.length - 1}
              />
            )}
          </>
        );
    }
  };

  return (
    <div className="app">
      <header className="header">
        <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Menu">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        </button>

        <a href="/" className="logo" onClick={(e) => { e.preventDefault(); setUsername(''); setSearchInput(''); setCurrentView('search'); }}>
          <span>RG</span> RedGifs
        </a>

        <form className="search-container" onSubmit={handleSearch}>
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search username"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="search-btn" disabled={!searchInput.trim()} aria-label="Search">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </button>
        </form>

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
        <Sidebar
          currentView={currentView}
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

    </div>
  );
}

export default App;
