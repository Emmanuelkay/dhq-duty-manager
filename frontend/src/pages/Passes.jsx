import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { format, addDays, parseISO } from 'date-fns';
import { Shield, Trash2, Printer, CalendarRange } from 'lucide-react';

export default function Passes() {
    const { user } = useAuth();
    const [passes, setPasses] = useState([]);
    const [users, setUsers] = useState([]);

    // Form state
    const [passUserId, setPassUserId] = useState('');
    const [passStartDate, setPassStartDate] = useState('');
    const [passReason, setPassReason] = useState('');

    useEffect(() => {
        fetchPasses();
        if (user.role === 'Admin') {
            fetchUsers();
        }
    }, [user.role]);

    const fetchPasses = async () => {
        try {
            const res = await fetch('/api/passes/');
            if (res.ok) setPasses(await res.json());
        } catch (err) { console.error('Failed to load passes', err); }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users/');
            if (res.ok) setUsers(await res.json());
        } catch (err) { console.error('Failed to load users', err); }
    };

    const handleAddPass = async (e) => {
        e.preventDefault();
        try {
            const startDate = parseISO(passStartDate);
            // Pass runs Monday to Friday (4 days after start)
            const endDate = addDays(startDate, 4);

            const payload = {
                user_id: passUserId,
                start_date: format(startDate, 'yyyy-MM-dd'),
                end_date: format(endDate, 'yyyy-MM-dd'),
                reason: passReason
            };

            const res = await fetch('/api/passes/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success('Pass record added');
            setPassUserId('');
            setPassStartDate('');
            setPassReason('');
            fetchPasses();
        } catch (err) {
            toast.error(err.message || 'Failed to add pass');
        }
    };

    const handleRemovePass = async (id) => {
        if (!window.confirm("Remove this pass record?")) return;
        try {
            const res = await fetch(`/api/passes/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to remove pass');
            toast.success('Pass removed');
            fetchPasses();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="container print-container">
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', paddingTop: '1rem' }}>
                <div>
                    <h1 style={{ margin: 0 }}>Pass Register</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Log of personnel on 1-week pass.</p>
                </div>
                <button onClick={handlePrint} className="btn btn-outline">
                    <Printer size={16} /> Print Record
                </button>
            </div>

            <div className="print-only" style={{ display: 'none', marginBottom: '2rem', textAlign: 'center' }}>
                <h2>DHQ CSOC - Pass Record</h2>
                <p>Generated on: {format(new Date(), 'PPp')}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                {user.role === 'Admin' && (
                    <div className="glass-panel animate-fade-in no-print" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                            <CalendarRange size={20} color="var(--primary)" />
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Record New Pass</h2>
                        </div>

                        <form onSubmit={handleAddPass} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 200px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase' }}>Personnel</label>
                                <select className="input-field" value={passUserId} onChange={(e) => setPassUserId(e.target.value)} required>
                                    <option value="" style={{ color: '#000' }}>Select Personnel...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id} style={{ color: '#000' }}>{u.rank} {u.name} ({u.service_number})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ flex: '1 1 150px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase' }}>Start Date</label>
                                <input type="date" className="input-field" value={passStartDate} onChange={(e) => setPassStartDate(e.target.value)} required />
                            </div>
                            <div style={{ flex: '2 1 200px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase' }}>Reason / Notes (Optional)</label>
                                <input type="text" className="input-field" value={passReason} onChange={(e) => setPassReason(e.target.value)} placeholder="e.g. Compassionate" />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 1.5rem' }}>Record Pass</button>
                        </form>
                    </div>
                )}

                <div className="glass-panel animate-fade-in animate-delay-1 print-unstyle" style={{ padding: '2rem' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Personnel Name</th>
                                    <th>Service #</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Notes</th>
                                    {user.role === 'Admin' && <th className="no-print" style={{ textAlign: 'right' }}>Controls</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {passes.sort((a, b) => b.start_date.localeCompare(a.start_date)).map(p => (
                                    <tr key={p.id}>
                                        <td style={{ fontWeight: '600' }}>{p.user.rank} {p.user.name}</td>
                                        <td>{p.user.service_number}</td>
                                        <td>{format(parseISO(p.start_date), 'MMM d, yyyy')}</td>
                                        <td style={{ color: 'var(--accent)', fontWeight: '500' }}>{format(parseISO(p.end_date), 'MMM d, yyyy')}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{p.reason || '-'}</td>
                                        {user.role === 'Admin' && (
                                            <td className="no-print" style={{ textAlign: 'right' }}>
                                                <button onClick={() => handleRemovePass(p.id)} className="btn btn-danger" style={{ padding: '0.3rem 0.8rem', fontSize: '12px' }}>
                                                    <Trash2 size={12} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {passes.length === 0 && (
                                    <tr>
                                        <td colSpan={user.role === 'Admin' ? 6 : 5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No pass records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
