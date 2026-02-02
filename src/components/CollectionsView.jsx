import { useState, useCallback } from 'react';
import { useMyCollections, useCollectionGifs } from '../hooks';
import VideoGrid from './VideoGrid';
import VideoPlayer from './VideoPlayer';

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toString() || '0';
}

function CollectionCard({ collection, onClick }) {
  const thumbnail = collection.cover || collection.preview?.urls?.thumbnail;

  return (
    <div className="collection-card" onClick={() => onClick(collection)}>
      <div className="collection-thumbnail">
        {thumbnail ? (
          <img src={thumbnail} alt={collection.name} loading="lazy" />
        ) : (
          <div className="collection-placeholder">
            <span>{collection.name?.charAt(0).toUpperCase() || 'C'}</span>
          </div>
        )}
        <div className="collection-overlay">
          <span className="collection-count">{collection.gifCount || 0} videos</span>
        </div>
      </div>
      <div className="collection-info">
        <h3 className="collection-name">{collection.name || 'Untitled Collection'}</h3>
        {collection.description && (
          <p className="collection-description">{collection.description}</p>
        )}
      </div>
    </div>
  );
}

function CollectionsView({ onCreatorSelect }) {
  const [page, setPage] = useState(1);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionPage, setCollectionPage] = useState(1);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(null);

  // Fetch user's collections
  const {
    data: collectionsData,
    isLoading: collectionsLoading,
    error: collectionsError,
  } = useMyCollections({ page, count: 20 });

  // Fetch videos for selected collection
  const {
    data: collectionGifsData,
    isLoading: gifsLoading,
    isFetching: gifsFetching,
  } = useCollectionGifs(selectedCollection?.id, { page: collectionPage, count: 40 });

  const collections = collectionsData?.collections || [];
  const totalPages = collectionsData?.pages || 0;
  const totalCollections = collectionsData?.total || 0;

  const videos = collectionGifsData?.gifs || [];
  const videosTotalPages = collectionGifsData?.pages || 0;

  const handleCollectionSelect = useCallback((collection) => {
    setSelectedCollection(collection);
    setCollectionPage(1);
    setSelectedVideoIndex(null);
  }, []);

  const handleBackToCollections = useCallback(() => {
    setSelectedCollection(null);
    setSelectedVideoIndex(null);
  }, []);

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

  const handleCreatorClick = useCallback((username) => {
    if (onCreatorSelect) {
      onCreatorSelect(username);
    }
  }, [onCreatorSelect]);

  // Loading state
  if (collectionsLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading your collections...</p>
      </div>
    );
  }

  // Error state
  if (collectionsError) {
    return (
      <div className="error">
        <p>Error: {collectionsError.message}</p>
      </div>
    );
  }

  // Empty state
  if (!selectedCollection && collections.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">&#128193;</div>
        <h2>No Collections Yet</h2>
        <p>Save videos to collections on RedGifs to see them here.</p>
      </div>
    );
  }

  // Show collection detail view
  if (selectedCollection) {
    return (
      <div className="collections-view">
        <div className="collection-detail-header">
          <button className="back-btn" onClick={handleBackToCollections}>
            &#8592; Back to Collections
          </button>
          <div className="collection-detail-info">
            <h2>{selectedCollection.name}</h2>
            <span className="collection-detail-count">
              {formatNumber(selectedCollection.gifCount || 0)} videos
            </span>
          </div>
        </div>

        <VideoGrid
          videos={videos}
          isLoading={gifsLoading}
          isFetching={gifsFetching}
          onVideoSelect={handleVideoSelect}
          showCreator={true}
          onCreatorClick={handleCreatorClick}
        />

        {videosTotalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCollectionPage((p) => p - 1)}
              disabled={collectionPage === 1 || gifsFetching}
            >
              &larr; Previous
            </button>
            <span>Page {collectionPage} of {videosTotalPages}</span>
            <button
              onClick={() => setCollectionPage((p) => p + 1)}
              disabled={collectionPage >= videosTotalPages || gifsFetching}
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

  // Show collections grid
  return (
    <div className="collections-view">
      <div className="list-header">
        <h2>My Collections</h2>
        {totalCollections > 0 && (
          <span className="list-count">{formatNumber(totalCollections)} collections</span>
        )}
      </div>

      <div className="collections-grid">
        {collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            onClick={handleCollectionSelect}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
          >
            &larr; Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
}

export default CollectionsView;
