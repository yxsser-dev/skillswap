import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import Avatar from './Avatar';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  return (
    <nav className="navbar">
      <NavLink to="/" className="brand" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', textDecoration: 'none' }}>
        <Logo size={30} />
        <span className="gradient-text" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>
          SkillSwap
        </span>
      </NavLink>
      <div className="nav-links">
        <NavLink to="/" className={linkClass} end>Listings</NavLink>
        {user && <NavLink to="/matches" className={linkClass}>Skill Matches</NavLink>}
        {user && <NavLink to="/bookings" className={linkClass}>My Bookings</NavLink>}
        {user && user.role === 'admin' && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}

        {user ? (
          <>
            <NavLink to="/profile" style={{ display: 'flex', alignItems: 'center', marginLeft: 'var(--space-3)' }} title="My Profile">
              <Avatar username={user.username} src={user.profile_picture_url} size="sm" />
            </NavLink>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'var(--space-2)' }} onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <button className="btn btn-primary btn-sm" style={{ marginLeft: 'var(--space-3)' }} onClick={() => navigate('/login')}>
            Login / Register
          </button>
        )}
      </div>
    </nav>
  );
}
