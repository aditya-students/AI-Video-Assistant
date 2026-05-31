import { NavLink, useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';

export default function Sidebar() {
  const { title, language, status, reset } = useSession();
  const navigate = useNavigate();

  const handleReset = () => {
    reset();
    navigate('/');
  };

  const navItems = [
    { to: '/', icon: '🔍', label: 'Analyze' },
    { to: '/results', icon: '📊', label: 'Results' },
    { to: '/chat', icon: '💬', label: 'Chat' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-icon">🎬</span>
        <div>
          <h2 className="sidebar-title">AI Video Assistant</h2>
          <p className="sidebar-tagline">Turn any video into insight</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-session clay-card clay-lavender">
        <p className="text-uppercase text-muted" style={{ marginBottom: 8 }}>Current Session</p>
        <p className="sidebar-session-title">
          {title || 'No video loaded'}
        </p>
        <div className="sidebar-badges">
          <span className="clay-badge badge-lavender">
            {language === 'hinglish' ? '🇮🇳 Hinglish' : '🇺🇸 English'}
          </span>
          <span className={`clay-badge ${
            status === 'done' ? 'badge-mint' :
            status === 'error' ? 'badge-red' : 'badge-lavender'
          }`}>
            {status === 'idle' && '⏳ Idle'}
            {status === 'running' && '⚙️ Running'}
            {status === 'done' && '✅ Done'}
            {status === 'error' && '❌ Error'}
          </span>
        </div>
      </div>

      <button className="clay-btn-outline w-full" onClick={handleReset}>
        🔄 Reset session
      </button>

      <p className="sidebar-footer text-muted text-small">
        Built at <strong>Antigravity</strong>
      </p>
    </aside>
  );
}
