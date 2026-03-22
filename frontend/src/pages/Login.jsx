import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Login() {
    const { user, login } = useAuth();
    const [serviceNumber, setServiceNumber] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    if (user) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const res = await login(serviceNumber, password);
        setLoading(false);
        if (!res.success) {
            toast.error(res.error || "Authentication failed");
        } else {
            toast.success("Terminal Access Granted");
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 'var(--spacing-md)' }}>
            <div className="glass-panel animate-entry" style={{ width: '100%', maxWidth: '400px', padding: 'var(--spacing-xl)', textAlign: 'center' }}>
                <header style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <div style={{ display: 'inline-flex', padding: '12px', background: 'var(--color-bg-base)', borderRadius: 'var(--radius-sharp)', border: '1px solid var(--color-accent-20)', marginBottom: 'var(--spacing-md)' }}>
                        <Shield size={40} color="var(--color-accent)" style={{ filter: 'drop-shadow(0 0 10px var(--color-accent-glow))' }} />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                        CSOC Node
                    </h1>
                    <p className="text-muted" style={{ fontSize: '0.8rem' }}>Personnel Deployment & Duty Management</p>
                </header>

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    <div className="input-group">
                        <label className="label">Service Identifier</label>
                        <input
                            type="text"
                            className="input-field"
                            value={serviceNumber}
                            onChange={(e) => setServiceNumber(e.target.value)}
                            placeholder="Enter Service ID"
                            required
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <label className="label">Security Token</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px' }} disabled={loading}>
                        {loading ? 'Authenticating...' : 'Establish Connection'}
                    </button>
                </form>

                <footer style={{ marginTop: 'var(--spacing-xl)', opacity: 0.4 }}>
                    <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Restricted Access System &copy; {new Date().getFullYear()} DHQ
                    </p>
                </footer>
            </div>
        </div>
    );
}
