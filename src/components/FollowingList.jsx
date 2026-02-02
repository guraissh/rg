import { useState } from 'react';
import { useMyFollowing } from '../hooks';

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
          <img src={creator.profileImageUrl} alt={creator.username} />
        ) : (
          creator.username?.[0]?.toUpperCase() || '?'
        )}
      </div>
      <div className="creator-info">
        <div className="creator-name">
          {creator.name || creator.username}
          {creator.verified && <span className="verified-badge"> &#10003;</span>}
        </div>
        <div className="creator-username">@{creator.username}</div>
        <div className="creator-stats">
          <span>{formatNumber(creator.followers)} followers</span>
          <span>{formatNumber(creator.publishedGifs || creator.gifs)} videos</span>
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
        <p>Loading followed creators...</p>
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
        <p>You're not following any creators yet.</p>
      </div>
    );
  }

  return (
    <div className="following-list">
      <div className="list-header">
        <h2>Followed Creators</h2>
        <span className="list-count">{total} creators</span>
      </div>

      <div className="creators-grid" style={{ opacity: isFetching ? 0.7 : 1 }}>
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
            &larr; Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages || isFetching}
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
}

export default FollowingList;
