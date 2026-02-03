import { useState, useEffect } from 'react';
import { proxyMediaUrl, followUser, unfollowUser, getMyFollowing } from '../api';
import { useAuth } from '../AuthContext';

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num?.toString() || '0';
}

function FollowButton({ username }) {
  const [isFollowing, setIsFollowing] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function checkFollowing() {
      try {
        const data = await getMyFollowing({ page: 1, count: 1000 });
        const following = data.items?.some(u => u.username === username) || false;
        if (!cancelled) setIsFollowing(following);
      } catch (err) {
        if (!cancelled) setIsFollowing(false);
      }
    }
    checkFollowing();
    return () => { cancelled = true; };
  }, [username]);

  const handleFollowToggle = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(username);
        setIsFollowing(false);
      } else {
        await followUser(username);
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Failed to update follow status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFollowing === null) {
    return <button className="follow-btn" disabled>...</button>;
  }

  return (
    <button
      onClick={handleFollowToggle}
      disabled={isLoading}
      className={`follow-btn ${isFollowing ? 'following' : ''}`}
    >
      {isLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}

function UserProfile({ user }) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="user-profile">
      <div className="user-avatar">
        {user.profileImageUrl ? (
          <img src={proxyMediaUrl(user.profileImageUrl)} alt={user.username} />
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
          {isAuthenticated && (
            <FollowButton key={user.username} username={user.username} />
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
