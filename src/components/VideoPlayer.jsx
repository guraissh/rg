import { useEffect, useState } from 'react';
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import {
  DefaultVideoLayout,
  defaultLayoutIcons
} from '@vidstack/react/player/layouts/default';

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num?.toString() || '0';
}

function VideoPlayer({
  video,
  currentIndex,
  totalVideos,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext
}) {
  const [quality, setQuality] = useState('hd');

  const videoUrl = quality === 'hd' ? (video.urls?.hd || video.urls?.sd) : video.urls?.sd;

  // Focus trap and prevent body scroll
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Handle click outside video to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleVideoEnd = () => {
    if (hasNext) {
      onNext();
    }
  };

  return (
    <div className="video-modal">
      <div className="video-modal-header">
        <div className="video-modal-title">
          {video.description || video.tags?.join(', ') || 'Untitled'}
          {video.userName && (
            <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
              by {video.userName}
            </span>
          )}
        </div>
        <button className="video-modal-close" onClick={onClose}>
          Close (Esc)
        </button>
      </div>

      <div className="video-modal-content" onClick={handleBackdropClick}>
        <button
          className="nav-button prev"
          onClick={onPrev}
          disabled={!hasPrev}
          title="Previous (← or A)"
        >
          ‹
        </button>

        <div className="video-player-container">
          <MediaPlayer
            key={`${video.id}-${quality}`}
            src={videoUrl}
            autoPlay
            onEnded={handleVideoEnd}
            className="video-player"
          >
            <MediaProvider />
            <DefaultVideoLayout icons={defaultLayoutIcons} />
          </MediaPlayer>
        </div>

        <button
          className="nav-button next"
          onClick={onNext}
          disabled={!hasNext}
          title="Next (→ or D)"
        >
          ›
        </button>
      </div>

      <div className="video-modal-info">
        <div className="video-modal-stats">
          <span>{formatNumber(video.views)} views</span>
          <span>{formatNumber(video.likes)} likes</span>
          {video.hasAudio && <span>🔊 Has audio</span>}
          <span>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              style={{
                background: 'var(--bg-tertiary)',
                border: 'none',
                color: 'var(--text-secondary)',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <option value="hd">HD</option>
              <option value="sd">SD</option>
            </select>
          </span>
        </div>
        <div className="video-modal-nav-info">
          Video {currentIndex + 1} of {totalVideos}
          <span style={{ marginLeft: '16px', opacity: 0.7 }}>
            Use ← → or A D to navigate
          </span>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
