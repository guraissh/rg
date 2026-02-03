import { formatTime } from './utils';
import {
  PlayIcon,
  PauseIcon,
  NextIcon,
  VolumeMutedIcon,
  VolumeLowIcon,
  VolumeHighIcon,
  FullscreenIcon,
  FullscreenExitIcon,
} from './Icons';
import SettingsMenu from './SettingsMenu';
import ProgressBar from './ProgressBar';

function Controls({
  isPlaying,
  hasNext,
  volume,
  isMuted,
  isVolumeHovered,
  currentTime,
  duration,
  isFullscreen,
  progress,
  bufferedProgress,
  hoverTime,
  hoverPosition,
  isSeeking,
  showSettings,
  settingsMenu,
  playbackSpeed,
  quality,
  progressRef,
  settingsRef,
  onTogglePlay,
  onNext,
  onMute,
  onVolumeMouseDown,
  onFullscreen,
  onProgressHover,
  onProgressLeave,
  onProgressMouseDown,
  onProgressTouchStart,
  onProgressTouchMove,
  onProgressTouchEnd,
  onSettingsToggle,
  onSpeedChange,
  onQualityChange,
  onSettingsMenuChange,
  setIsVolumeHovered,
}) {
  return (
    <div className="ytp-chrome-bottom">
      <ProgressBar
        progress={progress}
        bufferedProgress={bufferedProgress}
        duration={duration}
        hoverTime={hoverTime}
        hoverPosition={hoverPosition}
        isSeeking={isSeeking}
        progressRef={progressRef}
        onMouseMove={onProgressHover}
        onMouseLeave={onProgressLeave}
        onMouseDown={onProgressMouseDown}
        onTouchStart={onProgressTouchStart}
        onTouchMove={onProgressTouchMove}
        onTouchEnd={onProgressTouchEnd}
      />

      <div className="ytp-chrome-controls">
        <div className="ytp-left-controls">
          <button className="ytp-button ytp-play-button" onClick={onTogglePlay} title={isPlaying ? 'Pause (k)' : 'Play (k)'}>
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          <button className="ytp-button ytp-next-button" onClick={onNext} disabled={!hasNext} title="Next (d)">
            <NextIcon />
          </button>

          <div
            className="ytp-volume-area"
            onMouseEnter={() => setIsVolumeHovered(true)}
            onMouseLeave={() => setIsVolumeHovered(false)}
          >
            <button
              className="ytp-button ytp-mute-button"
              onClick={onMute}
              title={isMuted ? 'Unmute (m)' : 'Mute (m)'}
            >
              {isMuted || volume === 0 ? (
                <VolumeMutedIcon />
              ) : volume < 0.5 ? (
                <VolumeLowIcon />
              ) : (
                <VolumeHighIcon />
              )}
            </button>
            <div className={`ytp-volume-panel ${isVolumeHovered ? 'ytp-volume-slider-active' : ''}`}>
              <div
                className="ytp-volume-slider"
                onMouseDown={onVolumeMouseDown}
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
          <SettingsMenu
            show={showSettings}
            menu={settingsMenu}
            playbackSpeed={playbackSpeed}
            quality={quality}
            onSpeedChange={onSpeedChange}
            onQualityChange={onQualityChange}
            onMenuChange={onSettingsMenuChange}
            settingsRef={settingsRef}
            onToggle={onSettingsToggle}
          />

          <button className="ytp-button ytp-fullscreen-button" onClick={onFullscreen} title={isFullscreen ? 'Exit full screen (f)' : 'Full screen (f)'}>
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Controls;
