import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { Users, UserPlus, Shield, Trash2, Calendar, Printer, Key, Settings } from 'lucide-react';

export default function Admin() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [duties, setDuties] = useState([]);

    // Form states
    const [newSvcNo, setNewSvcNo] = useState('');
    const [newName, setNewName] = useState('');
    const [newRank, setNewRank] = useState('');
    const [newRole, setNewRole] = useState('User');
    const [dutyDate, setDutyDate] = useState('');
    const [dutyUserId, setDutyUserId] = useState('');

    // Inline edit state
    const [editingDutyId, setEditingDutyId] = useState(null);
    const [editDutyDate, setEditDutyDate] = useState('');
    const [editDutyUserId, setEditDutyUserId] = useState('');

    useEffect(() => {
        fetchUsers();
        fetchDuties();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users/');
            if (res.ok) setUsers(await res.json());
        } catch (err) { console.error('Failed to load users', err); }
    };

    const fetchDuties = async () => {
        try {
            const res = await fetch('/api/duties/');
            if (res.ok) setDuties(await res.json());
        } catch (err) { console.error('Failed to load duties', err); }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/users/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ service_number: newSvcNo, name: newName, rank: newRank, role: newRole })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success('Personnel record initialized');
            setNewSvcNo(''); setNewName(''); setNewRank(''); setNewRole('User');
            fetchUsers();
        } catch (err) { toast.error(err.message); }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Purge personnel record?")) return;
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to purge');
            toast.success('Record purged');
            fetchUsers();
        } catch (err) { toast.error(err.message); }
    };

    const handleResetPassword = async (id, name) => {
        if (!window.confirm(`Reset credentials for ${name}?`)) return;
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: 'Changeme!' })
            });
            if (!res.ok) throw new Error('Reset failed');
            toast.success('Credentials reset to default');
        } catch (err) { toast.error(err.message); }
    };

    const handleAssignDuty = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/duties/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: dutyDate, user_id: dutyUserId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success('Duty assigned');
            setDutyDate(''); setDutyUserId('');
            fetchDuties();
        } catch (err) { toast.error(err.message); }
    };

    const handleRemoveDuty = async (id) => {
        if (!window.confirm("Abort duty assignment?")) return;
        try {
            const res = await fetch(`/api/duties/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Abort failed');
            toast.success('Assignment aborted');
            fetchDuties();
        } catch (err) { toast.error(err.message); }
    };

    const handleSaveEdit = async (id) => {
        try {
            const res = await fetch(`/api/duties/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: editDutyDate, user_id: editDutyUserId })
            });
            if (!res.ok) throw new Error('Update failed');
            toast.success('Assignment updated');
            setEditingDutyId(null);
            fetchDuties();
        } catch (err) { toast.error(err.message); }
    };

    return (
        <div className="container" style={{ paddingTop: '80px' }}>
            <header className="animate-entry" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h1 style={{ fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Core</h1>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>Root Administrative & Personnel Control</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)', alignItems: 'start' }}>
                {/* User Mgmt */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                    <div className="glass-panel animate-entry" style={{ padding: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                            <UserPlus size={18} color="var(--color-accent)" />
                            <h2 style={{ fontSize: '0.9rem', textTransform: 'uppercase' }}>Enlist Personnel</h2>
                        </div>
                        <form onSubmit={handleAddUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                            <div className="input-group">
                                <label className="label">Service Identifier</label>
                                <input type="text" className="input-field" value={newSvcNo} onChange={(e) => setNewSvcNo(e.target.value)} required />
                            </div>
                            <div className="input-group">
                                <label className="label">Rank</label>
                                <input type="text" className="input-field" value={newRank} onChange={(e) => setNewRank(e.target.value)} required />
                            </div>
                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label className="label">Full Name</label>
                                <input type="text" className="input-field" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                            </div>
                            <div className="input-group">
                                <label className="label">Access Level</label>
                                <select className="input-field" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                                    <option value="User" style={{ background: 'var(--color-bg-base)' }}>Standard User</option>
                                    <option value="Admin" style={{ background: 'var(--color-bg-base)' }}>System Admin</option>
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ height: '42px', marginTop: 'auto' }}>Enlist</button>
                        </form>
                    </div>

                    <div className="glass-panel animate-entry" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}>
                            <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Personnel Directory</h3>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Entity</th>
                                        <th>Role</th>
                                        <th style={{ textAlign: 'center' }}>Ops</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td>
                                                <div style={{ fontWeight: '700' }}>{u.rank} {u.name.toUpperCase()}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-accent)' }}>{u.service_number}</div>
                                            </td>
                                            <td>
                                                <span className={`badge ${u.role === 'Admin' ? 'badge-danger' : 'badge-success'}`}>
                                                    {u.role.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                    <button onClick={() => handleResetPassword(u.id, u.name)} className="btn-ghost" title="Reset Pin" style={{ border: 'none', padding: '6px' }}>
                                                        <Key size={14} color="var(--color-warning)" />
                                                    </button>
                                                    {user.id !== u.id && (
                                                        <button onClick={() => handleDeleteUser(u.id)} className="btn-ghost" title="Purge" style={{ border: 'none', padding: '6px' }}>
                                                            <Trash2 size={14} color="var(--color-danger)" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Duty Mgmt */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                    <div className="glass-panel animate-entry" style={{ padding: 'var(--spacing-lg)', animationDelay: '100ms' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                            <Settings size={18} color="var(--color-accent)" />
                            <h2 style={{ fontSize: '0.9rem', textTransform: 'uppercase' }}>Duty Assignment</h2>
                        </div>
                        <form onSubmit={handleAssignDuty} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            <div className="input-group">
                                <label className="label">Operational Date</label>
                                <input type="date" className="input-field" value={dutyDate} onChange={(e) => setDutyDate(e.target.value)} required />
                            </div>
                            <div className="input-group">
                                <label className="label">Assignee</label>
                                <select className="input-field" value={dutyUserId} onChange={(e) => setDutyUserId(e.target.value)} required>
                                    <option value="" style={{ background: 'var(--color-bg-base)' }}>Select Personnel...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id} style={{ background: 'var(--color-bg-base)' }}>{u.rank} {u.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2', height: '42px' }}>Establish Assignment</button>
                        </form>
                    </div>

                    <div className="glass-panel animate-entry" style={{ padding: 0, overflow: 'hidden', animationDelay: '150ms' }}>
                        <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid rgba(255, 255, 255, 0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Deployment Log</h3>
                            <button onClick={() => window.print()} className="btn-ghost" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>
                                <Printer size={14} /> EXPORT
                            </button>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Deployment</th>
                                        <th style={{ textAlign: 'center' }}>Control</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {duties.sort((a,b) => b.date.localeCompare(a.date)).slice(0, 15).map(d => {
                                        const isEditing = editingDutyId === d.id;
                                        return (
                                            <tr key={d.id}>
                                                <td style={{ fontSize: '0.75rem' }}>
                                                    {isEditing ? (
                                                        <input type="date" className="input-field" style={{ padding: '4px', height: '28px' }} value={editDutyDate} onChange={(e) => setEditDutyDate(e.target.value)} />
                                                    ) : (
                                                        format(new Date(d.date + 'T00:00:00'), 'dd MMM yyyy').toUpperCase()
                                                    )}
                                                </td>
                                                <td>
                                                    {isEditing ? (
                                                        <select className="input-field" style={{ padding: '4px', height: '28px' }} value={editDutyUserId} onChange={(e) => setEditDutyUserId(e.target.value)}>
                                                            {users.map(u => <option key={u.id} value={u.id}>{u.rank} {u.name}</option>)}
                                                        </select>
                                                    ) : (
                                                        <div style={{ fontWeight: '600' }}>{d.user.rank} {d.user.name.toUpperCase()}</div>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {isEditing ? (
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            <button onClick={() => handleSaveEdit(d.id)} className="btn-primary" style={{ padding: '4px 8px', fontSize: '10px' }}>OK</button>
                                                            <button onClick={() => setEditingDutyId(null)} className="btn-ghost" style={{ padding: '4px 8px', fontSize: '10px' }}>X</button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                            <button onClick={() => { setEditingDutyId(d.id); setEditDutyDate(d.date); setEditDutyUserId(d.user_id); }} className="btn-ghost" style={{ border: 'none', padding: '6px' }}>
                                                                <Settings size={14} color="var(--color-accent)" />
                                                            </button>
                                                            <button onClick={() => handleRemoveDuty(d.id)} className="btn-ghost" style={{ border: 'none', padding: '6px' }}>
                                                                <Trash2 size={14} color="var(--color-danger)" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
