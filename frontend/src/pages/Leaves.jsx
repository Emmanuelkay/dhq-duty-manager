import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { CalendarDays, Trash2, Printer } from 'lucide-react';

export default function Leaves() {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [users, setUsers] = useState([]);

    // Filter state
    const currentMonth = format(new Date(), 'yyyy-MM');
    const [filterMonth, setFilterMonth] = useState(currentMonth);

    // Form state
    const [leaveUserId, setLeaveUserId] = useState('');
    const [leaveMonth, setLeaveMonth] = useState(currentMonth);
    const [leaveNote, setLeaveNote] = useState('');

    useEffect(() => {
        fetchLeaves();
        if (user.role === 'Admin') {
            fetchUsers();
        }
    }, [filterMonth, user.role]);

    const fetchLeaves = async () => {
        try {
            const url = filterMonth ? `/api/leaves/?month=${filterMonth}` : '/api/leaves/';
            const res = await fetch(url);
            if (res.ok) setLeaves(await res.json());
        } catch (err) { console.error('Failed to load leaves', err); }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users/');
            if (res.ok) setUsers(await res.json());
        } catch (err) { console.error('Failed to load users', err); }
    };

    const handleAddLeave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                user_id: leaveUserId,
                month: leaveMonth,
                note: leaveNote
            };

            const res = await fetch('/api/leaves/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success('Leave record added');
            setLeaveUserId('');
            setLeaveNote('');
            if (leaveMonth === filterMonth) {
                fetchLeaves();
            } else {
                setFilterMonth(leaveMonth); // This will trigger fetchLeaves via useEffect
            }
        } catch (err) {
            toast.error(err.message || 'Failed to add leave');
        }
    };

    const handleRemoveLeave = async (id) => {
        if (!window.confirm("Remove this leave record?")) return;
        try {
            const res = await fetch(`/api/leaves/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to remove leave');
            toast.success('Leave removed');
            fetchLeaves();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatMonthDisplay = (yyyyMM) => {
        if (!yyyyMM) return '';
        const [year, month] = yyyMM.split('-');
        const date = new Date(year, month - 1);
        return format(date, 'MMMM yyyy');
    };

    return (
        <div className="container print-container">
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', paddingTop: '1rem' }}>
                <div>
                    <h1 style={{ margin: 0 }}>Leave Tracker</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Log of personnel on monthly leave.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input
                        type="month"
                        className="input-field"
                        style={{ padding: '0.6rem 1rem', width: 'auto' }}
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                    />
                    <button onClick={handlePrint} className="btn btn-outline">
                        <Printer size={16} /> Print Report
                    </button>
                </div>
            </div>

            <div className="print-only" style={{ display: 'none', marginBottom: '2rem', textAlign: 'center' }}>
                <h2>DHQ CSOC - Leave Report</h2>
                <p>Month: {formatMonthDisplay(filterMonth)}</p>
                <p>Generated on: {format(new Date(), 'PPp')}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                {user.role === 'Admin' && (
                    <div className="glass-panel animate-fade-in no-print" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                            <CalendarDays size={20} color="var(--primary)" />
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Record Leave</h2>
                        </div>

                        <form onSubmit={handleAddLeave} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 200px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase' }}>Personnel</label>
                                <select className="input-field" value={leaveUserId} onChange={(e) => setLeaveUserId(e.target.value)} required>
                                    <option value="" style={{ color: '#000' }}>Select Personnel...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id} style={{ color: '#000' }}>{u.rank} {u.name} ({u.service_number})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ flex: '1 1 150px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase' }}>Month</label>
                                <input type="month" className="input-field" value={leaveMonth} onChange={(e) => setLeaveMonth(e.target.value)} required />
                            </div>
                            <div style={{ flex: '2 1 200px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase' }}>Notes (Optional)</label>
                                <input type="text" className="input-field" value={leaveNote} onChange={(e) => setLeaveNote(e.target.value)} placeholder="e.g. Annual leave" />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 1.5rem' }}>Record Leave</button>
                        </form>
                    </div>
                )}

                <div className="glass-panel animate-fade-in animate-delay-1 print-unstyle" style={{ padding: '2rem' }}>
                    <div style={{ paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                        <h3 className="no-print" style={{ margin: 0 }}>Showing Leaves for: <span style={{ color: 'var(--primary)' }}>{formatMonthDisplay(filterMonth)}</span></h3>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Personnel Name</th>
                                    <th>Service #</th>
                                    <th>Month</th>
                                    <th>Notes</th>
                                    {user.role === 'Admin' && <th className="no-print" style={{ textAlign: 'right' }}>Controls</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.map(l => (
                                    <tr key={l.id}>
                                        <td style={{ fontWeight: '600' }}>{l.user.rank} {l.user.name}</td>
                                        <td>{l.user.service_number}</td>
                                        <td>{formatMonthDisplay(l.month)}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{l.note || '-'}</td>
                                        {user.role === 'Admin' && (
                                            <td className="no-print" style={{ textAlign: 'right' }}>
                                                <button onClick={() => handleRemoveLeave(l.id)} className="btn btn-danger" style={{ padding: '0.3rem 0.8rem', fontSize: '12px' }}>
                                                    <Trash2 size={12} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {leaves.length === 0 && (
                                    <tr>
                                        <td colSpan={user.role === 'Admin' ? 5 : 4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No personnel on leave this month.</td>
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
