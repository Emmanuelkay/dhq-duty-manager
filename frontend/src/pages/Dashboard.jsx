import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, isToday } from 'date-fns';

export default function Dashboard() {
    const { user } = useAuth();
    const [duties, setDuties] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [apiHolidays, setApiHolidays] = useState({});

    useEffect(() => {
        fetchDuties();
    }, []);

    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                const year = currentDate.getFullYear();
                const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/KE`);
                if (res.ok) {
                    const data = await res.json();
                    const map = {};
                    data.forEach(h => {
                        const monthDay = h.date.substring(5); // Extract MM-DD
                        map[monthDay] = h.localName || h.name;
                    });
                    setApiHolidays(map);
                }
            } catch (err) {
                console.error("Failed to fetch holidays from API", err);
            }
        };
        fetchHolidays();
    }, [currentDate.getFullYear()]);

    const fetchDuties = async () => {
        try {
            const res = await fetch('/api/duties/');
            const data = await res.json();
            setDuties(data);
        } catch (err) {
            console.error(err);
        }
    };

    const getDayDuties = (date) => {
        return duties.filter(d => d.date.startsWith(format(date, 'yyyy-MM-dd')));
    };

    const todayDuties = getDayDuties(new Date());
    const whoIsOnDutyToday = todayDuties.length > 0 ? todayDuties[0].user : null;

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const startDayOfWeek = monthStart.getDay(); // 0 is Sunday
    const paddingDays = Array.from({ length: startDayOfWeek }).map((_, i) => i);

    const displayDate = format(currentDate, 'MMMM yyyy');

    return (
        <div className="container" style={{ maxWidth: '1000px' }}>
            {/* Hero Section */}
            <div style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '1rem' }}>
                <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0', letterSpacing: '-0.025em' }}>Dashboard</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: 0 }}>Overview of the operational roster.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Active Duty Card */}
                <div className="glass-panel animate-fade-in" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Current Duty Officer</h3>

                    {whoIsOnDutyToday ? (
                        <div>
                            <h1 style={{ fontSize: '3rem', margin: '0 0 0.5rem 0', fontWeight: '700' }}>
                                {whoIsOnDutyToday.rank} {whoIsOnDutyToday.name}
                            </h1>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.15)', padding: '0.4rem 1rem', borderRadius: '980px', color: 'var(--primary)', fontWeight: '600', fontSize: '13px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                                ID: {whoIsOnDutyToday.service_number}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontWeight: '600' }}>Unassigned</h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>No officer is scheduled for watch today.</p>
                        </div>
                    )}
                </div>

                {/* Calendar Card */}
                <div className="glass-panel animate-fade-in animate-delay-1" style={{ display: 'flex', flexDirection: 'column', padding: '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)' }}>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Schedule</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '13px' }}
                                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
                                Previous
                            </button>
                            <h3 style={{ margin: 0, width: '140px', textAlign: 'center', fontSize: '15px', fontWeight: '600' }}>{displayDate}</h3>
                            <button className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '13px' }}
                                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
                                Next
                            </button>
                        </div>
                    </div>

                    <div className="calendar-grid" style={{ padding: '1.5rem' }}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="calendar-day-header">{day}</div>
                        ))}

                        {paddingDays.map(i => (
                            <div key={`padding-${i}`} className="calendar-cell" style={{ opacity: 0, pointerEvents: 'none' }}></div>
                        ))}

                        {daysInMonth.map(day => {
                            const dayDuties = getDayDuties(day);
                            const hasDuty = dayDuties.length > 0;
                            const currentToday = isToday(day);
                            const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                            const isFriday = day.getDay() === 5;
                            const isSaturday = day.getDay() === 6;
                            const isSunday = day.getDay() === 0;

                            // Kenyan holidays (API fetched + Manual overrides like Eid and Boxing Day if API misses them)
                            const monthDay = format(day, 'MM-dd');
                            const manualHolidays = {
                                '03-20': "Eid al-Fitr",
                                '06-07': "Eid al-Adha"
                            };
                            const holidayName = apiHolidays[monthDay] || manualHolidays[monthDay];
                            const isHoliday = !!holidayName;

                            let dayClass = '';
                            if (isHoliday) dayClass = 'is-holiday';
                            else if (isSunday) dayClass = 'is-sunday';
                            else if (isSaturday) dayClass = 'is-saturday';
                            else if (isFriday) dayClass = 'is-friday';

                            return (
                                <div key={day.toISOString()} className={`calendar-cell ${hasDuty ? 'has-duty' : ''} ${isPast ? 'past-date' : ''} ${dayClass}`}
                                    style={currentToday ? { border: '2px solid var(--primary)', background: 'rgba(255, 255, 255, 0.05)', boxShadow: '0 0 20px var(--primary-glow)' } : {}}>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                                        <div className="date-num" style={currentToday ? { color: 'var(--primary)', fontWeight: '700' } : {}}>
                                            {format(day, 'd')}
                                        </div>
                                        {holidayName && (
                                            <div className="holiday-label">
                                                {holidayName}
                                            </div>
                                        )}
                                    </div>

                                    {hasDuty && (
                                        <div className="duty-pill" style={currentToday ? { background: 'var(--primary)', boxShadow: '0 4px 15px var(--primary-glow)' } : {}} title={`${dayDuties[0].user.rank} ${dayDuties[0].user.name}`}>
                                            {dayDuties[0].user.name.split(' ').pop()}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
