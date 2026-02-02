import { useState, useCallback } from 'react';
import { useForYouFeed, useLikedFeed, useMyFollowing } from '../hooks';
import { getUserVideos } from '../api';
import { useAuth } from '../AuthContext';
import { useQuery } from '@tanstack/react-query';
import VideoGrid from './VideoGrid';
import VideoPlayer from './VideoPlayer';

function FeedView({ type, onCreatorSelect }) {
  const [page, setPage] = useState(1);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(null);
  const { getToken } = useAuth();

  // Choose the appropriate hook based on feed type
  const forYouQuery = useForYouFeed({ page, count: 40 });
  const likedQuery = useLikedFeed({ page, count: 40 });

  // For "following-feed", we need to aggregate posts from followed creators
  const followingQuery = useMyFollowing({ page: 1, count: 100 });
  const followedUsernames = followingQuery.data?.items?.map(u => u.username) || [];

  // Fetch latest videos from followed creators
  const followingFeedQuery = useQuery({
    queryKey: ['followingFeed', page, followedUsernames.join(',')],
    queryFn: async () => {
      if (followedUsernames.length === 0) return { gifs: [], pages: 0, total: 0 };

      // Fetch from top 10 most recently active followed creators
      const promises = followedUsernames.slice(0, 10).map(username =>
        getUserVideos(username, { page: 1, count: 8, order: 'recent' }).catch(() => ({ gifs: [] }))
      );

      const results = await Promise.all(promises);

      // Combine and sort by createDate
      const allGifs = results.flatMap(r => r.gifs || []);
      allGifs.sort((a, b) => (b.createDate || 0) - (a.createDate || 0));

      // Paginate manually
      const perPage = 40;
      const start = (page - 1) * perPage;
      const paginatedGifs = allGifs.slice(start, start + perPage);

      return {
        gifs: paginatedGifs,
        page,
        pages: Math.ceil(allGifs.length / perPage),
        total: allGifs.length,
      };
    },
    enabled: type === 'following-feed' && followedUsernames.length > 0,
    placeholderData: (previousData) => previousData,
  });

  // Select the right query based on type
  let query;
  let title;
  switch (type) {
    case 'for-you':
      query = forYouQuery;
      title = 'For You';
      break;
    case 'liked':
      query = likedQuery;
      title = 'Liked Videos';
      break;
    case 'following-feed':
      query = followingFeedQuery;
      title = 'Following Feed';
      break;
    default:
      query = forYouQuery;
      title = 'Feed';
  }

  const { data, isLoading, isFetching, error } = query;
  const videos = data?.gifs || [];
  const totalPages = data?.pages || 0;
  const totalVideos = data?.total || 0;

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

  // Handle clicking on a video's creator
  const handleCreatorClick = useCallback((username) => {
    if (onCreatorSelect) {
      onCreatorSelect(username);
    }
  }, [onCreatorSelect]);

  if (type === 'following-feed' && followingQuery.isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading your followed creators...</p>
      </div>
    );
  }

  if (type === 'following-feed' && followedUsernames.length === 0 && !followingQuery.isLoading) {
    return (
      <div className="empty">
        <h2>{title}</h2>
        <p>Follow some creators to see their latest posts here!</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <p>Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="feed-view">
      <div className="feed-header">
        <h2>{title}</h2>
        {totalVideos > 0 && (
          <span className="feed-count">{totalVideos} videos</span>
        )}
      </div>

      <VideoGrid
        videos={videos}
        isLoading={isLoading}
        isFetching={isFetching}
        onVideoSelect={handleVideoSelect}
        showCreator={true}
        onCreatorClick={handleCreatorClick}
      />

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1 || isFetching}
          >
            &larr; Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages || isFetching}
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
    </div>
  );
}

export default FeedView;
