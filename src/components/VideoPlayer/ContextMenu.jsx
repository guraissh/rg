function ContextMenu({ show, x, y, isLooping, onToggleLoop, onCopyUrl, onCopyUrlAtTime }) {
  if (!show) return null;

  return (
    <div
      className="ytp-context-menu"
      style={{ left: x, top: y }}
    >
      <div className="ytp-context-menu-item" onClick={onToggleLoop}>
        <span className="ytp-context-menu-icon">{isLooping ? '✓' : ''}</span>
        <span>Loop</span>
      </div>
      <div className="ytp-context-menu-item" onClick={onCopyUrl}>
        <span className="ytp-context-menu-icon"></span>
        <span>Copy video URL</span>
      </div>
      <div className="ytp-context-menu-item" onClick={onCopyUrlAtTime}>
        <span className="ytp-context-menu-icon"></span>
        <span>Copy video URL at current time</span>
      </div>
      <div className="ytp-context-menu-separator" />
      <div className="ytp-context-menu-item ytp-context-menu-stats">
        <span className="ytp-context-menu-icon"></span>
        <span>Stats for nerds</span>
      </div>
    </div>
  );
}

export default ContextMenu;
