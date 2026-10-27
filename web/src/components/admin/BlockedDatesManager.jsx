'use client';

import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import { format } from 'date-fns';
import { Ban, Trash2, Plus } from 'lucide-react';
import { bookingService } from '../../services';
import Spinner from '../ui/Spinner';
import 'react-calendar/dist/Calendar.css';
import '../../BookingCalendarOverride.css';

const SLOT_STEP_MIN = 15;

const toMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};
const toTimeStr = (mins) =>
    `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

// כל שעות ההתחלה (כל רבע שעה) בטווח, כולל הקצוות. "עד" קטן מ"מ-" = אחרי חצות ("24:00" וכו', כמו בשעות הפעילות)
const slotsInRange = (from, to) => {
    const start = toMinutes(from);
    let end = toMinutes(to);
    if (end < start) end += 24 * 60;
    const slots = [];
    for (let t = start; t <= end; t += SLOT_STEP_MIN) slots.push(toTimeStr(t));
    return slots;
};

// ["14:00","14:15","14:30","17:00"] → "14:00–14:30, 17:00"
const formatSlotRanges = (slots) => {
    const sorted = [...slots].sort((a, b) => toMinutes(a) - toMinutes(b));
    const ranges = [];
    for (const s of sorted) {
        const last = ranges[ranges.length - 1];
        if (last && toMinutes(s) - toMinutes(last.to) === SLOT_STEP_MIN) last.to = s;
        else ranges.push({ from: s, to: s });
    }
    return ranges.map(r => (r.from === r.to ? r.from : `${r.from}–${r.to}`)).join(', ');
};

// כל התאריכים בין שני תאריכי "YYYY-MM-DD" (כולל)
const datesInRange = (from, to) => {
    const dates = [];
    const cur = new Date(from + 'T00:00:00Z');
    const end = new Date((to || from) + 'T00:00:00Z');
    while (cur <= end) {
        dates.push(cur.toISOString().slice(0, 10));
        cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return dates;
};

const blockDateStr = (block) => new Date(block.date).toISOString().slice(0, 10);

const formatDisplayDate = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00Z');
    return `${d.toLocaleDateString('he-IL', { weekday: 'long' })} ${dateStr.split('-').reverse().join('/')}`;
};

// חסימת ימים ושעות להזמנה (נשמר מיד בשרת - לא דרך "שמור שינויים")
const BlockedDatesManager = () => {
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [mode, setMode] = useState('day'); // 'day' = יום שלם / טווח ימים, 'hours' = שעות ביום מסוים
    const [form, setForm] = useState({ dateFrom: '', dateTo: '', timeFrom: '', timeTo: '', reason: '' });

    const fetchBlocks = async () => {
        try {
            setBlocks(await bookingService.getBlockedDates() || []);
        } catch (err) {
            console.error('Error fetching blocked dates:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlocks();
    }, []);

    const handleAdd = async () => {
        if (!form.dateFrom) return alert('יש לבחור יום בלוח');
        if (mode === 'day' && form.dateTo && form.dateTo < form.dateFrom) return alert('תאריך הסיום לפני תאריך ההתחלה');
        if (mode === 'hours' && (!form.timeFrom || !form.timeTo)) return alert('יש לבחור שעת התחלה ושעת סיום');

        setSaving(true);
        try {
            if (mode === 'day') {
                for (const date of datesInRange(form.dateFrom, form.dateTo)) {
                    await bookingService.blockDate({ date, reason: form.reason, isFullDay: true, blockedSlots: [] });
                }
            } else {
                // מצרפים לשעות שכבר חסומות באותו יום (השרת שומר רשומה אחת לכל תאריך)
                const existing = blocks.find(b => blockDateStr(b) === form.dateFrom);
                const merged = [...new Set([...(existing?.blockedSlots || []), ...slotsInRange(form.timeFrom, form.timeTo)])];
                await bookingService.blockDate({
                    date: form.dateFrom,
                    reason: form.reason || existing?.reason || '',
                    isFullDay: Boolean(existing?.isFullDay),
                    blockedSlots: merged
                });
            }
            setForm({ dateFrom: '', dateTo: '', timeFrom: '', timeTo: '', reason: '' });
            await fetchBlocks();
        } catch (err) {
            console.error(err);
            alert('שגיאה בשמירת החסימה');
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async (block) => {
        if (!confirm(`להסיר את החסימה של ${formatDisplayDate(blockDateStr(block))}?`)) return;
        try {
            await bookingService.removeBlock(block._id);
            setBlocks(prev => prev.filter(b => b._id !== block._id));
        } catch (err) {
            console.error(err);
            alert('שגיאה בהסרת החסימה');
        }
    };

    // לחיצה בלוח: ביום שלם - לחיצה ראשונה = יום אחד, לחיצה שנייה = סוף טווח; בשעות - יום אחד
    const handleCalendarChange = (value) => {
        const [start, end] = Array.isArray(value) ? value : [value, null];
        const dateFrom = start ? format(start, 'yyyy-MM-dd') : '';
        const dateTo = mode === 'day' && end ? format(end, 'yyyy-MM-dd') : '';
        setForm({ ...form, dateFrom, dateTo: dateTo === dateFrom ? '' : dateTo });
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setForm({ ...form, dateFrom: '', dateTo: '' });
    };

    // ערך הלוח לפי הבחירה הנוכחית
    const toLocalDate = (dateStr) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    };
    const calendarValue = !form.dateFrom
        ? null
        : mode === 'day' && form.dateTo
            ? [toLocalDate(form.dateFrom), toLocalDate(form.dateTo)]
            : toLocalDate(form.dateFrom);

    // סימון ימים שכבר חסומים: נקודה אדומה = כל היום, כתומה = חלק מהשעות
    const blocksByDate = Object.fromEntries(blocks.map(b => [blockDateStr(b), b]));
    const tileContent = ({ date, view }) => {
        if (view !== 'month') return null;
        const block = blocksByDate[format(date, 'yyyy-MM-dd')];
        if (!block) return null;
        return <span className={`block mx-auto mt-0.5 w-1.5 h-1.5 rounded-full ${block.isFullDay ? 'bg-red-500' : 'bg-orange-400'}`} />;
    };

    const selectedText = !form.dateFrom
        ? (mode === 'day' ? 'לחצו על יום בלוח (לחיצה נוספת על יום אחר = טווח ימים)' : 'לחצו על יום בלוח')
        : form.dateTo
            ? `נבחר: ${formatDisplayDate(form.dateFrom)} עד ${formatDisplayDate(form.dateTo)}`
            : `נבחר: ${formatDisplayDate(form.dateFrom)}`;

    const inputClass = 'bg-[#130b1e] border border-white/10 rounded-lg p-2 text-white';
    const tabClass = (active) => `flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${active ? 'bg-brand-primary text-white' : 'text-gray-400 hover:bg-white/5'}`;

    return (
        <div className="bg-[#1a0b2e]/50 border border-white/10 p-4 md:p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Ban className="text-red-400" size={24} />
                חסימת ימים ושעות להזמנה
            </h3>
            <p className="text-gray-400 text-sm mb-6 pb-4 border-b border-white/5">
                ימים ושעות חסומים לא יוצעו ללקוחות באתר. החסימה נשמרת מיד (אין צורך ב&quot;שמור שינויים&quot;).
                לחסימה קבועה של יום בשבוע - סמנו אותו &quot;סגור&quot; בשעות הפעילות למעלה.
            </p>

            {/* --- טופס חסימה חדשה --- */}
            <div className="bg-black/20 border border-white/5 rounded-xl p-4 mb-6 space-y-4">
                <div className="flex gap-2 bg-black/20 p-1 rounded-lg">
                    <button type="button" onClick={() => switchMode('day')} className={tabClass(mode === 'day')}>יום שלם / כמה ימים</button>
                    <button type="button" onClick={() => switchMode('hours')} className={tabClass(mode === 'hours')}>שעות מסוימות ביום</button>
                </div>

                <div className="booking-calendar-container max-w-md">
                    <Calendar
                        key={mode} // איפוס בחירת טווח כשמחליפים מצב
                        onChange={handleCalendarChange}
                        value={calendarValue}
                        selectRange={mode === 'day'}
                        allowPartialRange={mode === 'day'}
                        minDate={new Date()}
                        locale="he-IL"
                        tileContent={tileContent}
                        className="text-sm w-full"
                    />
                </div>
                <p className={`text-sm ${form.dateFrom ? 'text-white font-bold' : 'text-gray-500'}`}>{selectedText}</p>
                <p className="text-xs text-gray-500 flex flex-wrap gap-4">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> חסום כל היום</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" /> חסומות חלק מהשעות</span>
                </p>

                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                    {mode === 'hours' && (
                        <>
                            <label className="flex items-center gap-2">
                                משעה
                                <input type="time" step="900" dir="ltr" value={form.timeFrom} onChange={(e) => setForm({ ...form, timeFrom: e.target.value })} className={inputClass} />
                            </label>
                            <label className="flex items-center gap-2">
                                עד שעה
                                <input type="time" step="900" dir="ltr" value={form.timeTo} onChange={(e) => setForm({ ...form, timeTo: e.target.value })} className={inputClass} />
                            </label>
                        </>
                    )}
                </div>

                {mode === 'hours' && (
                    <p className="text-xs text-gray-500">
                        נחסמות שעות ההתחלה בטווח (כולל). לדוגמה 14:00 עד 15:45 - לא ניתן יהיה להתחיל משחק בין 14:00 ל-15:45.
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                    <input
                        type="text"
                        placeholder="סיבה (לשימושך בלבד, אופציונלי)"
                        value={form.reason}
                        onChange={(e) => setForm({ ...form, reason: e.target.value })}
                        className={`${inputClass} flex-1 min-w-[200px]`}
                    />
                    <button
                        type="button"
                        onClick={handleAdd}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 font-bold hover:bg-red-500/30 disabled:opacity-50"
                    >
                        <Plus size={16} /> {saving ? 'חוסם...' : 'חסום'}
                    </button>
                </div>
            </div>

            {/* --- רשימת חסימות עתידיות --- */}
            {loading ? (
                <div className="flex justify-center py-6"><Spinner size="sm" /></div>
            ) : blocks.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">אין חסימות עתידיות</p>
            ) : (
                <ul className="space-y-2">
                    {blocks.map((block) => (
                        <li key={block._id} className="flex items-center justify-between gap-3 bg-black/20 border border-white/5 rounded-xl p-3">
                            <div>
                                <p className="text-white font-bold">{formatDisplayDate(blockDateStr(block))}</p>
                                <p className="text-sm text-red-300">
                                    {block.isFullDay ? 'כל היום' : <span dir="ltr">{formatSlotRanges(block.blockedSlots || [])}</span>}
                                </p>
                                {block.reason && <p className="text-xs text-gray-500">{block.reason}</p>}
                            </div>
                            <button type="button" onClick={() => handleRemove(block)} title="הסר חסימה" className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                <Trash2 size={16} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default BlockedDatesManager;
