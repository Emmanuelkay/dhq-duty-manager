import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, CalendarCheck, Users, Shield } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    if (!user) return null;

    return (
        <nav className="navbar" style={{ borderBottom: '1px solid var(--border-light)' }}>
            <div className="nav-links">
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none', color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '12px', boxShadow: '0 0 15px var(--primary-glow)' }}>
                            <Shield size={24} color="var(--primary)" />
                        </div>
                        <span style={{ fontWeight: '700', fontSize: '1.2rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>DHQ CSOC DUTY MANAGER</span>
                    </div></Link>
            </div>

            <div className="nav-links">
                <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                    Dashboard
                </Link>
                <Link to="/passes" className={`nav-link ${location.pathname === '/passes' ? 'active' : ''}`}>
                    Passes
                </Link>
                <Link to="/leaves" className={`nav-link ${location.pathname === '/leaves' ? 'active' : ''}`}>
                    Leaves
                </Link>
                {user?.role === 'Admin' && (
                    <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
                        Admin
                    </Link>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '980px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, #818cf8 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', boxShadow: '0 0 10px var(--primary-glow)' }}>
                        {user.name.charAt(0)}
                    </div>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>{user.name.split(' ')[0]}</span>
                </div>
                <div style={{ width: '1px', height: '16px', background: 'var(--border-light)' }}></div>

                <button onClick={logout} className="btn-outline" style={{ padding: '0.4rem 0.8rem', borderRadius: '980px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--border-light)', background: 'transparent', cursor: 'pointer' }}>
                    <LogOut size={14} />
                    Sign Out
                </button>
            </div>
        </nav>
    );
}
