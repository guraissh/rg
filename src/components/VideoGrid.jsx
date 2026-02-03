import { useState, useRef } from 'react';
import { proxyMediaUrl } from '../api';

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num?.toString() || '0';
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

function VideoCard({ video, index, onSelect, showCreator, onCreatorClick, linkBuilder }) {
  const [isHovering, setIsHovering] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const videoRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const touchStartRef = useRef(null);
  const longPressTriggeredRef = useRef(false);

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovering(true);
    }, 400);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovering(false);
  };

  const handleTouchStart = (e) => {
    longPressTriggeredRef.current = false;
    touchStartRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      setIsHovering(true);
    }, 400);
  };

  const handleTouchEnd = (e) => {
    if (touchStartRef.current) {
      clearTimeout(touchStartRef.current);
    }
    if (longPressTriggeredRef.current) {
      e.preventDefault();
      setIsHovering(false);
    }
  };

  const handleTouchMove = () => {
    if (touchStartRef.current) {
      clearTimeout(touchStartRef.current);
    }
  };

  const handleCreatorClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCreatorClick && video.userName) {
      onCreatorClick(video.userName);
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    onSelect(index);
  };

  const thumbnailUrl = proxyMediaUrl(video.urls?.thumbnail || video.urls?.poster);
  const previewUrl = proxyMediaUrl(video.urls?.silent || video.urls?.sd);

  // Build the video URL for the link
  const href = linkBuilder ? linkBuilder(video) : `/videos/${encodeURIComponent(video.id)}`;

  return (
    <a
      href={href}
      className="video-card"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      <div className="video-thumbnail">
        <img
          src={thumbnailUrl}
          alt={video.description || 'Video thumbnail'}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          style={{
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-out'
          }}
        />
        {isHovering && previewUrl && (
          <video
            ref={videoRef}
            src={previewUrl}
            autoPlay
            muted
            loop
            playsInline
            className="video-thumbnail-preview"
          />
        )}
        <div className="video-thumbnail-overlay">
          <span className="video-stat">{formatNumber(video.views)}</span>
          <span className="video-stat">{formatNumber(video.likes)} ♥</span>
          <span className="video-duration">{formatDuration(video.duration)}</span>
        </div>
      </div>
      <div className="video-info">
        {showCreator && video.userName && (
          <div className="video-creator" onClick={handleCreatorClick}>
            @{video.userName}
            {video.verified && (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ color: 'var(--accent-blue)', marginLeft: '4px' }}>
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            )}
          </div>
        )}
        <div className="video-title">
          {video.description || video.tags?.join(', ') || 'Untitled'}
        </div>
      </div>
    </a>
  );
}

function SkeletonCard({ height = 200 }) {
  return (
    <div className="video-card" style={{ pointerEvents: 'none' }}>
      <div
        className="video-thumbnail video-thumbnail--skeleton"
        style={{
          height: `${height}px`,
          background: 'linear-gradient(90deg, var(--bg-elevated) 0%, var(--bg-surface) 50%, var(--bg-elevated) 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite'
        }}
      />
      <div className="video-info">
        <div
          style={{
            height: '14px',
            width: '40%',
            background: 'var(--bg-surface)',
            borderRadius: '4px',
            marginBottom: '10px'
          }}
        />
        <div
          style={{
            height: '16px',
            width: '90%',
            background: 'var(--bg-surface)',
            borderRadius: '4px',
            marginBottom: '8px'
          }}
        />
        <div
          style={{
            height: '14px',
            width: '60%',
            background: 'var(--bg-surface)',
            borderRadius: '4px'
          }}
        />
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

function VideoGrid({ videos, isLoading, isFetching, onVideoSelect, showCreator = false, onCreatorClick, linkBuilder, columns = 4 }) {
  const masonryStyle = {
    columnCount: columns,
    opacity: isFetching ? 0.6 : 1,
    transition: 'opacity 0.2s ease-out'
  };

  if (isLoading) {
    // Show skeleton cards with varying heights for masonry effect
    const skeletonHeights = [180, 280, 200, 320, 240, 180, 300, 220];
    return (
      <div className="video-masonry" style={{ columnCount: columns }}>
        {skeletonHeights.map((height, i) => (
          <SkeletonCard key={i} height={height} />
        ))}
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" style={{ opacity: 0.4 }}>
            <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
          </svg>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>No videos found</p>
      </div>
    );
  }

  return (
    <div className="video-masonry" style={masonryStyle}>
      {videos.map((video, index) => (
        <VideoCard
          key={video.id}
          video={video}
          index={index}
          onSelect={onVideoSelect}
          showCreator={showCreator}
          onCreatorClick={onCreatorClick}
          linkBuilder={linkBuilder}
        />
      ))}
    </div>
  );
}

export default VideoGrid;
