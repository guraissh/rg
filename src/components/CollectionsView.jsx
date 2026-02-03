import { useState, useRef, useEffect } from 'react';
import { useMyCollections } from '../hooks';

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toString() || '0';
}

function CollectionCard({ collection, onClick }) {
  const [imgError, setImgError] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef(null);

  const name = collection.folderName || collection.name || 'Untitled';
  const staticThumb = collection.thumbs || collection.thumb;
  const animatedThumb = collection.thumba;
  const count = collection.contentCount ?? collection.gifCount ?? 0;
  const showImage = staticThumb && !imgError;

  useEffect(() => {
    if (isHovering && videoRef.current) {
      videoRef.current.play();
    } else if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isHovering]);

  const collectionId = collection.folderId || collection.id;
  const href = `/collection/${encodeURIComponent(collectionId)}`;

  const handleClick = (e) => {
    e.preventDefault();
    onClick(collection);
  };

  return (
    <a
      href={href}
      className="collection-card"
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="collection-thumbnail">
        {showImage ? (
          <>
            <img
              src={staticThumb}
              alt={name}
              loading="lazy"
              onError={() => setImgError(true)}
              style={{ opacity: isHovering && animatedThumb ? 0 : 1, transition: 'opacity 0.2s ease-out' }}
            />
            {animatedThumb && (
              <video
                ref={videoRef}
                src={animatedThumb}
                muted
                loop
                playsInline
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: isHovering ? 1 : 0,
                  transition: 'opacity 0.2s ease-out',
                }}
              />
            )}
          </>
        ) : (
          <div className="collection-placeholder">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" style={{ opacity: 0.4 }}>
              <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
            </svg>
          </div>
        )}
        <div className="collection-overlay">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ opacity: 0.9 }}>
            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/>
          </svg>
          <span className="collection-count">{count}</span>
        </div>
      </div>
      <div className="collection-info">
        <h3 className="collection-name">{name}</h3>
        {collection.description && (
          <p className="collection-description">{collection.description}</p>
        )}
      </div>
    </a>
  );
}

function CollectionsView({ onCreatorSelect, onCollectionSelect }) {
  const [page, setPage] = useState(1);

  const {
    data: collectionsData,
    isLoading: collectionsLoading,
    error: collectionsError,
  } = useMyCollections({ page, count: 20 });

  const collections = collectionsData?.collections || [];
  const totalPages = collectionsData?.pages || 0;
  const totalCollections = collectionsData?.totalCount ?? collectionsData?.total ?? 0;

  if (collectionsLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Loading collections...</p>
      </div>
    );
  }

  if (collectionsError) {
    return (
      <div className="error">
        <p>Error: {collectionsError.message}</p>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" style={{ opacity: 0.4 }}>
            <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>No Collections Yet</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Save videos to collections on RedGifs to see them here.</p>
      </div>
    );
  }

  return (
    <div className="collections-view">
      <div className="list-header">
        <h2>Collections</h2>
        {totalCollections > 0 && (
          <span className="list-count">{formatNumber(totalCollections)} collections</span>
        )}
      </div>

      <div className="collections-grid">
        {collections.map((collection, index) => (
          <CollectionCard
            key={collection.folderId || collection.id || index}
            collection={collection}
            onClick={onCollectionSelect}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default CollectionsView;
