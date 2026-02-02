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
          <h2>Login with Refresh Token</h2>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="refreshToken">Refresh Token</label>
            <input
              id="refreshToken"
              type="text"
              className="form-input"
              placeholder="Enter your RedGifs refresh token"
              value={refreshToken}
              onChange={(e) => setRefreshToken(e.target.value)}
              autoFocus
              disabled={isLoading}
            />
            <p className="form-hint">
              Open DevTools on redgifs.com, go to Application &gt; Cookies, and copy the <code>refresh_token</code> value.
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
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginModal;
