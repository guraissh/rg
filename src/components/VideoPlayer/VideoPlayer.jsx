import { useEffect, useState, useRef, useCallback } from 'react';
import { proxyMediaUrl } from '../../api';
import { ChevronLeftIcon, ChevronRightIcon, LargePlayIcon } from './Icons';
import { getStyles } from './styles';
import Header from './Header';
import Footer from './Footer';
import ContextMenu from './ContextMenu';
import Controls from './Controls';

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
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768 || 'ontouchstart' in window);

  const videoUrl = proxyMediaUrl(quality === 'hd' ? (video.urls?.hd || video.urls?.sd) : video.urls?.sd);

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

    const timeoutId = setTimeout(syncPlayState, 100);
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

  // Track mobile state on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Touch swipe handlers for mobile navigation
  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
  }, []);

  const handleTouchEnd = useCallback((e) => {
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
      time: Date.now()
    };

    const deltaX = touchEnd.x - touchStartRef.current.x;
    const deltaY = touchEnd.y - touchStartRef.current.y;
    const deltaTime = touchEnd.time - touchStartRef.current.time;

    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) * 1.5;
    const isQuickSwipe = deltaTime < 300;
    const minSwipeDistance = 50;

    if (isHorizontalSwipe && isQuickSwipe && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0 && hasPrev) {
        onPrev();
      } else if (deltaX < 0 && hasNext) {
        onNext();
      }
    }
  }, [hasPrev, hasNext, onPrev, onNext]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

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
    const onWaiting = () => {};
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

    if (isMobile) {
      resetControlsTimeout();
    }

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
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

  const handleProgressTouchStart = (e) => {
    e.stopPropagation();
    setIsSeeking(true);
    const touch = e.touches[0];
    const rect = progressRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pos * duration;
  };

  const handleProgressTouchMove = (e) => {
    if (!isSeeking) return;
    e.stopPropagation();
    const touch = e.touches[0];
    const rect = progressRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pos * duration;
    setHoverTime(pos * duration);
    setHoverPosition(touch.clientX - rect.left);
  };

  const handleProgressTouchEnd = (e) => {
    e.stopPropagation();
    setIsSeeking(false);
    setHoverTime(null);
  };

  const handleVolumeMouseDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    setVolume(Math.max(0, Math.min(1, pos)));
    setIsMuted(false);

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

  const styles = getStyles(isMobile, showControls);

  return (
    <div style={styles.modal}>
      <Header
        video={video}
        currentIndex={currentIndex}
        totalVideos={totalVideos}
        onClose={onClose}
        styles={styles}
      />

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
          <ChevronLeftIcon />
        </button>

        {/* Video Player */}
        <div
          ref={containerRef}
          className={`ytp-player ${showControls || !isPlaying ? '' : 'ytp-autohide'}`}
          onMouseMove={resetControlsTimeout}
          onMouseLeave={() => isPlaying && !showSettings && setShowControls(false)}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
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
              <LargePlayIcon />
            </div>
          )}

          <div className="ytp-gradient-bottom" />

          <ContextMenu
            show={contextMenu.show}
            x={contextMenu.x}
            y={contextMenu.y}
            isLooping={isLooping}
            onToggleLoop={() => { setIsLooping(!isLooping); setContextMenu({ show: false, x: 0, y: 0 }); }}
            onCopyUrl={copyVideoUrl}
            onCopyUrlAtTime={copyVideoUrlAtTime}
          />

          <Controls
            isPlaying={isPlaying}
            hasNext={hasNext}
            volume={volume}
            isMuted={isMuted}
            isVolumeHovered={isVolumeHovered}
            currentTime={currentTime}
            duration={duration}
            isFullscreen={isFullscreen}
            progress={progress}
            bufferedProgress={bufferedProgress}
            hoverTime={hoverTime}
            hoverPosition={hoverPosition}
            isSeeking={isSeeking}
            showSettings={showSettings}
            settingsMenu={settingsMenu}
            playbackSpeed={playbackSpeed}
            quality={quality}
            progressRef={progressRef}
            settingsRef={settingsRef}
            onTogglePlay={togglePlay}
            onNext={onNext}
            onMute={() => setIsMuted(!isMuted)}
            onVolumeMouseDown={handleVolumeMouseDown}
            onFullscreen={toggleFullscreen}
            onProgressHover={handleProgressHover}
            onProgressLeave={handleProgressLeave}
            onProgressMouseDown={handleProgressMouseDown}
            onProgressTouchStart={handleProgressTouchStart}
            onProgressTouchMove={handleProgressTouchMove}
            onProgressTouchEnd={handleProgressTouchEnd}
            onSettingsToggle={(e) => { e.stopPropagation(); setShowSettings(!showSettings); setSettingsMenu('main'); }}
            onSpeedChange={(speed) => { setPlaybackSpeed(speed); setSettingsMenu('main'); }}
            onQualityChange={handleQualityChange}
            onSettingsMenuChange={setSettingsMenu}
            setIsVolumeHovered={setIsVolumeHovered}
          />
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
          <ChevronRightIcon />
        </button>
      </div>

      <Footer
        video={video}
        isMobile={isMobile}
        styles={styles}
      />
    </div>
  );
}

export default VideoPlayer;
