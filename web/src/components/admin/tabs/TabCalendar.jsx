'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { format, startOfWeek, addDays, addWeeks, isSameDay } from 'date-fns';
import { CalendarDays, ChevronRight, ChevronLeft, RefreshCw } from 'lucide-react';
import { bookingService } from '../../../services';
import DayTimeline, { DayTimelineLegend } from '../DayTimeline';
import Spinner from '../../ui/Spinner';

// יומן שבועי: כל ימי השבוע במסך אחד, לכל יום שני פסי החדרים (גדול / קטן).
// לחיצה על הזמנה פותחת את כל הפרטים (רכיב DayTimeline הקיים).
const TabCalendar = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));

    const fetchBookings = async () => {
        setLoading(true);
        try {
            setBookings(await bookingService.getAll() || []);
        } catch (err) {
            console.error('Error fetching bookings:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

    // מספר ההזמנות הפעילות בכל יום (לכותרת היום)
    const countFor = (day) => bookings.filter((b) => {
        if (!b.date || b.status === 'cancelled') return false;
        try { return isSameDay(new Date(b.date), day); } catch { return false; }
    }).length;

    const today = new Date();
    const rangeLabel = `${format(days[0], 'dd/MM')} – ${format(days[6], 'dd/MM/yyyy')}`;
    const navBtn = 'p-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white';

    return (
        <div className="space-y-4 animate-fade-in">
            {/* --- כותרת וניווט --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <CalendarDays size={24} className="text-cyan-400" />
                    יומן
                </h2>

                <div className="flex items-center gap-2 flex-wrap">
                    <button type="button" onClick={() => setWeekStart(addWeeks(weekStart, -1))} className={navBtn} title="שבוע קודם">
                        <ChevronRight size={18} />
                    </button>
                    <span className="text-white font-bold min-w-[150px] text-center" dir="ltr">{rangeLabel}</span>
                    <button type="button" onClick={() => setWeekStart(addWeeks(weekStart, 1))} className={navBtn} title="שבוע הבא">
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}
                        className="px-3 py-2 rounded-lg border border-brand-primary/40 text-white text-sm hover:bg-brand-primary/20"
                    >
                        השבוע
                    </button>
                    <button type="button" onClick={fetchBookings} className={navBtn} title="רענון">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                <span>לחיצה על הזמנה מציגה את כל הפרטים. לעריכה - לשונית &quot;הזמנות&quot;.</span>
                <DayTimelineLegend />
            </div>

            {/* --- ימי השבוע --- */}
            {loading && bookings.length === 0 ? (
                <div className="flex justify-center py-20"><Spinner size="md" /></div>
            ) : (
                <div className="space-y-3">
                    {days.map((day) => {
                        const count = countFor(day);
                        const isToday = isSameDay(day, today);
                        const title = `${day.toLocaleDateString('he-IL', { weekday: 'long' })} ${format(day, 'dd/MM')}`
                            + (isToday ? ' · היום' : '')
                            + (count ? ` · ${count} הזמנות` : '');
                        return (
                            <div key={day.toISOString()} className={isToday ? 'ring-1 ring-cyan-400/50 rounded-xl' : ''}>
                                <DayTimeline bookings={bookings} selectedDate={day} title={title} showLegend={false} />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TabCalendar;
