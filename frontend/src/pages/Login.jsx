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
            toast.error(res.error || "Login failed");
        } else {
            toast.success("Welcome back!");
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', position: 'relative', zIndex: 10 }}>
            <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '3rem', margin: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <img src="/dhq-logo.jpg" alt="DHQ Logo" style={{ height: '64px', borderRadius: '12px', margin: '0 auto 1.5rem', display: 'block' }} />
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: '600', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>Duty Manager</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Sign in to manage the operational roster.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group animate-fade-in animate-delay-1">
                        <label>Service Number</label>
                        <input
                            type="text"
                            className="input-field"
                            value={serviceNumber}
                            onChange={(e) => setServiceNumber(e.target.value)}
                            placeholder="e.g. admin"
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <Shield size={48} color="var(--primary)" style={{ filter: 'drop-shadow(0 0 15px var(--primary-glow))' }} />
                    </div>

                    <div className="input-group animate-fade-in animate-delay-2" style={{ marginBottom: '2rem' }}>
                        <label>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary animate-fade-in animate-delay-3" style={{ width: '100%', padding: '0.8rem' }} disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
