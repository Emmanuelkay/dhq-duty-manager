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
            toast.error("Passwords do not match");
            return;
        }

        if (newPassword === 'Changeme!') {
            toast.error("You cannot use the default password");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        const res = await changePassword(newPassword);
        setLoading(false);

        if (!res.success) {
            toast.error(res.error || "Failed to change password");
        } else {
            toast.success("Password secured successfully!");
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', position: 'relative', zIndex: 10 }}>
            <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '3rem', margin: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <ShieldAlert size={64} color="var(--warning)" style={{ filter: 'drop-shadow(0 0 15px rgba(245, 158, 11, 0.5))' }} />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: '600', letterSpacing: '-0.02em', color: 'var(--warning)' }}>Action Required</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>For your security, you must change the default password before accessing the dashboard.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group animate-fade-in animate-delay-1">
                        <label>New Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="input-group animate-fade-in animate-delay-2" style={{ marginBottom: '2rem' }}>
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary animate-fade-in animate-delay-3" style={{ width: '100%', padding: '0.8rem', background: 'linear-gradient(135deg, var(--warning) 0%, #fbbf24 100%)', boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)' }} disabled={loading}>
                        {loading ? 'Updating...' : 'Secure Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}
