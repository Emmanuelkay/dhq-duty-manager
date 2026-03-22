import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { format, addDays, parseISO } from 'date-fns';
import { Shield, Trash2, Printer, CalendarRange, Plus } from 'lucide-react';

export default function Passes() {
    const { user } = useAuth();
    const [passes, setPasses] = useState([]);
    const [users, setUsers] = useState([]);
    const [isAdding, setIsAdding] = useState(false);

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

            toast.success('Pass record synchronized');
            setPassUserId('');
            setPassStartDate('');
            setPassReason('');
            setIsAdding(false);
            fetchPasses();
        } catch (err) {
            toast.error(err.message || 'Synchronization failed');
        }
    };

    const handleRemovePass = async (id) => {
        if (!window.confirm("Purge this pass record?")) return;
        try {
            const res = await fetch(`/api/passes/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to purge record');
            toast.success('Record purged');
            fetchPasses();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="container" style={{ paddingTop: '80px' }}>
            <div className="no-print animate-entry" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-xl)' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pass Register</h1>
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>Electronic log of personnel on 1-week operational pass.</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    {user.role === 'Admin' && (
                        <button onClick={() => setIsAdding(!isAdding)} className="btn btn-primary">
                            <Plus size={16} /> {isAdding ? 'Cancel' : 'New Entry'}
                        </button>
                    )}
                    <button onClick={handlePrint} className="btn btn-ghost">
                        <Printer size={16} /> Print
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                {isAdding && user.role === 'Admin' && (
                    <div className="glass-panel animate-entry no-print">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                            <CalendarRange size={18} color="var(--color-accent)" />
                            <h2 style={{ fontSize: '0.9rem', textTransform: 'uppercase' }}>Create Pass Record</h2>
                        </div>

                        <form onSubmit={handleAddPass} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', alignItems: 'end' }}>
                            <div className="input-group">
                                <label className="label">Personnel</label>
                                <select className="input-field" value={passUserId} onChange={(e) => setPassUserId(e.target.value)} required>
                                    <option value="" style={{ background: 'var(--color-bg-base)' }}>Select User...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id} style={{ background: 'var(--color-bg-base)' }}>{u.rank} {u.name} ({u.service_number})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="label">Start Date</label>
                                <input type="date" className="input-field" value={passStartDate} onChange={(e) => setPassStartDate(e.target.value)} required />
                            </div>
                            <div className="input-group">
                                <label className="label">Notes / Justification</label>
                                <input type="text" className="input-field" value={passReason} onChange={(e) => setPassReason(e.target.value)} placeholder="Reason for pass" />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>Initialize</button>
                        </form>
                    </div>
                )}

                <div className="glass-panel animate-entry" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Personnel Entity</th>
                                    <th>Service ID</th>
                                    <th>Commence</th>
                                    <th>Terminate</th>
                                    <th>Status / Notes</th>
                                    {user.role === 'Admin' && <th className="no-print" style={{ textAlign: 'center' }}>Ops</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {passes.sort((a, b) => b.start_date.localeCompare(a.start_date)).map(p => {
                                    const isExpired = new Date(p.end_date) < new Date();
                                    return (
                                        <tr key={p.id}>
                                            <td style={{ fontWeight: '700', color: 'var(--color-text-main)' }}>{p.user.rank} {p.user.name.toUpperCase()}</td>
                                            <td style={{ fontFamily: 'monospace', color: 'var(--color-accent)' }}>{p.user.service_number}</td>
                                            <td>{format(parseISO(p.start_date), 'dd MMM yyyy').toUpperCase()}</td>
                                            <td style={{ color: isExpired ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: '600' }}>
                                                {format(parseISO(p.end_date), 'dd MMM yyyy').toUpperCase()}
                                            </td>
                                            <td>
                                                <span className={`badge ${isExpired ? 'badge-danger' : 'badge-success'}`}>
                                                    {isExpired ? 'Expired' : 'Active'}
                                                </span>
                                                <span className="text-muted" style={{ marginLeft: '8px', fontSize: '0.75rem' }}>{p.reason}</span>
                                            </td>
                                            {user.role === 'Admin' && (
                                                <td className="no-print" style={{ textAlign: 'center' }}>
                                                    <button onClick={() => handleRemovePass(p.id)} className="btn-ghost" style={{ padding: '6px', border: 'none' }}>
                                                        <Trash2 size={14} color="var(--color-danger)" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                                {passes.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                            No active pass records in database.
                                        </td>
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
