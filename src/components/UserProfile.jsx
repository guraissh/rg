function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num?.toString() || '0';
}

function UserProfile({ user }) {
  return (
    <div className="user-profile">
      <div className="user-avatar">
        {user.profileImageUrl ? (
          <img src={user.profileImageUrl} alt={user.username} />
        ) : (
          user.username?.[0]?.toUpperCase() || '?'
        )}
      </div>
      <div className="user-info">
        <h1>
          @{user.username}
          {user.verified && (
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="currentColor"
              style={{
                color: 'var(--accent-blue)',
                marginLeft: '8px',
                verticalAlign: 'middle'
              }}
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          )}
        </h1>
        <div className="user-stats">
          <span>{formatNumber(user.followers || 0)} followers</span>
          <span>{formatNumber(user.publishedGifs || user.gifs || 0)} videos</span>
          <span>{formatNumber(user.views || 0)} views</span>
          <span>{formatNumber(user.likes || 0)} likes</span>
        </div>
        {user.description && (
          <p style={{
            marginTop: '12px',
            color: 'var(--text-secondary)',
            fontSize: '14px',
            lineHeight: '1.5',
            maxWidth: '600px'
          }}>
            {user.description}
          </p>
        )}
      </div>
    </div>
  );
}

export default UserProfile;
