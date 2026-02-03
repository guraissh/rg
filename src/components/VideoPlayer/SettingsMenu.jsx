import { SettingsIcon, BackIcon } from './Icons';

const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function SettingsMenu({
  show,
  menu,
  playbackSpeed,
  quality,
  onSpeedChange,
  onQualityChange,
  onMenuChange,
  settingsRef,
  onToggle,
}) {
  return (
    <div className="ytp-settings-menu-container" ref={settingsRef}>
      <button
        className={`ytp-button ytp-settings-button ${show ? 'ytp-settings-open' : ''}`}
        onClick={onToggle}
        title="Settings"
      >
        <SettingsIcon />
      </button>

      {show && (
        <div className="ytp-settings-menu">
          {menu === 'main' && (
            <>
              <div className="ytp-settings-menu-item" onClick={() => onMenuChange('speed')}>
                <span className="ytp-settings-menu-label">Playback speed</span>
                <span className="ytp-settings-menu-value">{playbackSpeed === 1 ? 'Normal' : playbackSpeed + 'x'}</span>
              </div>
              <div className="ytp-settings-menu-item" onClick={() => onMenuChange('quality')}>
                <span className="ytp-settings-menu-label">Quality</span>
                <span className="ytp-settings-menu-value">{quality === 'hd' ? 'HD' : 'SD'}</span>
              </div>
            </>
          )}
          {menu === 'speed' && (
            <>
              <div className="ytp-settings-menu-header" onClick={() => onMenuChange('main')}>
                <BackIcon />
                <span>Playback speed</span>
              </div>
              {speedOptions.map(speed => (
                <div
                  key={speed}
                  className={`ytp-settings-menu-item ${playbackSpeed === speed ? 'ytp-settings-menu-item-selected' : ''}`}
                  onClick={() => onSpeedChange(speed)}
                >
                  <span className="ytp-settings-menu-check">{playbackSpeed === speed ? '✓' : ''}</span>
                  <span>{speed === 1 ? 'Normal' : speed}</span>
                </div>
              ))}
            </>
          )}
          {menu === 'quality' && (
            <>
              <div className="ytp-settings-menu-header" onClick={() => onMenuChange('main')}>
                <BackIcon />
                <span>Quality</span>
              </div>
              <div
                className={`ytp-settings-menu-item ${quality === 'hd' ? 'ytp-settings-menu-item-selected' : ''}`}
                onClick={() => onQualityChange('hd')}
              >
                <span className="ytp-settings-menu-check">{quality === 'hd' ? '✓' : ''}</span>
                <span>HD</span>
              </div>
              <div
                className={`ytp-settings-menu-item ${quality === 'sd' ? 'ytp-settings-menu-item-selected' : ''}`}
                onClick={() => onQualityChange('sd')}
              >
                <span className="ytp-settings-menu-check">{quality === 'sd' ? '✓' : ''}</span>
                <span>SD</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default SettingsMenu;
