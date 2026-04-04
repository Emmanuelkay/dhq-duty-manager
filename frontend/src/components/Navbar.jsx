import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    if (!user) return null;

    const links = [
        { path: '/', label: 'DASHBOARD' },
        { path: '/passes', label: 'PASSES' },
        { path: '/leaves', label: 'LEAVES' },
        { path: '/admin', label: 'ADMIN' }
    ];

    const activeIndex = links.findIndex(l => l.path === location.pathname);

    return (
        <nav className="navbar animate-fade-in" style={{ 
            height: '52px', 
            background: 'var(--color-bg-base)', 
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            padding: '0 var(--spacing-lg)',
            justifyContent: 'space-between',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
        }}>
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.2s var(--transition-fast) both; }
                
                .nav-item { 
                    position: relative; 
                    padding: 0 var(--spacing-md); 
                    height: 100%; 
                    display: flex; 
                    align-items: center; 
                    text-decoration: none; 
                    font-size: 0.85rem; 
                    font-weight: 400; 
                    color: rgba(255,255,255,0.5);
                    transition: color var(--transition-fast);
                }
                .nav-item:hover { color: white; }
                .nav-item.active { color: white; font-weight: 500; }
                
                .nav-indicator {
                    position: absolute;
                    bottom: 0;
                    height: 2px;
                    background: var(--color-accent);
                    transition: transform var(--transition-slow);
                    box-shadow: 0 0 10px var(--color-accent);
                }
                
                .btn-term {
                    color: var(--color-danger) !important;
                    background: rgba(255, 69, 58, 0.12) !important;
                    border: none !important;
                    border-radius: 6px !important;
                    padding: 4px 12px !important;
                    font-size: 0.75rem !important;
                    font-weight: 600 !important;
                    transition: background var(--transition-fast) !important;
                }
                .btn-term:hover {
                    background: rgba(255, 69, 58, 0.2) !important;
                }
            `}</style>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <span style={{ fontWeight: '600', fontSize: '1rem', color: 'white' }}>DHQ CSOC</span>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', fontWeight: '500' }}>PERSONNEL</span>
                </div>
                
                <div style={{ display: 'flex', marginLeft: 'var(--spacing-md)', height: '52px', position: 'relative' }}>
                    {links.map((link) => (
                        <Link 
                            key={link.path}
                            to={link.path} 
                            className={`nav-item ${location.pathname === link.path ? 'active' : ''}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    {activeIndex !== -1 && (
                        <div className="nav-indicator" style={{ 
                            width: '40px', 
                            left: 'calc(var(--spacing-md) + 16px)', // Adjusted for padding
                            transform: `translateX(${activeIndex * 96}px)` // Adjusted for new spacing
                        }}></div>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                {user && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-separator)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '600', color: 'white' }}>
                            {user.name[0]}
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'white' }}>{user.name}</span>
                    </div>
                )}
                <button 
                    onClick={logout}
                    className="btn-term"
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px'
                    }}
                >
                    <LogOut size={12} />
                    TERM
                </button>
            </div>
        </nav>
    );
}
