import { useMyNiches } from '../hooks';

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
          <img src={niche.thumbnail} alt={niche.name} loading="lazy" />
        ) : (
          <div className="niche-placeholder">{niche.name?.[0]?.toUpperCase() || '?'}</div>
        )}
      </div>
      <div className="niche-info">
        <div className="niche-name">{niche.name}</div>
        <div className="niche-stats">
          <span>{formatNumber(niche.gifs)} videos</span>
          <span>{formatNumber(niche.subscribers)} subscribers</span>
        </div>
        {niche.tags && niche.tags.length > 0 && (
          <div className="niche-tags">
            {niche.tags.slice(0, 5).map(tag => (
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
        <p>Loading your niches...</p>
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
        <p>You haven't followed any niches yet.</p>
      </div>
    );
  }

  return (
    <div className="niches-list">
      <div className="list-header">
        <h2>My Niches</h2>
        <span className="list-count">{total} niches</span>
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
