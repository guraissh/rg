import { useAuth } from '../AuthContext';

function Sidebar({ currentView, onViewChange, isOpen = true }) {
  const { isAuthenticated } = useAuth();

  const publicLinks = [
    { id: 'search', label: 'Search Users', icon: '&#128269;' },
  ];

  const authLinks = [
    { id: 'for-you', label: 'For You', icon: '&#9733;' },
    { id: 'following-feed', label: 'Following Feed', icon: '&#128240;' },
    { id: 'following', label: 'Followed Creators', icon: '&#128101;' },
    { id: 'niches', label: 'My Niches', icon: '&#128218;' },
    { id: 'liked', label: 'Liked', icon: '&#10084;' },
    { id: 'collections', label: 'Collections', icon: '&#128193;' },
  ];

  return (
    <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-section">
        {publicLinks.map(link => (
          <button
            key={link.id}
            className={`sidebar-link ${currentView === link.id ? 'active' : ''}`}
            onClick={() => onViewChange(link.id)}
          >
            <span className="sidebar-icon" dangerouslySetInnerHTML={{ __html: link.icon }} />
            <span className="sidebar-label">{link.label}</span>
          </button>
        ))}
      </div>

      {isAuthenticated && (
        <div className="sidebar-section">
          <div className="sidebar-section-title">My Content</div>
          {authLinks.map(link => (
            <button
              key={link.id}
              className={`sidebar-link ${currentView === link.id ? 'active' : ''}`}
              onClick={() => onViewChange(link.id)}
            >
              <span className="sidebar-icon" dangerouslySetInnerHTML={{ __html: link.icon }} />
              <span className="sidebar-label">{link.label}</span>
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

export default Sidebar;
