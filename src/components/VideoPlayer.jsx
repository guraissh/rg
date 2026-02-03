import { useEffect, useState, useRef, useCallback } from 'react';

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num?.toString() || '0';
}

function formatTime(seconds) {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// SVG Icons as components for cleaner code
const Icons = {
  close: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  ),
  chevronLeft: (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
    </svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
    </svg>
  ),
  views: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    </svg>
  ),
  like: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
    </svg>
  ),
  audio: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>
  ),
  keyboard: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/>
    </svg>
  ),
};

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsMenu, setSettingsMenu] = useState('main');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0 });

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const progressRef = useRef(null);
  const settingsRef = useRef(null);

  const videoUrl = quality === 'hd' ? (video.urls?.hd || video.urls?.sd) : video.urls?.sd;

  const savedTimeRef = useRef(0);
  const isQualityChangeRef = useRef(false);

  const handleQualityChange = (newQuality) => {
    if (videoRef.current) {
      savedTimeRef.current = videoRef.current.currentTime;
      isQualityChangeRef.current = true;
    }
    setQuality(newQuality);
    setSettingsMenu('main');
  };

  useEffect(() => {
    if (isQualityChangeRef.current && videoRef.current) {
      const restoreTime = () => {
        videoRef.current.currentTime = savedTimeRef.current;
        isQualityChangeRef.current = false;
      };
      videoRef.current.addEventListener('loadedmetadata', restoreTime, { once: true });
    }
  }, [videoUrl]);

  // Sync playing state when video changes
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const syncPlayState = () => {
      if (videoRef.current) {
        setIsPlaying(!videoRef.current.paused);
      }
    };

    // Check state after a brief delay to allow autoplay to kick in
    const timeoutId = setTimeout(syncPlayState, 100);

    // Also sync when video can play
    videoEl.addEventListener('canplay', syncPlayState, { once: true });

    return () => {
      clearTimeout(timeoutId);
    };
  }, [video.id, videoUrl]);

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying && !isSeeking && !showSettings) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying, isSeeking, showSettings]);

  useEffect(() => {
    const handleClick = () => setContextMenu({ show: false, x: 0, y: 0 });
    if (contextMenu.show) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu.show]);

  useEffect(() => {
    const handleClick = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
        setSettingsMenu('main');
      }
    };
    if (showSettings) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showSettings]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Sync initial state
    setIsPlaying(!video.paused);

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPlaying = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => {}; // Video is buffering, keep isPlaying true
    const onEnded = () => {
      if (isLooping) {
        video.currentTime = 0;
        video.play();
      } else if (hasNext) {
        onNext();
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('progress', onProgress);
    video.addEventListener('play', onPlay);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('ended', onEnded);
    };
  }, [hasNext, onNext, isLooping]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        if (showSettings) {
          setShowSettings(false);
          setSettingsMenu('main');
        } else if (isFullscreen) {
          document.exitFullscreen();
        } else {
          onClose();
        }
      } else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'j') {
        videoRef.current.currentTime -= 10;
      } else if (e.key === 'l') {
        videoRef.current.currentTime += 10;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        videoRef.current.currentTime -= 5;
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        videoRef.current.currentTime += 5;
      } else if (e.key === 'a' || e.key === 'A') {
        if (hasPrev) onPrev();
      } else if (e.key === 'd' || e.key === 'D') {
        if (hasNext) onNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setVolume(v => Math.min(1, v + 0.05));
        setIsMuted(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setVolume(v => Math.max(0, v - 0.05));
      } else if (e.key === 'm') {
        setIsMuted(m => !m);
      } else if (e.key === 'f') {
        toggleFullscreen();
      } else if (e.key === '0' || e.key === 'Home') {
        e.preventDefault();
        videoRef.current.currentTime = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        videoRef.current.currentTime = duration;
      } else if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        videoRef.current.currentTime = duration * (parseInt(e.key) / 10);
      } else if (e.key === '<' || e.key === ',') {
        setPlaybackSpeed(s => Math.max(0.25, s - 0.25));
      } else if (e.key === '>' || e.key === '.') {
        setPlaybackSpeed(s => Math.min(2, s + 0.25));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onClose, onPrev, onNext, hasPrev, hasNext, duration, showSettings]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [volume, isMuted, playbackSpeed]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Autoplay might be blocked
        setIsPlaying(false);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleProgressHover = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const time = pos * duration;
    setHoverTime(time);
    setHoverPosition(e.clientX - rect.left);
  };

  const handleProgressLeave = () => {
    setHoverTime(null);
  };

  const handleProgressClick = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * duration;
  };

  const handleProgressMouseDown = (e) => {
    setIsSeeking(true);
    handleProgressClick(e);

    const onMouseMove = (e) => {
      const rect = progressRef.current.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      videoRef.current.currentTime = pos * duration;
      setHoverTime(pos * duration);
      setHoverPosition(e.clientX - rect.left);
    };

    const onMouseUp = () => {
      setIsSeeking(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleVolumeChange = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    setVolume(Math.max(0, Math.min(1, pos)));
    setIsMuted(false);
  };

  const handleVolumeMouseDown = (e) => {
    handleVolumeChange(e);

    const slider = e.currentTarget;
    const onMouseMove = (e) => {
      const rect = slider.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setVolume(pos);
      setIsMuted(false);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDoubleClick = (e) => {
    if (e.target === videoRef.current) {
      toggleFullscreen();
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    setContextMenu({
      show: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const copyVideoUrl = () => {
    navigator.clipboard?.writeText(window.location.href);
    setContextMenu({ show: false, x: 0, y: 0 });
  };

  const copyVideoUrlAtTime = () => {
    const time = Math.floor(currentTime);
    navigator.clipboard?.writeText(`${window.location.href}?t=${time}`);
    setContextMenu({ show: false, x: 0, y: 0 });
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const bufferedProgress = duration ? (buffered / duration) * 100 : 0;

  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  const styles = {
    modal: {
      position: 'fixed',
      inset: 0,
      background: '#000',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)',
      zIndex: 20,
      opacity: showControls ? 1 : 0,
      transition: 'opacity 0.3s ease',
      pointerEvents: showControls ? 'auto' : 'none',
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      minWidth: 0,
      flex: 1,
    },
    closeBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '40px',
      height: '40px',
      border: 'none',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.1)',
      color: '#fff',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      flexShrink: 0,
    },
    titleContainer: {
      minWidth: 0,
      flex: 1,
    },
    title: {
      fontSize: '16px',
      fontWeight: 600,
      color: '#fff',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      marginBottom: '2px',
    },
    creator: {
      fontSize: '13px',
      color: 'rgba(255,255,255,0.7)',
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexShrink: 0,
    },
    counter: {
      padding: '8px 16px',
      background: 'rgba(255,255,255,0.1)',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: 500,
      color: 'rgba(255,255,255,0.9)',
    },
    content: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    navButton: {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '52px',
      height: '52px',
      border: 'none',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      color: '#fff',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 15,
      transition: 'all 0.2s ease',
      opacity: showControls ? 1 : 0,
      pointerEvents: showControls ? 'auto' : 'none',
    },
    navButtonDisabled: {
      opacity: 0.3,
      cursor: 'default',
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)',
      padding: '40px 24px 20px',
      zIndex: 20,
      opacity: showControls ? 1 : 0,
      transition: 'opacity 0.3s ease',
      pointerEvents: showControls ? 'auto' : 'none',
    },
    statsRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '0',
    },
    stats: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
    },
    statItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '13px',
      color: 'rgba(255,255,255,0.8)',
    },
    shortcuts: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '12px',
      color: 'rgba(255,255,255,0.5)',
    },
    shortcutKey: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '20px',
      height: '20px',
      padding: '0 6px',
      background: 'rgba(255,255,255,0.15)',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 600,
      color: 'rgba(255,255,255,0.8)',
    },
  };

  return (
    <div style={styles.modal}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button
            style={styles.closeBtn}
            onClick={onClose}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            title="Close (Esc)"
          >
            {Icons.close}
          </button>
          <div style={styles.titleContainer}>
            <div style={styles.title}>
              {video.description || video.tags?.join(', ') || 'Untitled'}
            </div>
            {video.userName && (
              <div style={styles.creator}>@{video.userName}</div>
            )}
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.counter}>
            {currentIndex + 1} / {totalVideos}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div style={styles.content} onClick={handleBackdropClick}>
        {/* Previous button */}
        <button
          style={{
            ...styles.navButton,
            left: '20px',
            ...(hasPrev ? {} : styles.navButtonDisabled),
          }}
          onClick={hasPrev ? onPrev : undefined}
          onMouseEnter={(e) => hasPrev && (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
          onMouseLeave={(e) => hasPrev && (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          disabled={!hasPrev}
          title="Previous (A)"
        >
          {Icons.chevronLeft}
        </button>

        {/* Video Player */}
        <div
          ref={containerRef}
          className={`ytp-player ${showControls || !isPlaying ? '' : 'ytp-autohide'}`}
          onMouseMove={resetControlsTimeout}
          onMouseLeave={() => isPlaying && !showSettings && setShowControls(false)}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
        >
          <video
            ref={videoRef}
            key={`${video.id}-${quality}`}
            src={videoUrl}
            autoPlay
            playsInline
            loop={isLooping}
            onClick={togglePlay}
            className="ytp-video-element"
          />

          {!isPlaying && (
            <div className="ytp-large-play-button" onClick={togglePlay}>
              <svg viewBox="0 0 68 48">
                <path className="ytp-large-play-button-bg" d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#f00"/>
                <path d="M 45,24 27,14 27,34" fill="#fff"/>
              </svg>
            </div>
          )}

          <div className="ytp-gradient-bottom" />

          {contextMenu.show && (
            <div
              className="ytp-context-menu"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <div className="ytp-context-menu-item" onClick={() => { setIsLooping(!isLooping); setContextMenu({ show: false, x: 0, y: 0 }); }}>
                <span className="ytp-context-menu-icon">{isLooping ? '✓' : ''}</span>
                <span>Loop</span>
              </div>
              <div className="ytp-context-menu-item" onClick={copyVideoUrl}>
                <span className="ytp-context-menu-icon"></span>
                <span>Copy video URL</span>
              </div>
              <div className="ytp-context-menu-item" onClick={copyVideoUrlAtTime}>
                <span className="ytp-context-menu-icon"></span>
                <span>Copy video URL at current time</span>
              </div>
              <div className="ytp-context-menu-separator" />
              <div className="ytp-context-menu-item ytp-context-menu-stats">
                <span className="ytp-context-menu-icon"></span>
                <span>Stats for nerds</span>
              </div>
            </div>
          )}

          <div className="ytp-chrome-bottom">
            <div
              ref={progressRef}
              className={`ytp-progress-bar-container ${isSeeking ? 'ytp-dragging' : ''}`}
              onMouseMove={handleProgressHover}
              onMouseLeave={handleProgressLeave}
              onMouseDown={handleProgressMouseDown}
            >
              {hoverTime !== null && (
                <div
                  className="ytp-tooltip"
                  style={{ left: Math.max(20, Math.min(hoverPosition, progressRef.current?.offsetWidth - 20)) }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}

              <div className="ytp-progress-bar">
                <div className="ytp-progress-list">
                  <div
                    className="ytp-load-progress"
                    style={{ transform: `scaleX(${bufferedProgress / 100})` }}
                  />
                  {hoverTime !== null && (
                    <div
                      className="ytp-hover-progress"
                      style={{ transform: `scaleX(${(hoverTime / duration) || 0})` }}
                    />
                  )}
                  <div
                    className="ytp-play-progress"
                    style={{ transform: `scaleX(${progress / 100})` }}
                  />
                </div>
                <div
                  className="ytp-scrubber-container"
                  style={{ left: `${progress}%` }}
                >
                  <div className="ytp-scrubber-button" />
                </div>
              </div>
            </div>

            <div className="ytp-chrome-controls">
              <div className="ytp-left-controls">
                <button className="ytp-button ytp-play-button" onClick={togglePlay} title={isPlaying ? 'Pause (k)' : 'Play (k)'}>
                  {isPlaying ? (
                    <svg height="100%" viewBox="0 0 36 36" width="100%">
                      <path fill="#fff" d="M 12,26 16,26 16,10 12,10 z M 21,26 25,26 25,10 21,10 z" />
                    </svg>
                  ) : (
                    <svg height="100%" viewBox="0 0 36 36" width="100%">
                      <path fill="#fff" d="M 12,26 18.5,22 18.5,14 12,10 z M 18.5,22 25,18 25,18 18.5,14 z" />
                    </svg>
                  )}
                </button>

                <button className="ytp-button ytp-next-button" onClick={onNext} disabled={!hasNext} title="Next (d)">
                  <svg height="100%" viewBox="0 0 36 36" width="100%">
                    <path fill="#fff" d="m 12,24 8.5,-6 -8.5,-6 v 12 z m 9,-12 v 12 h 2 V 12 h -2 z" />
                  </svg>
                </button>

                <div
                  className="ytp-volume-area"
                  onMouseEnter={() => setIsVolumeHovered(true)}
                  onMouseLeave={() => setIsVolumeHovered(false)}
                >
                  <button
                    className="ytp-button ytp-mute-button"
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? 'Unmute (m)' : 'Mute (m)'}
                  >
                    {isMuted || volume === 0 ? (
                      <svg height="100%" viewBox="0 0 36 36" width="100%">
                        <path fill="#fff" d="m 21.48,17.98 c 0,-1.77 -1.02,-3.29 -2.5,-4.03 v 2.21 l 2.45,2.45 c .03,-0.2 .05,-0.41 .05,-0.63 z m 2.5,0 c 0,.94 -0.2,1.82 -0.54,2.64 l 1.51,1.51 c .66,-1.24 1.03,-2.65 1.03,-4.15 0,-4.28 -2.99,-7.86 -7,-8.76 v 2.05 c 2.89,.86 5,3.54 5,6.71 z M 9.25,8.98 l -1.27,1.26 4.72,4.73 H 7.98 v 6 H 11.98 l 5,5 v -6.73 l 4.25,4.25 c -0.67,.52 -1.42,.93 -2.25,1.18 v 2.06 c 1.38,-0.31 2.63,-0.95 3.69,-1.81 l 2.04,2.05 1.27,-1.27 -9,-9 -7.72,-7.72 z m 7.72,.99 -2.09,2.08 2.09,2.09 V 9.98 z" />
                      </svg>
                    ) : volume < 0.5 ? (
                      <svg height="100%" viewBox="0 0 36 36" width="100%">
                        <path fill="#fff" d="M8,21 L12,21 L17,26 L17,10 L12,15 L8,15 L8,21 Z M19,14 L19,22 C20.48,21.32 21.5,19.77 21.5,18 C21.5,16.26 20.48,14.74 19,14 Z" />
                      </svg>
                    ) : (
                      <svg height="100%" viewBox="0 0 36 36" width="100%">
                        <path fill="#fff" d="M8,21 L12,21 L17,26 L17,10 L12,15 L8,15 L8,21 Z M19,14 L19,22 C20.48,21.32 21.5,19.77 21.5,18 C21.5,16.26 20.48,14.74 19,14 Z M19,11.29 C21.89,12.15 24,14.83 24,18 C24,21.17 21.89,23.85 19,24.71 L19,26.77 C23.01,25.86 26,22.28 26,18 C26,13.72 23.01,10.14 19,9.23 L19,11.29 Z" />
                      </svg>
                    )}
                  </button>
                  <div className={`ytp-volume-panel ${isVolumeHovered ? 'ytp-volume-slider-active' : ''}`}>
                    <div
                      className="ytp-volume-slider"
                      onMouseDown={handleVolumeMouseDown}
                    >
                      <div className="ytp-volume-slider-track">
                        <div
                          className="ytp-volume-slider-fill"
                          style={{ transform: `scaleX(${isMuted ? 0 : volume})` }}
                        />
                      </div>
                      <div
                        className="ytp-volume-slider-handle"
                        style={{ left: `${(isMuted ? 0 : volume) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="ytp-time-display">
                  <span className="ytp-time-current">{formatTime(currentTime)}</span>
                  <span className="ytp-time-separator"> / </span>
                  <span className="ytp-time-duration">{formatTime(duration)}</span>
                </div>
              </div>

              <div className="ytp-right-controls">
                <div className="ytp-settings-menu-container" ref={settingsRef}>
                  <button
                    className={`ytp-button ytp-settings-button ${showSettings ? 'ytp-settings-open' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); setSettingsMenu('main'); }}
                    title="Settings"
                  >
                    <svg height="100%" viewBox="0 0 36 36" width="100%">
                      <path fill="#fff" d="m 23.94,18.78 c .03,-0.25 .06,-0.51 .06,-0.78 0,-0.27 -0.03,-0.53 -0.06,-0.78 l 1.69,-1.32 c .15,-0.12 .19,-0.34 .1,-0.51 l -1.6,-2.77 c -0.1,-0.18 -0.31,-0.24 -0.49,-0.18 l -1.99,.8 c -0.42,-0.32 -0.86,-0.58 -1.35,-0.78 l -0.30,-2.12 c -0.02,-0.19 -0.19,-0.34 -0.39,-0.34 h -3.2 c -0.2,0 -0.36,.15 -0.39,.34 l -0.3,2.12 c -0.49,.2 -0.94,.47 -1.35,.78 l -1.99,-0.8 c -0.18,-0.07 -0.39,0 -0.49,.18 l -1.6,2.77 c -0.1,.18 -0.06,.39 .1,.51 l 1.69,1.32 c -0.03,.25 -0.06,.52 -0.06,.78 0,.26 .03,.52 .06,.78 l -1.69,1.32 c -0.15,.12 -0.19,.34 -0.1,.51 l 1.6,2.77 c .1,.18 .31,.24 .49,.18 l 1.99,-0.8 c .42,.32 .86,.58 1.35,.78 l .3,2.12 c .02,.19 .19,.34 .39,.34 h 3.2 c .2,0 .37,-0.15 .39,-0.34 l .3,-2.12 c .49,-0.2 .94,-0.47 1.35,-0.78 l 1.99,.8 c .18,.07 .39,0 .49,-0.18 l 1.6,-2.77 c .1,-0.18 .06,-0.39 -0.1,-0.51 l -1.67,-1.32 z M 18,20.5 c -1.38,0 -2.5,-1.12 -2.5,-2.5 0,-1.38 1.12,-2.5 2.5,-2.5 1.38,0 2.5,1.12 2.5,2.5 0,1.38 -1.12,2.5 -2.5,2.5 z" />
                    </svg>
                  </button>

                  {showSettings && (
                    <div className="ytp-settings-menu">
                      {settingsMenu === 'main' && (
                        <>
                          <div className="ytp-settings-menu-item" onClick={() => setSettingsMenu('speed')}>
                            <span className="ytp-settings-menu-label">Playback speed</span>
                            <span className="ytp-settings-menu-value">{playbackSpeed === 1 ? 'Normal' : playbackSpeed + 'x'}</span>
                          </div>
                          <div className="ytp-settings-menu-item" onClick={() => setSettingsMenu('quality')}>
                            <span className="ytp-settings-menu-label">Quality</span>
                            <span className="ytp-settings-menu-value">{quality === 'hd' ? 'HD' : 'SD'}</span>
                          </div>
                        </>
                      )}
                      {settingsMenu === 'speed' && (
                        <>
                          <div className="ytp-settings-menu-header" onClick={() => setSettingsMenu('main')}>
                            <svg viewBox="0 0 24 24" width="24" height="24">
                              <path fill="#fff" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                            </svg>
                            <span>Playback speed</span>
                          </div>
                          {speedOptions.map(speed => (
                            <div
                              key={speed}
                              className={`ytp-settings-menu-item ${playbackSpeed === speed ? 'ytp-settings-menu-item-selected' : ''}`}
                              onClick={() => { setPlaybackSpeed(speed); setSettingsMenu('main'); }}
                            >
                              <span className="ytp-settings-menu-check">{playbackSpeed === speed ? '✓' : ''}</span>
                              <span>{speed === 1 ? 'Normal' : speed}</span>
                            </div>
                          ))}
                        </>
                      )}
                      {settingsMenu === 'quality' && (
                        <>
                          <div className="ytp-settings-menu-header" onClick={() => setSettingsMenu('main')}>
                            <svg viewBox="0 0 24 24" width="24" height="24">
                              <path fill="#fff" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                            </svg>
                            <span>Quality</span>
                          </div>
                          <div
                            className={`ytp-settings-menu-item ${quality === 'hd' ? 'ytp-settings-menu-item-selected' : ''}`}
                            onClick={() => handleQualityChange('hd')}
                          >
                            <span className="ytp-settings-menu-check">{quality === 'hd' ? '✓' : ''}</span>
                            <span>HD</span>
                          </div>
                          <div
                            className={`ytp-settings-menu-item ${quality === 'sd' ? 'ytp-settings-menu-item-selected' : ''}`}
                            onClick={() => handleQualityChange('sd')}
                          >
                            <span className="ytp-settings-menu-check">{quality === 'sd' ? '✓' : ''}</span>
                            <span>SD</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <button className="ytp-button ytp-fullscreen-button" onClick={toggleFullscreen} title={isFullscreen ? 'Exit full screen (f)' : 'Full screen (f)'}>
                  {isFullscreen ? (
                    <svg height="100%" viewBox="0 0 36 36" width="100%">
                      <path fill="#fff" d="m 14,14 -4,0 0,2 6,0 0,-6 -2,0 0,4 0,0 z m -4,8 4,0 0,4 2,0 0,-6 -6,0 0,2 0,0 z m 12,-6 0,6 -4,0 0,-4 -2,0 0,6 6,0 0,-2 6,0 0,-6 -6,0 z m 0,-2 6,0 0,2 -6,0 0,-6 2,0 0,4 z" />
                    </svg>
                  ) : (
                    <svg height="100%" viewBox="0 0 36 36" width="100%">
                      <path fill="#fff" d="m 10,16 2,0 0,-4 4,0 0,-2 L 10,10 l 0,6 0,0 z m 2,4 -2,0 0,6 6,0 0,-2 -4,0 0,-4 0,0 z m 14,-6 0,-6 -6,0 0,2 4,0 0,4 2,0 0,0 z m -2,10 -4,0 0,2 6,0 0,-6 -2,0 0,4 0,0 z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Next button */}
        <button
          style={{
            ...styles.navButton,
            right: '20px',
            ...(hasNext ? {} : styles.navButtonDisabled),
          }}
          onClick={hasNext ? onNext : undefined}
          onMouseEnter={(e) => hasNext && (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
          onMouseLeave={(e) => hasNext && (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          disabled={!hasNext}
          title="Next (D)"
        >
          {Icons.chevronRight}
        </button>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.statsRow}>
          <div style={styles.stats}>
            <div style={styles.statItem}>
              {Icons.views}
              <span>{formatNumber(video.views)} views</span>
            </div>
            <div style={styles.statItem}>
              {Icons.like}
              <span>{formatNumber(video.likes)} likes</span>
            </div>
            {video.hasAudio && (
              <div style={styles.statItem}>
                {Icons.audio}
                <span>Audio</span>
              </div>
            )}
          </div>
          <div style={styles.shortcuts}>
            {Icons.keyboard}
            <span style={styles.shortcutKey}>A</span>
            <span style={styles.shortcutKey}>D</span>
            <span style={{ margin: '0 4px' }}>navigate</span>
            <span style={styles.shortcutKey}>J</span>
            <span style={styles.shortcutKey}>L</span>
            <span style={{ margin: '0 4px' }}>seek</span>
            <span style={styles.shortcutKey}>F</span>
            <span>fullscreen</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
