import { useAuth } from '../AuthContext';

const icons = {
  home: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M4 21V9l8-6 8 6v12h-6v-7h-4v7H4z"/>
    </svg>
  ),
  fire: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M12 23c-3.866 0-7-2.686-7-6 0-1.887.85-3.88 2.417-5.652.903-1.021 1.945-1.898 2.947-2.629.337-.246.663-.474.972-.682-.123.764-.186 1.456-.186 2.01 0 1.214.405 2.193.937 2.86.531.666 1.106 1.033 1.374 1.227l.539.394.539-.394c.268-.194.843-.561 1.374-1.227.532-.667.937-1.646.937-2.86 0-.554-.063-1.246-.186-2.01.309.208.635.436.972.682 1.002.731 2.044 1.608 2.947 2.629C18.15 13.12 19 15.113 19 17c0 3.314-3.134 6-7 6zm0-16c0-1-.5-3-3-5 0 0 1 3 1 4.5S8 10 8 10s3-.5 4 1.5c0 0 0-2 0-4.5z"/>
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
    </svg>
  ),
  like: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
    </svg>
  ),
  folder: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
    </svg>
  ),
  subscriptions: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/>
    </svg>
  ),
  category: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z"/>
    </svg>
  ),
};

// Map view IDs to URL paths
const viewToPath = {
  'search': '/',
  'for-you': '/for-you',
  'following-feed': '/following',
  'liked': '/liked',
  'collections': '/collections',
  'following': '/subscriptions',
  'niches': '/categories',
};

function Sidebar({ currentView, onViewChange, isOpen = true, isCollapsed = false }) {
  const { isAuthenticated } = useAuth();

  const mainLinks = [
    { id: 'search', label: 'Home', icon: icons.home },
    { id: 'for-you', label: 'For You', icon: icons.fire, requiresAuth: true },
  ];

  const libraryLinks = [
    { id: 'following-feed', label: 'Following', icon: icons.play },
    { id: 'liked', label: 'Liked', icon: icons.like },
    { id: 'collections', label: 'Collections', icon: icons.folder },
  ];

  const exploreLinks = [
    { id: 'following', label: 'Subscriptions', icon: icons.subscriptions },
    { id: 'niches', label: 'Categories', icon: icons.category },
  ];

  const handleClick = (e, linkId) => {
    e.preventDefault();
    onViewChange(linkId);
  };

  const renderLink = (link) => {
    if (link.requiresAuth && !isAuthenticated) return null;

    const href = viewToPath[link.id] || '/';

    return (
      <a
        key={link.id}
        href={href}
        className={`sidebar-link ${currentView === link.id ? 'active' : ''}`}
        onClick={(e) => handleClick(e, link.id)}
        title={isCollapsed ? link.label : undefined}
      >
        <span className="sidebar-icon">{link.icon}</span>
        {!isCollapsed && <span className="sidebar-label">{link.label}</span>}
      </a>
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
