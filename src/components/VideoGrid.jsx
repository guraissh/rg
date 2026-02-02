import { useState, useRef } from 'react';

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

function VideoCard({ video, index, onSelect, showCreator, onCreatorClick }) {
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovering(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovering(false);
  };

  const handleCreatorClick = (e) => {
    e.stopPropagation();
    if (onCreatorClick && video.userName) {
      onCreatorClick(video.userName);
    }
  };

  const thumbnailUrl = video.urls?.thumbnail || video.urls?.poster;
  const previewUrl = video.urls?.silent || video.urls?.sd;

  return (
    <div
      className="video-card"
      onClick={() => onSelect(index)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="video-thumbnail">
        {isHovering && previewUrl ? (
          <video
            ref={videoRef}
            src={previewUrl}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            src={thumbnailUrl}
            alt={video.description || 'Video thumbnail'}
            loading="lazy"
          />
        )}
        <span className="video-duration">{formatDuration(video.duration)}</span>
      </div>
      <div className="video-info">
        {showCreator && video.userName && (
          <div className="video-creator" onClick={handleCreatorClick}>
            @{video.userName}
            {video.verified && <span className="verified-badge"> &#10003;</span>}
          </div>
        )}
        <div className="video-title">
          {video.description || video.tags?.join(', ') || 'Untitled'}
        </div>
        <div className="video-meta">
          <span>{formatNumber(video.views)} views</span>
          <span>{formatNumber(video.likes)} likes</span>
          <span>{formatDate(video.createDate)}</span>
        </div>
      </div>
    </div>
  );
}

function VideoGrid({ videos, isLoading, isFetching, onVideoSelect, showCreator = false, onCreatorClick }) {
  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading videos...</p>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="empty">
        <p>No videos found.</p>
      </div>
    );
  }

  return (
    <div className="video-grid" style={{ opacity: isFetching ? 0.7 : 1 }}>
      {videos.map((video, index) => (
        <VideoCard
          key={video.id}
          video={video}
          index={index}
          onSelect={onVideoSelect}
          showCreator={showCreator}
          onCreatorClick={onCreatorClick}
        />
      ))}
    </div>
  );
}

export default VideoGrid;
