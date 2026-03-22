import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isToday, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, User, Users, ShieldAlert, Calendar } from 'lucide-react';
import CVEFeed from '../components/CVEFeed';

export default function Dashboard() {
    const { user } = useAuth();
    const [duties, setDuties] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [holidays, setHolidays] = useState([]);
    const [rosterActive, setRosterActive] = useState(false);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const holidaysCache = useRef(new Map());

    useEffect(() => {
        fetchDuties();
    }, []);

    useEffect(() => {
        const fetchHolidaysForYear = async () => {
            const year = currentDate.getFullYear();
            if (holidaysCache.current.has(year)) {
                setHolidays(holidaysCache.current.get(year));
                return;
            }

            try {
                const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/KE`);
                if (res.ok) {
                    const data = await res.json();
                    holidaysCache.current.set(year, data);
                    setHolidays(data);
                }
            } catch (err) {
                console.error("Failed to fetch holidays", err);
            }
        };
        fetchHolidaysForYear();
    }, [currentDate.getFullYear()]);

    const holidayMap = useMemo(() => {
        if (!holidays?.length) return {};
        return Object.fromEntries(
            holidays.map(h => [h.date, h.localName || h.name])
        );
    }, [holidays]);

    const fetchDuties = async () => {
        try {
            const res = await fetch('/api/duties/');
            const data = await res.json();
            setDuties(data);
        } catch (err) {
            console.error(err);
        }
    };

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [slideDirection, setSlideDirection] = useState(''); // 'next' or 'prev'
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [counts, setCounts] = useState({ total: 0, avg: 0 });
    const [now, setNow] = useState(new Date());

    // Auto-revert to CVE Mode after 90s inactivity
    useEffect(() => {
        if (!rosterActive) return;
        const timer = setTimeout(() => {
            setRosterActive(false);
            setSelectedDate(new Date());
        }, 90000);
        return () => clearTimeout(timer);
    }, [rosterActive, selectedDate]);

    // Window Resize Hook
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Escape key to close sidebar
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsSidebarOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Live Clock
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // JS Counter Animation
    useEffect(() => {
        const targetTotal = duties.length;
        const targetAvg = duties.length / 30;
        let startTimestamp = null;
        const duration = 600;

        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);

            setCounts({
                total: Math.floor(easeOut * targetTotal),
                avg: (easeOut * targetAvg).toFixed(1)
            });

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        window.requestAnimationFrame(step);
    }, [duties.length]);

    const getInitial = (name) => name?.charAt(0) || 'U';

    // Handle Month Navigation with Slide
    const handleMonthNav = (offset) => {
        setSlideDirection(offset > 0 ? 'next' : 'prev');
        setIsLoading(true);
        setTimeout(() => {
            setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
            setSlideDirection('');
            setTimeout(() => setIsLoading(false), 450);
        }, 150);
    };

    // Handle Date Selection with Panel Refresh
    const handleDateSelect = (day) => {
        setRosterActive(true);
        if (format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')) {
            if (windowWidth < 1280) setIsSidebarOpen(true);
            return;
        }
        setIsRefreshing(true);
        if (windowWidth < 1280) setIsSidebarOpen(true);
        setTimeout(() => {
            setSelectedDate(day);
            setIsRefreshing(false);
        }, 80);
    };

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const startDayOfWeek = monthStart.getDay();
    const paddingDaysBefore = Array.from({ length: startDayOfWeek }).map((_, i) => i);
    const endDayOfWeek = monthEnd.getDay();
    const paddingDaysAfter = Array.from({ length: 6 - endDayOfWeek }).map((_, i) => i);

    const selectedDayDuties = duties.filter(d => d.date.startsWith(format(selectedDate, 'yyyy-MM-dd'))) || [];
    const isMobile = windowWidth < 1280;

    return (
        <div className="container" style={{
            paddingTop: '70px',
            maxWidth: '1600px',
            minHeight: 'calc(100vh - 80px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
        }}>
            <style>{`
                @keyframes pulse-once {
                    0% { border-color: rgba(0, 212, 255, 0.4); }
                    50% { border-color: rgba(0, 212, 255, 0.8); }
                    100% { border-color: rgba(0, 212, 255, 0.4); }
                }
                @keyframes panel-in {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes card-entry {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .calendar-grid-container {
                    display: grid; 
                    grid-template-columns: repeat(7, 1fr); 
                    background: transparent;
                    transition: all 0.2s ease-out;
                }
                .calendar-grid-container.slide-next { animation: slide-out-left 0.15s forwards; }
                .calendar-grid-container.slide-prev { animation: slide-out-right 0.15s forwards; }
                .calendar-grid-container.enter-next { animation: slide-in-from-right 0.2s forwards; }
                .calendar-grid-container.enter-prev { animation: slide-in-from-left 0.2s forwards; }
                
                .nav-chevron { 
                    padding: 4px; 
                    border: none; 
                    background: transparent; 
                    color: rgba(255,255,255,0.45); 
                    cursor: pointer; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    transition: color 150ms ease-out;
                }
                .nav-chevron:hover { color: rgba(255,255,255,0.9); }
            `}</style>

            {/* Compact Header with Live Clock */}
            <header className="animate-fade-left" style={{ 
                marginBottom: 'var(--spacing-lg)', 
                display: 'flex', 
                alignItems: 'baseline', 
                justifyContent: 'space-between',
                animationDelay: '100ms' 
            }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-md)' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0, letterSpacing: '-0.02em', color: 'white' }}>
                        Personnel Roster
                    </h1>
                    <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>
                        DHQ CSOC Deployment Node
                    </p>
                </div>
                
                {/* Live Operational Clock */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '500', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
                        {format(now, 'd MMM yyyy').toUpperCase()}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.8rem' }}>•</span>
                    <span className="tabular-nums" style={{ fontSize: '0.8rem', fontWeight: '600', color: 'white', fontFamily: 'var(--font-main)' }}>
                        {format(now, 'HH:mm:ss')} EAT
                    </span>
                </div>
            </header>

            <div className={`dashboard-grid ${rosterActive ? 'roster-active' : ''}`} style={{ flex: 1, minWidth: 0 }}>
                {/* Stage 1: CVE dominant (left) or Calendar Expansion (left) */}
                <div className="grid-left-col">
                    {!rosterActive ? (
                        <CVEFeed mode="dominant" />
                    ) : (
                        <main className="glass-panel animate-scale-in" style={{ padding: 0, border: '1px solid var(--color-separator)', background: 'var(--color-bg-surface)', animationDelay: '200ms', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                padding: '16px 20px 12px',
                                borderBottom: '1px solid rgba(255,255,255,0.06)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'white' }}>
                                        {format(currentDate, 'MMMM yyyy')}
                                    </div>
                                    {rosterActive && (
                                        <button className="roster-close-btn" onClick={(e) => {
                                            e.stopPropagation();
                                            setRosterActive(false);
                                            setSelectedDate(new Date());
                                        }}>
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" 
                                                      strokeWidth="1.5" strokeLinecap="round"/>
                                            </svg>
                                            <span>Close Roster</span>
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button onClick={() => handleMonthNav(-1)} className="cal-nav-btn">
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button onClick={() => handleMonthNav(1)} className="cal-nav-btn">
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className={`calendar-grid ${slideDirection ? `slide-${slideDirection}` : 'enter-next'}`} 
                                 style={{ flex: 1 }}>
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                                    <div key={day} style={{ 
                                        padding: '12px 0 8px', fontSize: '0.65rem', fontWeight: '500', color: 'rgba(255,255,255,0.35)', textAlign: 'center', letterSpacing: '0.05em', textTransform: 'uppercase',
                                        borderBottom: '1px solid var(--color-separator)',
                                        background: idx === 0 || idx === 6 ? '#13151a' : 'transparent'
                                    }}>
                                        {day}
                                    </div>
                                ))}
                                
                                {paddingDaysBefore.map(i => (
                                    <div key={`p-pre-${i}`} className="calendar-cell padding-day"></div>
                                ))}

                                {daysInMonth.map((day, idx) => {
                                    const dateStr = format(day, 'yyyy-MM-dd');
                                    const dayDuties = duties.filter(d => d.date.startsWith(dateStr)) || [];
                                    const isTodayDate = dateStr === todayStr;
                                    const isPastDate = day < startOfDay(new Date()) && !isTodayDate;
                                    const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                                    const holidayName = holidayMap[dateStr];
                                    const isHoliday = !!holidayName;
                                    const rowIndex = Math.floor((startDayOfWeek + idx) / 7);
                                    const isEvenRow = rowIndex % 2 === 1;
                                    const showSkeleton = isLoading && (idx % 8 === 0 || idx % 11 === 0);
                                    
                                    return (
                                        <div 
                                            key={dateStr} 
                                            className={`calendar-cell ${isSelected ? 'selected' : ''} ${isPastDate ? 'past-date' : ''} ${isEvenRow ? 'calendar-grid-row-even' : ''} ${isHoliday ? 'holiday' : ''}`}
                                            onClick={() => handleDateSelect(day)}
                                        >
                                            <div className={`date-num ${isTodayDate ? 'today-indicator' : ''}`}>
                                                {format(day, 'd')}
                                            </div>

                                            {isHoliday && (
                                                <div className="holiday-label" title={holidayName}>
                                                    {holidayName}
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '0 10px 8px' }}>
                                                {showSkeleton ? (
                                                    <div className="shimmer-bar"></div>
                                                ) : (
                                                    dayDuties.map((duty, dIdx) => (
                                                        <div key={dIdx} className="personnel-chip">
                                                            <div className="avatar-circle">
                                                                {getInitial(duty.user?.name || duty.personnel_name)}
                                                            </div>
                                                            <span>
                                                                {(duty.user?.name || duty.personnel_name)?.split(' ').pop()}
                                                            </span>
                                                            <div className="chip-tooltip">
                                                                {duty.user?.name || duty.personnel_name} • {duty.role}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {paddingDaysAfter.map(i => (
                                    <div key={`p-post-${i}`} className="calendar-cell padding-day"></div>
                                ))}
                            </div>
                        </main>
                    )}
                </div>

                {/* Stage 2: Calendar Compact (right) or Detail Panel (right) */}
                <div className="grid-right-col">
                    {!rosterActive ? (
                        <div className="compact-calendar-container calendar-compact glass-panel animate-fade-right" style={{ border: '1px solid var(--color-separator)', height: '100%' }}>
                            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-separator)' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'white' }}>{format(currentDate, 'MMM yyyy')}</span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button onClick={(e) => { e.stopPropagation(); handleMonthNav(-1); }} className="cal-nav-btn"><ChevronLeft size={14} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleMonthNav(1); }} className="cal-nav-btn"><ChevronRight size={14} /></button>
                                </div>
                            </div>
                            <div className="calendar-grid compact" style={{ gridTemplateColumns: 'repeat(7, 1fr)', padding: '4px' }}>
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                    <div key={d} style={{ textAlign: 'center', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', padding: '4px 0' }}>{d}</div>
                                ))}
                                {paddingDaysBefore.map(i => <div key={i} />)}
                                {daysInMonth.map((day, idx) => {
                                    const dateStr = format(day, 'yyyy-MM-dd');
                                    const dayDuties = duties.filter(d => d.date.startsWith(dateStr)) || [];
                                    const isTodayDate = dateStr === todayStr;
                                    const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                                    return (
                                        <div 
                                            key={dateStr}
                                            className={`calendar-cell compact ${isSelected ? 'selected' : ''} ${isTodayDate ? 'today' : ''}`}
                                            onClick={() => handleDateSelect(day)}
                                            style={{ cursor: 'pointer', position: 'relative' }}
                                        >
                                            <div className="date-num" style={{ fontSize: '0.65rem' }}>{format(day, 'd')}</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', padding: '2px' }}>
                                                {dayDuties.map((duty, dIdx) => (
                                                    <div key={dIdx} className="chip--compact">
                                                        <div className="avatar-circle">
                                                            {getInitial(duty.user?.name || duty.personnel_name)}
                                                        </div>
                                                        <div className="chip__tooltip">
                                                            {duty.user?.name || duty.personnel_name} • {duty.role}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <aside className="detail-panel-container glass-panel animate-fade-right" style={{ border: '1px solid var(--color-separator)', height: '100%', opacity: isRefreshing ? 0.5 : 1 }}>
                            <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--color-separator)' }}>
                                <span style={{ fontSize: '0.62rem', fontWeight: '500', color: 'var(--color-text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Selected Date</span>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'white', margin: '4px 0 0' }}>{format(selectedDate, 'EEEE, d MMM')}</h3>
                            </div>
                            
                            <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-accent)' }}></div>
                                    <span style={{ fontSize: '0.62rem', fontWeight: '500', color: 'var(--color-text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Assigned Personnel ({selectedDayDuties.length})</span>
                                </div>
                                {selectedDayDuties.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        {selectedDayDuties.map((duty, idx) => (
                                            <div key={idx} className="animate-fade-up" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', margin: '0 -16px', borderRadius: '8px', animationDelay: `${idx * 50}ms` }}>
                                                <div className="avatar-circle" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>{getInitial(duty.user?.name || duty.personnel_name)}</div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'white' }}>{duty.user?.name || duty.personnel_name}</span>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{duty.role} • <span style={{ color: 'var(--color-accent)', opacity: 0.8 }}>ID: {duty.user?.service_number || duty.service_id}</span></span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '40px 0', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>No assignments for this date</div>
                                )}
                            </div>

                            <div style={{ padding: '24px', borderTop: '1px solid var(--color-separator)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Monthly Total</span>
                                    <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'white' }}>{counts.total}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Avg Deployment</span>
                                    <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'white' }}>{counts.avg}/d</span>
                                </div>
                            </div>
                        </aside>
                    )}
                </div>
            </div>

            {rosterActive && (
                <div style={{ marginTop: '16px' }} className="animate-fade-up">
                    <CVEFeed mode="compact" />
                </div>
            )}

            {/* Overlay background for mobile sidebar */}
            {isMobile && isSidebarOpen && (
                <div 
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 40
                    }}
                />
            )}
        </div>
    );
}
