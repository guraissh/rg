import { CloseIcon } from './Icons';

function Header({ video, currentIndex, totalVideos, onClose, styles }) {
  return (
    <div style={styles.header}>
      <div style={styles.headerLeft}>
        <button
          style={styles.closeBtn}
          onClick={onClose}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          title="Close (Esc)"
        >
          <CloseIcon />
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
  );
}

export default Header;
