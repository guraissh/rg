import { useMyNiches } from '../hooks';
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

function NicheCard({ niche }) {
  return (
    <div className="niche-card">
      <div className="niche-thumbnail">
        {niche.thumbnail ? (
          <img src={proxyMediaUrl(niche.thumbnail)} alt={niche.name} loading="lazy" />
        ) : (
          <div className="niche-placeholder">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" style={{ opacity: 0.4 }}>
              <path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z"/>
            </svg>
          </div>
        )}
      </div>
      <div className="niche-info">
        <div className="niche-name">{niche.name}</div>
        <div className="niche-stats">
          {formatNumber(niche.gifs)} videos · {formatNumber(niche.subscribers)} subscribers
        </div>
        {niche.tags && niche.tags.length > 0 && (
          <div className="niche-tags">
            {niche.tags.slice(0, 4).map(tag => (
              <span key={tag} className="niche-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NichesList() {
  const { data, isLoading, error } = useMyNiches();

  const niches = data?.niches || [];
  const total = data?.total || niches.length;

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Loading categories...</p>
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

  if (niches.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" style={{ opacity: 0.4 }}>
            <path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>No Categories</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Follow categories on RedGifs to see them here.</p>
      </div>
    );
  }

  return (
    <div className="niches-list">
      <div className="list-header">
        <h2>Categories</h2>
        <span className="list-count">{formatNumber(total)} categories</span>
      </div>

      <div className="niches-grid">
        {niches.map(niche => (
          <NicheCard key={niche.id} niche={niche} />
        ))}
      </div>
    </div>
  );
}

export default NichesList;
