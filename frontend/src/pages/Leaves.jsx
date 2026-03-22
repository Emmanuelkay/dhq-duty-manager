import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { format, parseISO, addDays, isWithinInterval } from 'date-fns';
import { CalendarDays, Trash2, Printer, Plus } from 'lucide-react';

export default function Leaves() {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [users, setUsers] = useState([]);
    const [isAdding, setIsAdding] = useState(false);

    // Filter state
    const currentYear = new Date().getFullYear().toString();
    const [filterYear, setFilterYear] = useState(currentYear);

    // Form state
    const [leaveUserId, setLeaveUserId] = useState('');
    const [leaveStartDate, setLeaveStartDate] = useState('');
    const [leaveNote, setLeaveNote] = useState('');

    useEffect(() => {
        fetchLeaves();
        if (user.role === 'Admin') {
            fetchUsers();
        }
    }, [filterYear, user.role]);

    const fetchLeaves = async () => {
        try {
            const url = filterYear ? `/api/leaves/?year=${filterYear}` : '/api/leaves/';
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
            const startDate = parseISO(leaveStartDate);
            const endDate = addDays(startDate, 32);
            const year = format(startDate, 'yyyy');
            const month = format(startDate, 'MMMM');

            const payload = {
                user_id: leaveUserId,
                year: year,
                month: month,
                start_date: format(startDate, 'yyyy-MM-dd'),
                end_date: format(endDate, 'yyyy-MM-dd'),
                note: leaveNote
            };

            const res = await fetch('/api/leaves/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success('Leave record synchronized');
            setLeaveUserId('');
            setLeaveStartDate('');
            setLeaveNote('');
            setIsAdding(false);
            if (year === filterYear) {
                fetchLeaves();
            } else {
                setFilterYear(year);
            }
        } catch (err) {
            toast.error(err.message || 'Synchronization failed');
        }
    };

    const handleRemoveLeave = async (id) => {
        if (!window.confirm("Purge this leave record?")) return;
        try {
            const res = await fetch(`/api/leaves/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to purge record');
            toast.success('Record purged');
            fetchLeaves();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const getStatus = (start, end) => {
        const now = new Date();
        const s = parseISO(start);
        const e = parseISO(end);
        if (isWithinInterval(now, { start: s, end: e })) return 'badge-success';
        if (now < s) return 'badge-warning';
        return 'badge-danger';
    };

    const getStatusLabel = (start, end) => {
        const now = new Date();
        const s = parseISO(start);
        const e = parseISO(end);
        if (isWithinInterval(now, { start: s, end: e })) return 'Active';
        if (now < s) return 'Scheduled';
        return 'Completed';
    };

    return (
        <div className="container" style={{ paddingTop: '80px' }}>
            <div className="no-print animate-entry" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-xl)' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leave Tracker</h1>
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>Full-year personnel leave cycle monitoring.</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                    <input
                        type="number"
                        min="2000"
                        max="2099"
                        className="input-field"
                        style={{ padding: '6px 12px', width: '100px', height: '36px' }}
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                    />
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
                            <CalendarDays size={18} color="var(--color-accent)" />
                            <h2 style={{ fontSize: '0.9rem', textTransform: 'uppercase' }}>Initialize Leave Cycle (32 Days)</h2>
                        </div>

                        <form onSubmit={handleAddLeave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', alignItems: 'end' }}>
                            <div className="input-group">
                                <label className="label">Personnel</label>
                                <select className="input-field" value={leaveUserId} onChange={(e) => setLeaveUserId(e.target.value)} required>
                                    <option value="" style={{ background: 'var(--color-bg-base)' }}>Select User...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id} style={{ background: 'var(--color-bg-base)' }}>{u.rank} {u.name} ({u.service_number})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="label">Start Date</label>
                                <input type="date" className="input-field" value={leaveStartDate} onChange={(e) => setLeaveStartDate(e.target.value)} required />
                            </div>
                            <div className="input-group">
                                <label className="label">Notes / Remarks</label>
                                <input type="text" className="input-field" value={leaveNote} onChange={(e) => setLeaveNote(e.target.value)} placeholder="e.g. Annual Cycle" />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>Initialize</button>
                        </form>
                    </div>
                )}

                <div className="glass-panel animate-entry" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}>
                        <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-accent)' }}>
                            Cycle Year: {filterYear}
                        </h3>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Personnel Name</th>
                                    <th>Service ID</th>
                                    <th>Period Start</th>
                                    <th>Period End</th>
                                    <th>Status / Remarks</th>
                                    {user.role === 'Admin' && <th className="no-print" style={{ textAlign: 'center' }}>Ops</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.sort((a, b) => b.start_date.localeCompare(a.start_date)).map(l => (
                                    <tr key={l.id}>
                                        <td style={{ fontWeight: '700', color: 'var(--color-text-main)' }}>{l.user.rank} {l.user.name.toUpperCase()}</td>
                                        <td style={{ fontFamily: 'monospace', color: 'var(--color-accent)' }}>{l.user.service_number}</td>
                                        <td>{format(parseISO(l.start_date), 'dd MMM yyyy').toUpperCase()}</td>
                                        <td>{format(parseISO(l.end_date), 'dd MMM yyyy').toUpperCase()}</td>
                                        <td>
                                            <span className={`badge ${getStatus(l.start_date, l.end_date)}`}>
                                                {getStatusLabel(l.start_date, l.end_date)}
                                            </span>
                                            <span className="text-muted" style={{ marginLeft: '8px', fontSize: '0.75rem' }}>{l.note}</span>
                                        </td>
                                        {user.role === 'Admin' && (
                                            <td className="no-print" style={{ textAlign: 'center' }}>
                                                <button onClick={() => handleRemoveLeave(l.id)} className="btn-ghost" style={{ padding: '6px', border: 'none' }}>
                                                    <Trash2 size={14} color="var(--color-danger)" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {leaves.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                            No personnel on leave for this operational cycle.
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
