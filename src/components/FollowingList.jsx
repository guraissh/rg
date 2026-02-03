import { useState } from 'react';
import { useMyFollowing } from '../hooks';
import { proxyMediaUrl } from '../api';

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num?.toString() || '0';
}

function CreatorCard({ creator, onSelect }) {
  return (
    <div className="creator-card" onClick={() => onSelect(creator.username)}>
      <div className="creator-avatar">
        {creator.profileImageUrl ? (
          <img src={proxyMediaUrl(creator.profileImageUrl)} alt={creator.username} />
        ) : (
          creator.username?.[0]?.toUpperCase() || '?'
        )}
      </div>
      <div className="creator-info">
        <div className="creator-name">
          {creator.name || creator.username}
          {creator.verified && (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ color: 'var(--accent-blue)', marginLeft: '6px', verticalAlign: 'middle' }}>
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          )}
        </div>
        <div className="creator-username">@{creator.username}</div>
        <div className="creator-stats">
          {formatNumber(creator.followers)} followers · {formatNumber(creator.publishedGifs || creator.gifs)} videos
        </div>
      </div>
    </div>
  );
}

function FollowingList({ onCreatorSelect }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error } = useMyFollowing({ page, count: 40 });

  const creators = data?.items || [];
  const totalPages = data?.pages || 0;
  const total = data?.total || 0;

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Loading subscriptions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <p>Error: {error.message}</p>
      </div>
    );
  }

  if (creators.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" style={{ opacity: 0.4 }}>
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>No Subscriptions</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Follow creators on RedGifs to see them here.</p>
      </div>
    );
  }

  return (
    <div className="following-list">
      <div className="list-header">
        <h2>Subscriptions</h2>
        <span className="list-count">{formatNumber(total)} creators</span>
      </div>

      <div className="creators-grid" style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 0.2s ease-out' }}>
        {creators.map(creator => (
          <CreatorCard
            key={creator.username}
            creator={creator}
            onSelect={onCreatorSelect}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1 || isFetching}
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages || isFetching}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default FollowingList;
