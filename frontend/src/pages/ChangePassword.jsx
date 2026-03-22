import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ChangePassword() {
    const { changePassword } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("Credentials mismatch");
            return;
        }

        if (newPassword === 'Changeme!') {
            toast.error("Default security token prohibited");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Token must be at least 6 characters");
            return;
        }

        setLoading(true);
        const res = await changePassword(newPassword);
        setLoading(false);

        if (!res.success) {
            toast.error(res.error || "Security update failed");
        } else {
            toast.success("Security Credentials Updated");
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 'var(--spacing-md)' }}>
            <div className="glass-panel animate-entry" style={{ width: '100%', maxWidth: '400px', padding: 'var(--spacing-xl)', textAlign: 'center' }}>
                <header style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <div style={{ display: 'inline-flex', padding: '12px', background: 'var(--color-bg-base)', borderRadius: 'var(--radius-sharp)', border: '1px solid var(--color-warning)', marginBottom: 'var(--spacing-md)' }}>
                        <ShieldAlert size={40} color="var(--color-warning)" style={{ filter: 'drop-shadow(0 0 10px var(--color-warning))', opacity: 0.8 }} />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', color: 'var(--color-warning)' }}>
                        Security Protocol
                    </h1>
                    <p className="text-muted" style={{ fontSize: '0.8rem' }}>Default credentials detected. Mandatory update required.</p>
                </header>

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    <div className="input-group">
                        <label className="label">New Security Token</label>
                        <input
                            type="password"
                            className="input-field"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <label className="label">Confirm Token</label>
                        <input
                            type="password"
                            className="input-field"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px', background: 'var(--color-warning)', color: '#000', boxShadow: '0 0 15px var(--color-warning)' }} disabled={loading}>
                        {loading ? 'Securing...' : 'Establish Secure Access'}
                    </button>
                </form>

                <footer style={{ marginTop: 'var(--spacing-xl)', opacity: 0.4 }}>
                    <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        DHQ Network Security Directive 4-1
                    </p>
                </footer>
            </div>
        </div>
    );
}
