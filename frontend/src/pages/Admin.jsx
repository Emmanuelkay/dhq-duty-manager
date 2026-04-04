import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { Users, UserPlus, Shield, Trash2, Calendar, Printer, Key, Settings, Lock } from 'lucide-react';
import { differenceInDays, min, max } from 'date-fns';

const normalizeRank = (rank) => {
  if (!rank) return ''
  const rankMap = {
    'sgt': 'Sgt',
    'cpl': 'Cpl',
    'pvt': 'Pvt',
    'lt': 'Lt',
    'capt': 'Capt',
    'maj': 'Maj',
    'col': 'Col',
    'brig': 'Brig',
  }
  const lower = rank.toLowerCase().trim()
  return rankMap[lower] || rank.charAt(0).toUpperCase() + rank.slice(1).toLowerCase()
}

export default function Admin() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [duties, setDuties] = useState([]);

    // Form states
    const [newSvcNo, setNewSvcNo] = useState('');
    const [newName, setNewName] = useState('');
    const [newRank, setNewRank] = useState('');
    const [newRole, setNewRole] = useState('viewer');
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
            setNewSvcNo(''); setNewName(''); setNewRank(''); setNewRole('viewer');
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
                body: JSON.stringify({ date: dutyDate, user_id: parseInt(dutyUserId) })
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
                body: JSON.stringify({ date: editDutyDate, user_id: parseInt(editDutyUserId) })
            });
            if (!res.ok) throw new Error('Update failed');
            toast.success('Assignment updated');
            setEditingDutyId(null);
            fetchDuties();
        } catch (err) { toast.error(err.message); }
    };

    const sortedDuties = [...duties].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
    
    const deployments = sortedDuties.map(d => ({
        date: d.date,
        name: d.user?.name || '',
        rank: d.user?.rank || '',
        role: d.role || 'Duty Officer',
        personnelId: d.user_id
    }));
    const currentUser = user;

    const handlePrint = () => {
      // Normalize rank capitalisation
      const normalizeRank = (rank) => {
        if (!rank) return ''
        const rankMap = {
          'sgt': 'Sgt', 'cpl': 'Cpl', 'pvt': 'Pvt',
          'lt': 'Lt', 'capt': 'Capt', 'maj': 'Maj',
          'col': 'Col', 'brig': 'Brig', 'wo': 'WO',
          '2lt': '2Lt', 'ssgt': 'SSgt'
        }
        const lower = rank.toLowerCase().trim()
        return rankMap[lower] || rank.charAt(0).toUpperCase() + rank.slice(1).toLowerCase()
      }

      const formatPrintDate = (dateStr) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric'
        }).toUpperCase()
      }

      const getDayName = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()
      }

      const now = new Date()
      const generatedAt = now.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric'
      }) + ' at ' + now.toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit'
      }) + ' EAT'

      const docRef = `DHQ/CSOC/DUTY/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`

      // Count unique personnel
      const uniquePersonnel = [...new Set(deployments.map(d => d.personnelId || d.name))].length

      // Build table rows
      const tableRows = deployments.map((entry, index) => {
        const rank = normalizeRank(entry.rank || '')
        const name = (entry.name || '').toUpperCase()
        const role = entry.role || 'Duty Officer'
        const isWeekend = [0, 6].includes(new Date(entry.date).getDay())
        return `
          <tr class="${isWeekend ? 'weekend-row' : ''}">
            <td class="col-serial">${index + 1}</td>
            <td class="col-date">${formatPrintDate(entry.date)}</td>
            <td class="col-day">${getDayName(entry.date)}</td>
            <td class="col-name"><span class="rank">${rank}</span> ${name}</td>
            <td class="col-role">${role}</td>
          </tr>
        `
      }).join('')

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DHQ CSOC — Personnel Deployment Log</title>
  <style>
    /* PAGE */
    @page {
      size: A4 portrait;
      margin: 18mm 20mm 22mm 20mm;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      color: #000;
      background: #fff;
      line-height: 1.5;
    }

    /* HEADER */
    .doc-header {
      text-align: center;
      padding-bottom: 14pt;
      margin-bottom: 16pt;
      border-bottom: 2.5px solid #000;
    }

    .doc-classification {
      font-family: Arial, sans-serif;
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #000;
      margin-bottom: 10pt;
      padding: 3pt 12pt;
      border: 1px solid #000;
      display: inline-block;
    }

    .doc-org {
      font-family: Arial, sans-serif;
      font-size: 9pt;
      font-weight: 400;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #333;
      margin: 6pt 0 2pt;
    }

    .doc-title {
      font-family: Arial, sans-serif;
      font-size: 18pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #000;
      margin: 6pt 0 3pt;
    }

    .doc-subtitle {
      font-family: Arial, sans-serif;
      font-size: 9pt;
      color: #555;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .doc-meta {
      display: flex;
      justify-content: space-between;
      margin-top: 10pt;
      font-family: Arial, sans-serif;
      font-size: 8.5pt;
      color: #333;
      border-top: 1px solid #ccc;
      padding-top: 8pt;
    }

    /* SUMMARY */
    .doc-summary {
      display: flex;
      justify-content: space-around;
      margin: 14pt 0;
      padding: 10pt 0;
      border-top: 1px solid #ccc;
      border-bottom: 1px solid #ccc;
    }

    .summary-item {
      text-align: center;
    }

    .summary-value {
      font-family: Arial, sans-serif;
      font-size: 20pt;
      font-weight: 700;
      color: #000;
      display: block;
      line-height: 1.1;
    }

    .summary-label {
      font-family: Arial, sans-serif;
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #666;
      margin-top: 2pt;
    }

    /* SECTION LABEL */
    .section-label {
      font-family: Arial, sans-serif;
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #666;
      margin: 14pt 0 6pt;
      padding-bottom: 3pt;
      border-bottom: 1px solid #ddd;
    }

    /* TABLE */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
    }

    thead tr {
      background-color: #0d1117 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    thead th {
      font-family: Arial, sans-serif;
      font-size: 7.5pt;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #fff !important;
      padding: 8pt 10pt;
      text-align: left;
      border: 1px solid #0d1117;
    }

    tbody tr {
      page-break-inside: avoid;
    }

    tbody tr:nth-child(even) {
      background-color: #f7f7f7 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    tbody td {
      padding: 7pt 10pt;
      border: 1px solid #d0d0d0;
      vertical-align: middle;
      font-size: 10pt;
    }

    .weekend-row td {
      color: #444;
      background-color: #f0f0f0 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .col-serial {
      width: 6%;
      text-align: center;
      font-family: Arial, sans-serif;
      font-size: 8.5pt;
      color: #666;
    }

    .col-date {
      width: 18%;
      font-family: Arial, sans-serif;
      font-size: 9.5pt;
    }

    .col-day {
      width: 10%;
      font-family: Arial, sans-serif;
      font-size: 8.5pt;
      color: #555;
      text-align: center;
    }

    .col-name {
      width: 40%;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .rank {
      font-weight: 400;
      color: #444;
      font-size: 9.5pt;
    }

    .col-role {
      width: 26%;
      font-family: Arial, sans-serif;
      font-size: 9pt;
      color: #333;
    }

    /* SIGNATURE BLOCK */
    .signature-section {
      margin-top: 36pt;
      display: flex;
      justify-content: space-between;
    }

    .signature-block {
      width: 28%;
    }

    .signature-line {
      border-top: 1px solid #000;
      margin-bottom: 5pt;
      margin-top: 28pt;
    }

    .signature-name {
      font-size: 9.5pt;
      font-weight: 700;
    }

    .signature-label {
      font-family: Arial, sans-serif;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #555;
      margin-top: 2pt;
    }

    .signature-date-line {
      font-family: Arial, sans-serif;
      font-size: 8pt;
      color: #666;
      margin-top: 4pt;
    }

    /* FOOTER */
    .doc-footer {
      position: fixed;
      bottom: 10mm;
      left: 20mm;
      right: 20mm;
      border-top: 1px solid #aaa;
      padding-top: 5pt;
      display: flex;
      justify-content: space-between;
      font-family: Arial, sans-serif;
      font-size: 7.5pt;
      color: #777;
    }

    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="doc-header">
    <div><span class="doc-classification">Unclassified</span></div>
    <div class="doc-org">Defence Headquarters &mdash; Cyber Security Operations Centre</div>
    <div class="doc-title">Personnel Deployment Log</div>
    <div class="doc-subtitle">Official Duty Roster Document</div>
    <div class="doc-meta">
      <span><strong>Ref:</strong> ${docRef}</span>
      <span><strong>Generated:</strong> ${generatedAt}</span>
      <span><strong>Authority:</strong> DHQ CSOC Admin</span>
    </div>
  </div>

  <!-- SUMMARY -->
  <div class="doc-summary">
    <div class="summary-item">
      <span class="summary-value">${deployments.length}</span>
      <span class="summary-label">Total Deployments</span>
    </div>
    <div class="summary-item">
      <span class="summary-value">${uniquePersonnel}</span>
      <span class="summary-label">Personnel Deployed</span>
    </div>
    <div class="summary-item">
      <span class="summary-value">${deployments.length > 0 ? formatPrintDate(deployments[deployments.length - 1].date) : '—'}</span>
      <span class="summary-label">Period Start</span>
    </div>
    <div class="summary-item">
      <span class="summary-value">${deployments.length > 0 ? formatPrintDate(deployments[0].date) : '—'}</span>
      <span class="summary-label">Period End</span>
    </div>
  </div>

  <!-- TABLE -->
  <div class="section-label">Deployment Record</div>
  <table>
    <thead>
      <tr>
        <th class="col-serial">#</th>
        <th class="col-date">Date</th>
        <th class="col-day">Day</th>
        <th class="col-name">Duty Officer</th>
        <th class="col-role">Assignment</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <!-- SIGNATURE BLOCK -->
  <div class="signature-section">
    <div class="signature-block">
      <div class="signature-line"></div>
      <div class="signature-name">${currentUser?.rank || ''} ${currentUser?.name || 'Administrator'}</div>
      <div class="signature-label">Prepared By</div>
      <div class="signature-date-line">Date: _______________</div>
    </div>
    <div class="signature-block">
      <div class="signature-line"></div>
      <div class="signature-name">&nbsp;</div>
      <div class="signature-label">Verified By</div>
      <div class="signature-date-line">Date: _______________</div>
    </div>
    <div class="signature-block">
      <div class="signature-line"></div>
      <div class="signature-name">&nbsp;</div>
      <div class="signature-label">Commanding Officer</div>
      <div class="signature-date-line">Date: _______________</div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="doc-footer">
    <span>DHQ CSOC &mdash; Personnel Deployment Log &mdash; ${docRef}</span>
    <span>UNCLASSIFIED</span>
    <span>Printed: ${generatedAt}</span>
  </div>

</body>
</html>
      `

      // Open in new window and trigger print
      const printWindow = window.open('', '_blank', 'width=900,height=700')
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()

      // Wait for content to render then print
      printWindow.onload = () => {
        printWindow.print()
        printWindow.onafterprint = () => printWindow.close()
      }
    }

    return (
        <div className="container" style={{ paddingTop: '80px' }}>


            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)', alignItems: 'start' }}>
                {/* User Mgmt */}
                <section className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
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
                                    <option value="viewer" style={{ background: 'var(--color-bg-base)' }}>Viewer (Read-Only)</option>
                                    <option value="duty_officer" style={{ background: 'var(--color-bg-base)' }}>Duty Officer</option>
                                    <option value="admin" style={{ background: 'var(--color-bg-base)' }}>System Admin</option>
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
                                                <span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'duty_officer' ? 'badge-warning' : 'badge-success'}`}>
                                                    {u.role.replace('_', ' ').toUpperCase()}
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
                        <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                            <Settings size={18} color="var(--color-accent)" />
                            <h2 style={{ fontSize: '0.9rem', textTransform: 'uppercase' }}>Duty Assignment</h2>
                        </div>
                        <form className="no-print" onSubmit={handleAssignDuty} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
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
                            <button onClick={handlePrint} className="btn-ghost" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>
                                <Printer size={14} /> EXPORT
                            </button>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Deployment Detail</th>
                                        <th className="no-print" style={{ textAlign: 'center' }}>Control</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedDuties.map(d => {
                                        const isEditing = editingDutyId === d.id;
                                        // A duty is "past" if its date is strictly earlier than YESTERDAY (providing 24h grace period)
                                        const dutyDateObj = new Date(d.date + 'T00:00:00');
                                        const yesterday = new Date();
                                        yesterday.setDate(yesterday.getDate() - 1);
                                        yesterday.setHours(0, 0, 0, 0);
                                        const isPast = dutyDateObj < yesterday;
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
                                                <td className="no-print" style={{ textAlign: 'center' }}>
                                                    {isPast ? (
                                                        <Lock size={14} color="var(--color-text-muted)" style={{ opacity: 0.5 }} title="Deployment record locked" />
                                                    ) : isEditing ? (
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            <button onClick={() => handleSaveEdit(d.id)} className="btn-primary" style={{ padding: '4px 8px', fontSize: '10px' }}>OK</button>
                                                            <button onClick={() => setEditingDutyId(null)} className="btn-ghost" style={{ padding: '4px 8px', fontSize: '10px' }}>X</button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                            <button onClick={() => { setEditingDutyId(d.id); setEditDutyDate(d.date); setEditDutyUserId(d.user_id || d.user?.id); }} className="btn-ghost" style={{ border: 'none', padding: '6px' }}>
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
