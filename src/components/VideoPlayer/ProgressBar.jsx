import { formatTime } from './utils';

function ProgressBar({
  progress,
  bufferedProgress,
  duration,
  hoverTime,
  hoverPosition,
  isSeeking,
  progressRef,
  onMouseMove,
  onMouseLeave,
  onMouseDown,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}) {
  return (
    <div
      ref={progressRef}
      className={`ytp-progress-bar-container ${isSeeking ? 'ytp-dragging' : ''}`}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
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
  );
}

export default ProgressBar;
