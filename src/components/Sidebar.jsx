import { useAuth } from '../AuthContext';

function Sidebar({ currentView, onViewChange, isOpen = true, isCollapsed = false }) {
  const { isAuthenticated } = useAuth();

  const mainLinks = [
    { id: 'search', label: 'Home', icon: '🏠' },
    { id: 'for-you', label: 'For You', icon: '🔥', requiresAuth: true },
  ];

  const libraryLinks = [
    { id: 'following-feed', label: 'Following', icon: '▶️' },
    { id: 'liked', label: 'Liked', icon: '👍' },
    { id: 'collections', label: 'Collections', icon: '📁' },
  ];

  const exploreLinks = [
    { id: 'following', label: 'Subscriptions', icon: '📺' },
    { id: 'niches', label: 'Categories', icon: '🎯' },
  ];

  const renderLink = (link) => {
    if (link.requiresAuth && !isAuthenticated) return null;

    return (
      <button
        key={link.id}
        className={`sidebar-link ${currentView === link.id ? 'active' : ''}`}
        onClick={() => onViewChange(link.id)}
        title={isCollapsed ? link.label : undefined}
      >
        <span className="sidebar-icon">{link.icon}</span>
        {!isCollapsed && <span className="sidebar-label">{link.label}</span>}
      </button>
    );
  };

  return (
    <nav className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-section">
        {mainLinks.map(renderLink)}
      </div>

      {isAuthenticated && (
        <>
          <div className="sidebar-divider" />
          <div className="sidebar-section">
            {!isCollapsed && <div className="sidebar-section-title">You</div>}
            {libraryLinks.map(renderLink)}
          </div>

          <div className="sidebar-divider" />
          <div className="sidebar-section">
            {!isCollapsed && <div className="sidebar-section-title">Explore</div>}
            {exploreLinks.map(renderLink)}
          </div>
        </>
      )}
    </nav>
  );
}

export default Sidebar;
