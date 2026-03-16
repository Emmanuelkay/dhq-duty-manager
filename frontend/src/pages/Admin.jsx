import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { Users, UserPlus, Shield, Trash2 } from 'lucide-react';

export default function Admin() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [duties, setDuties] = useState([]);

    // New User Form State
    const [newSvcNo, setNewSvcNo] = useState('');
    const [newName, setNewName] = useState('');
    const [newRank, setNewRank] = useState('');
    const [newRole, setNewRole] = useState('User');

    // New Duty Form State
    const [dutyDate, setDutyDate] = useState('');
    const [dutyUserId, setDutyUserId] = useState('');

    // Edit Duty State
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

    const handleStartEdit = (duty) => {
        setEditingDutyId(duty.id);
        setEditDutyDate(duty.date);
        setEditDutyUserId(duty.user_id);
    };

    const handleCancelEdit = () => {
        setEditingDutyId(null);
        setEditDutyDate('');
        setEditDutyUserId('');
    };

    const handleSaveEdit = async (id) => {
        try {
            const res = await fetch(`/api/duties/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: editDutyDate, user_id: editDutyUserId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success('Duty updated successfully');
            setEditingDutyId(null);
            fetchDuties();
        } catch (err) {
            toast.error(err.message || 'Failed to update duty');
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/users/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_number: newSvcNo, name: newName, rank: newRank, role: newRole
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success('User added successfully');
            setNewSvcNo(''); setNewName(''); setNewRank(''); setNewRole('User');
            fetchUsers();
        } catch (err) {
            toast.error(err.message || 'Failed to add user');
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success('User deleted');
            fetchUsers();
        } catch (err) {
            toast.error(err.message || 'Failed to delete user');
        }
    };

    const handleResetPassword = async (id, name) => {
        if (!window.confirm(`Reset password for ${name} to default ('Changeme!')?`)) return;
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: 'Changeme!' })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`Password for ${name} has been reset`);
        } catch (err) {
            toast.error(err.message || 'Failed to reset password');
        }
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

            toast.success('Duty assigned successfully');
            setDutyDate(''); setDutyUserId('');
            fetchDuties();
        } catch (err) {
            toast.error(err.message || 'Failed to assign duty');
        }
    };

    const handleRemoveDuty = async (id) => {
        if (!window.confirm("Remove this duty assignment?")) return;
        try {
            const res = await fetch(`/api/duties/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to remove duty');
            toast.success('Duty removed');
            fetchDuties();
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <div className="container">
            <div style={{ marginBottom: '2.5rem', paddingTop: '1rem' }}>
                <h1 style={{ margin: 0 }}>System Administration</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage personnel and operations schedules.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                {/* Personnel Management Section */}
                <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                        <Users size={20} color="var(--primary)" />
                        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Directory</h2>
                    </div>

                    <form onSubmit={handleAddUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                        <div><label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase' }}>Service #</label><input type="text" className="input-field" value={newSvcNo} onChange={(e) => setNewSvcNo(e.target.value)} required /></div>
                        <div><label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase' }}>Name</label><input type="text" className="input-field" value={newName} onChange={(e) => setNewName(e.target.value)} required /></div>
                        <div><label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase' }}>Rank</label><input type="text" className="input-field" value={newRank} onChange={(e) => setNewRank(e.target.value)} required /></div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase' }}>Role</label>
                            <select className="input-field" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                                <option value="User" style={{ color: '#000' }}>User</option>
                                <option value="Admin" style={{ color: '#000' }}>Admin</option>
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem' }}><UserPlus size={16} /> Add Personnel</button>
                    </form>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Svc #</th>
                                    <th>Name</th>
                                    <th>Rank</th>
                                    <th>Role</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td style={{ fontWeight: '500' }}>{u.service_number}</td>
                                        <td>{u.name}</td>
                                        <td>{u.rank}</td>
                                        <td><span className={u.role === 'Admin' ? 'badge badge-admin' : 'badge badge-user'}>{u.role}</span></td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button onClick={() => handleResetPassword(u.id, u.name)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }}>
                                                    <Shield size={12} /> Reset Pwd
                                                </button>
                                                {user.id !== u.id && (
                                                    <button onClick={() => handleDeleteUser(u.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }}>
                                                        <Trash2 size={12} /> Remove
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

                {/* Duty Scheduling Section */}
                <div className="glass-panel animate-fade-in animate-delay-1" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                        <Shield size={20} color="var(--primary)" />
                        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Schedule Assignments</h2>
                    </div>

                    <form onSubmit={handleAssignDuty} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ flex: 1 }}><label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase' }}>Date</label><input type="date" className="input-field" value={dutyDate} onChange={(e) => setDutyDate(e.target.value)} required /></div>
                        <div style={{ flex: 2 }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase' }}>Personnel</label>
                            <select className="input-field" value={dutyUserId} onChange={(e) => setDutyUserId(e.target.value)} required>
                                <option value="" style={{ color: '#000' }}>Select Personnel...</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id} style={{ color: '#000' }}>{u.rank} {u.name} ({u.service_number})</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 1.5rem' }}>Assign Duty</button>
                    </form>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Assigned Personnel</th>
                                    <th style={{ textAlign: 'right' }}>Controls</th>
                                </tr>
                            </thead>
                            <tbody>
                                {duties.sort((a, b) => a.date > b.date ? 1 : -1).map(d => {
                                    // Lock checks
                                    const dutyDateObj = new Date(d.date + 'T00:00:00');
                                    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
                                    const isLocked = dutyDateObj < todayStart;
                                    const isEditing = editingDutyId === d.id;

                                    return (
                                        <tr key={d.id}>
                                            <td style={{ fontWeight: '500', minWidth: '150px' }}>
                                                {isEditing ? (
                                                    <input type="date" className="input-field" style={{ padding: '0.4rem', fontSize: '13px' }} value={editDutyDate} onChange={(e) => setEditDutyDate(e.target.value)} />
                                                ) : (
                                                    new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                                                )}
                                            </td>
                                            <td style={{ minWidth: '200px' }}>
                                                {isEditing ? (
                                                    <select className="input-field" style={{ padding: '0.4rem', fontSize: '13px' }} value={editDutyUserId} onChange={(e) => setEditDutyUserId(e.target.value)}>
                                                        {users.map(u => (
                                                            <option key={u.id} value={u.id}>{u.rank} {u.name}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary-glow)' }}></span>
                                                        {d.user.rank} {d.user.name}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {isLocked ? (
                                                    <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>Locked</span>
                                                ) : isEditing ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                        <button onClick={() => handleSaveEdit(d.id)} className="btn btn-primary" style={{ padding: '0.3rem 0.8rem', fontSize: '12px' }}>Save</button>
                                                        <button onClick={handleCancelEdit} className="btn btn-outline" style={{ padding: '0.3rem 0.8rem', fontSize: '12px' }}>Cancel</button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                        <button onClick={() => handleStartEdit(d)} className="btn btn-outline" style={{ padding: '0.3rem 0.8rem', fontSize: '12px' }}>
                                                            Edit
                                                        </button>
                                                        <button onClick={() => handleRemoveDuty(d.id)} className="btn btn-danger" style={{ padding: '0.3rem 0.8rem', fontSize: '12px' }}>
                                                            <Trash2 size={12} />
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
            </div>
        </div>
    );
}
