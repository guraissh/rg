import { ViewsIcon, LikeIcon, AudioIcon, KeyboardIcon } from './Icons';
import { formatNumber } from './utils';

function Footer({ video, isMobile, styles }) {
  return (
    <div style={styles.footer}>
      <div style={styles.statsRow}>
        <div style={styles.stats}>
          <div style={styles.statItem}>
            <ViewsIcon />
            <span>{formatNumber(video.views)} views</span>
          </div>
          <div style={styles.statItem}>
            <LikeIcon />
            <span>{formatNumber(video.likes)} likes</span>
          </div>
          {video.hasAudio && (
            <div style={styles.statItem}>
              <AudioIcon />
              <span>Audio</span>
            </div>
          )}
        </div>
        {isMobile ? (
          <div style={styles.shortcuts}>
            <span style={{ opacity: 0.7 }}>Swipe to navigate</span>
          </div>
        ) : (
          <div style={styles.shortcuts}>
            <KeyboardIcon />
            <span style={styles.shortcutKey}>A</span>
            <span style={styles.shortcutKey}>D</span>
            <span style={{ margin: '0 4px' }}>navigate</span>
            <span style={styles.shortcutKey}>J</span>
            <span style={styles.shortcutKey}>L</span>
            <span style={{ margin: '0 4px' }}>seek</span>
            <span style={styles.shortcutKey}>F</span>
            <span>fullscreen</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Footer;
