import { useState } from 'react';
import { useAuth } from '../AuthContext';

function LoginModal({ onClose }) {
  const [refreshToken, setRefreshToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!refreshToken.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      await login(refreshToken.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to authenticate. Please check your refresh token.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content login-modal">
        <div className="modal-header">
          <h2>Sign In</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="refreshToken">Refresh Token</label>
            <input
              id="refreshToken"
              type="text"
              className="form-input"
              placeholder="Paste your refresh token here"
              value={refreshToken}
              onChange={(e) => setRefreshToken(e.target.value)}
              autoFocus
              disabled={isLoading}
            />
            <p className="form-hint">
              Open DevTools on redgifs.com → Application → Cookies → copy <code style={{ background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: '4px' }}>refresh_token</code>
            </p>
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!refreshToken.trim() || isLoading}>
              {isLoading ? (
                <>
                  <span style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginModal;
