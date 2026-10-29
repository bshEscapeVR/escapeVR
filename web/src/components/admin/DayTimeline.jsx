'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { Users, Clock, X, Phone, Mail, Calendar, CreditCard, Hash, MapPin, Pencil, MessageSquare } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────────────────────
const DAY_START_MIN = 10 * 60; // 10:00
const DAY_END_MIN   = 26 * 60; // 02:00 next night (last start 24:00 + 75 min)
const DAY_SPAN_MIN  = DAY_END_MIN - DAY_START_MIN; // 960 min = 100%
const SESSION_MIN   = 75; // 1h 15m per session
const BIG_ROOM_MAX   = 5; // Room 1 (big) holds up to 5 — groups of 6–8 use both rooms
const SMALL_ROOM_MAX = 4; // Room 2 (small) holds up to 4 — a group of 5 must be in room 1

const ROOM_LABELS = { 1: 'חדר 1 (גדול)', 2: 'חדר 2 (קטן)', both: 'שני החדרים' };
const HOUR_LABELS   = Array.from({ length: 17 }, (_, i) => i + 10); // [10…26] — shown as hour % 24

// ─────────────────────────────────────────────────────────────────────────────
//  Pure helpers
// ─────────────────────────────────────────────────────────────────────────────

/** "18:30" → 1110 (total minutes from midnight) */
const parseTimeMin = (timeStr = '00:00') => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

/** Total minutes → left-offset % on the day bar */
const toPercent = (minutes) =>
    ((minutes - DAY_START_MIN) / DAY_SPAN_MIN) * 100;

/** Total minutes → "HH:MM" display string */
const minToTimeStr = (min) => {
    const h = Math.floor(min / 60) % 24;
    const m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Room assignment — bar 1 = big room (up to 5), bar 2 = small room (up to 4).
 * Same rule as the server (isRoomAssignmentFeasible in bookingController):
 * overlapping groups alternate rooms along each chain of overlaps, and the
 * chain is oriented so its group of 5 lands in the big room. A chain without
 * a group of 5 starts in the big room. Groups of 6–8 are painted on both bars.
 */
const assignLanes = (dayBookings) => {
    const items = dayBookings
        .map((booking) => {
            const start = parseTimeMin(booking.timeSlot);
            return { booking, start, end: start + SESSION_MIN, p: booking.details?.participantsCount || 1 };
        })
        .sort((a, b) => a.start - b.start);

    const single   = items.filter((i) => i.p <= BIG_ROOM_MAX);
    const overlaps = (a, b) => a.start < b.end && b.start < a.end;
    const color    = new Map();

    for (const seed of single) {
        if (color.has(seed)) continue;
        color.set(seed, 0);
        const queue = [seed];
        const chain = [seed];
        while (queue.length) {
            const i = queue.shift();
            for (const j of single) {
                if (j !== i && overlaps(i, j) && !color.has(j)) {
                    color.set(j, 1 - color.get(i));
                    queue.push(j);
                    chain.push(j);
                }
            }
        }
        const groupOfFive = chain.find((i) => i.p > SMALL_ROOM_MAX);
        const bigColor = color.get(groupOfFive || seed); // seed = earliest in the chain
        chain.forEach((i) => { i.bar = color.get(i) === bigColor ? 1 : 2; });
    }

    return items.map((i) => ({ ...i.booking, _bar: i.p > BIG_ROOM_MAX ? 'both' : i.bar }));
};

// ─────────────────────────────────────────────────────────────────────────────
//  TooltipPortal
//  Rendered into document.body via createPortal so it escapes any
//  ancestor overflow:hidden (the form container has overflow:hidden).
// ─────────────────────────────────────────────────────────────────────────────
const TooltipPortal = ({ booking, anchorRect }) => {
    if (!anchorRect || typeof document === 'undefined') return null;

    const startMin = parseTimeMin(booking.timeSlot);
    const endTime  = minToTimeStr(startMin + SESSION_MIN);
    const pCount   = booking.details?.participantsCount ?? 0;
    const isLarge  = booking._bar === 'both';

    // Position the tooltip centred above the hovered booking block.
    // 8 px gap between tooltip bottom edge and block top edge.
    const style = {
        position: 'fixed',
        left:     anchorRect.left + anchorRect.width / 2,
        top:      anchorRect.top - 8,
        transform: 'translate(-50%, -100%)',
        zIndex:   9999,
        pointerEvents: 'none',
    };

    return createPortal(
        <div style={style}>
            <div className="bg-[#0a0310] border border-brand-primary/40 rounded-xl p-3 shadow-[0_0_24px_#a855f730] min-w-[160px] text-right">
                <p className="text-white font-bold text-sm mb-2 leading-tight">
                    {booking.customer?.fullName || 'לא ידוע'}
                </p>
                <div className="space-y-1">
                    <p className="text-gray-400 text-xs flex items-center justify-end gap-1">
                        <span>{booking.timeSlot} – {endTime}</span>
                        <Clock size={10} className="text-brand-primary flex-shrink-0" />
                    </p>
                    <p className="text-gray-400 text-xs flex items-center justify-end gap-1">
                        <span>{pCount} משתתפים</span>
                        <Users size={10} className="text-brand-primary flex-shrink-0" />
                    </p>
                    <p className="text-gray-400 text-xs">{ROOM_LABELS[booking._bar]}</p>
                    {isLarge && (
                        <p className="text-cyan-400 text-xs mt-1">★ קבוצה גדולה · 2 חדרים</p>
                    )}
                    <p className="text-brand-primary text-[10px] mt-1">לחצו לפרטים המלאים</p>
                </div>
            </div>
            {/* Arrow pointing down toward the bar */}
            <div
                className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full"
                style={{
                    width: 0, height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '6px solid rgba(168, 85, 247, 0.4)',
                }}
            />
        </div>,
        document.body
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  BookingDetailsModal — full booking details, opened by clicking a block
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_LABELS  = { pending: 'ממתין', confirmed: 'מאושר', cancelled: 'בוטל', completed: 'הושלם', 'no-show': 'לא הגיע' };
const SOURCE_LABELS  = { website: 'אתר', phone: 'טלפון', 'walk-in': 'הגיע במקום', whatsapp: 'וואטסאפ' };
const PAYMENT_LABELS = { paid: 'שולם', unpaid: 'לא שולם', failed: 'נכשל' };

const DetailRow = ({ icon: Icon, label, children }) => (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-white/5 last:border-0">
        <span className="flex items-center gap-2 text-gray-400 text-sm flex-shrink-0"><Icon size={14} className="text-brand-primary" /> {label}</span>
        <span className="text-white text-sm font-medium text-end break-all">{children}</span>
    </div>
);

const BookingDetailsModal = ({ booking, onClose, onEdit }) => {
    if (typeof document === 'undefined') return null;

    const startMin = parseTimeMin(booking.timeSlot);
    const phone    = booking.customer?.phone;
    const email    = booking.customer?.email;
    const world    = booking.roomId?.title?.he || booking.roomId?.title?.en;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir="rtl">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-[#1a0b2e] border border-white/10 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
                <button type="button" onClick={onClose} className="absolute top-4 left-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10">
                    <X size={18} />
                </button>

                <h3 className="text-xl font-bold text-white mb-1">{booking.customer?.fullName || 'לא ידוע'}</h3>
                <p className="text-sm text-gray-400 mb-4">
                    {STATUS_LABELS[booking.status] || booking.status}
                    {booking.source && <> · {SOURCE_LABELS[booking.source] || booking.source}</>}
                </p>

                <div className="bg-black/20 rounded-xl px-4 py-1 mb-5">
                    <DetailRow icon={Phone} label="טלפון">
                        {phone ? <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} dir="ltr" className="text-brand-primary hover:underline">{phone}</a> : '—'}
                    </DetailRow>
                    <DetailRow icon={Mail} label="אימייל">
                        {email ? <a href={`mailto:${email}`} dir="ltr" className="text-brand-primary hover:underline">{email}</a> : '—'}
                    </DetailRow>
                    <DetailRow icon={MapPin} label="עולם">{world || '—'}</DetailRow>
                    <DetailRow icon={MapPin} label="חדר">{ROOM_LABELS[booking._bar]}</DetailRow>
                    <DetailRow icon={Calendar} label="תאריך">{booking.date ? format(new Date(booking.date), 'dd/MM/yyyy') : '—'}</DetailRow>
                    <DetailRow icon={Clock} label="שעה"><span dir="ltr">{booking.timeSlot} – {minToTimeStr(startMin + SESSION_MIN)}</span></DetailRow>
                    <DetailRow icon={Users} label="משתתפים">{booking.details?.participantsCount ?? '—'}</DetailRow>
                    <DetailRow icon={CreditCard} label="מחיר">₪{booking.details?.totalPrice ?? 0}</DetailRow>
                    {booking.coupon?.code && (
                        <DetailRow icon={CreditCard} label="קופון">
                            <span dir="ltr">{booking.coupon.code}</span>
                            {booking.coupon.type === 'percent' && ` ${booking.coupon.value}%`}
                            {' '}(-₪{booking.coupon.discount}, במקום ₪{booking.coupon.originalPrice})
                            {booking.coupon.campaign && <span className="block text-xs text-gray-400">{booking.coupon.campaign}</span>}
                        </DetailRow>
                    )}
                    <DetailRow icon={CreditCard} label="תשלום">{PAYMENT_LABELS[booking.payment?.status] || 'לא שולם'}</DetailRow>
                    {booking.customer?.notes && <DetailRow icon={MessageSquare} label="הערות">{booking.customer.notes}</DetailRow>}
                    <DetailRow icon={Hash} label="מספר הזמנה"><span dir="ltr">{booking.bookingId || '—'}</span></DetailRow>
                    {booking.createdAt && (
                        <DetailRow icon={Calendar} label="נוצרה">{format(new Date(booking.createdAt), 'dd/MM/yyyy HH:mm')}</DetailRow>
                    )}
                </div>

                <div className="flex gap-3">
                    {onEdit && (
                        <button
                            type="button"
                            onClick={() => { onClose(); onEdit(booking); }}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-primary/20 border border-brand-primary/40 text-white font-bold hover:bg-brand-primary/30"
                        >
                            <Pencil size={16} /> עריכת הזמנה
                        </button>
                    )}
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5">
                        סגור
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  BookingBlock — a single coloured segment on a timeline bar
// ─────────────────────────────────────────────────────────────────────────────
const BookingBlock = ({ booking, onSelect }) => {
    const [anchorRect, setAnchorRect] = useState(null);

    const startMin = parseTimeMin(booking.timeSlot);
    const leftPct  = toPercent(startMin);
    const widthPct = (SESSION_MIN / DAY_SPAN_MIN) * 100;
    const isLarge  = booking._bar === 'both';

    // Purple for normal groups, cyan for large groups (matches brand palette)
    const blockCls = isLarge
        ? 'bg-cyan-500/70 border-cyan-400/40 hover:bg-cyan-500/90 hover:shadow-[0_0_8px_#06b6d480]'
        : 'bg-brand-primary/70 border-brand-primary/40 hover:bg-brand-primary/90 hover:shadow-[0_0_8px_#a855f780]';

    const handleMouseEnter = useCallback((e) => {
        setAnchorRect(e.currentTarget.getBoundingClientRect());
    }, []);

    const handleMouseLeave = useCallback(() => {
        setAnchorRect(null);
    }, []);

    return (
        <div
            className="absolute top-0 bottom-0"
            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => { setAnchorRect(null); onSelect(booking); }}
        >
            {/* Coloured booking block */}
            <div
                className={`
                    absolute inset-y-[3px] inset-x-[1px] rounded-md border cursor-pointer
                    transition-all duration-150 flex items-center justify-center overflow-hidden
                    ${blockCls}
                `}
            >
                {/* First name — only visible when block is wide enough */}
                <span className="text-white/90 text-[9px] font-semibold truncate px-1 select-none">
                    {booking.customer?.fullName?.split(' ')[0] ?? ''}
                </span>
            </div>

            {anchorRect && (
                <TooltipPortal booking={booking} anchorRect={anchorRect} />
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  TimelineBar — one horizontal track (Room 1 or Room 2)
// ─────────────────────────────────────────────────────────────────────────────
const TimelineBar = ({ label, bookings: barBookings, onSelect }) => (
    <div className="flex items-center gap-3">
        {/* Label */}
        <span className="text-gray-500 text-xs w-20 text-left flex-shrink-0 font-medium">
            {label}
        </span>

        {/* Bar track */}
        <div
            className="relative flex-1 h-8 rounded-lg border border-white/10 bg-white/[0.03]"
            style={{ overflow: 'visible' }}
        >
            {/* Hour tick-marks */}
            {HOUR_LABELS.map((hour) => (
                <div
                    key={hour}
                    className="absolute top-0 bottom-0 border-r border-white/5"
                    style={{ left: `${toPercent(hour * 60)}%` }}
                />
            ))}

            {/* Booking blocks */}
            {barBookings.map((booking) => (
                <BookingBlock key={booking._id} booking={booking} onSelect={onSelect} />
            ))}
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  DayTimelineLegend — colour legend (exported for the weekly calendar header)
// ─────────────────────────────────────────────────────────────────────────────
export const DayTimelineLegend = () => (
    <div className="flex items-center gap-4 text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-brand-primary/70 inline-block" />
            1–5 משתתפים (חדר אחד)
        </span>
        <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/70 inline-block" />
            6–8 משתתפים (שני החדרים)
        </span>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  DayTimeline — public component
//
//  Props:
//    bookings      — full bookings array already loaded in TabBookings (no extra fetch)
//    selectedDate  — JS Date from the form's date picker
//    onEditBooking — optional; shows an "edit" button in the details window
//    title         — optional header text (default: "תפוסה יומית — dd/MM/yyyy")
//    showLegend    — optional; false hides the colour legend (weekly calendar shows it once)
// ─────────────────────────────────────────────────────────────────────────────
const DayTimeline = ({ bookings = [], selectedDate, onEditBooking, title, showLegend = true }) => {
    const [detailsBooking, setDetailsBooking] = useState(null);

    // Filter to the selected date, excluding cancelled bookings
    const dayBookings = useMemo(() => {
        if (!selectedDate || !bookings.length) return [];
        const dateStr = format(new Date(selectedDate), 'yyyy-MM-dd');
        return bookings.filter((b) => {
            if (!b.date || b.status === 'cancelled') return false;
            try {
                return format(new Date(b.date), 'yyyy-MM-dd') === dateStr;
            } catch {
                return false;
            }
        });
    }, [bookings, selectedDate]);

    const assigned   = useMemo(() => assignLanes(dayBookings), [dayBookings]);
    const bar1       = assigned.filter((b) => b._bar === 1 || b._bar === 'both');
    const bar2       = assigned.filter((b) => b._bar === 2 || b._bar === 'both');
    const dateLabel  = selectedDate
        ? format(new Date(selectedDate), 'dd/MM/yyyy')
        : '—';

    return (
        <div className="bg-[#0a0310] border border-white/10 rounded-xl p-4 space-y-3">

            {/* ── Header ── */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wide">
                    {title || `תפוסה יומית — ${dateLabel}`}
                </p>
                {showLegend && <DayTimelineLegend />}
            </div>

            {/* ── Hour axis labels ── */}
            <div className="flex items-center gap-3">
                <div className="w-20 flex-shrink-0" /> {/* spacer aligns with bar labels */}
                <div className="relative flex-1 h-4">
                    {HOUR_LABELS.map((hour) => (
                        <span
                            key={hour}
                            className="absolute text-[10px] text-gray-600 -translate-x-1/2 select-none"
                            style={{ left: `${toPercent(hour * 60)}%` }}
                        >
                            {hour % 24}
                        </span>
                    ))}
                </div>
            </div>

            {/* ── Two parallel bars ── */}
            <TimelineBar label={ROOM_LABELS[1]} bookings={bar1} onSelect={setDetailsBooking} />
            <TimelineBar label={ROOM_LABELS[2]} bookings={bar2} onSelect={setDetailsBooking} />

            {/* ── Empty state ── */}
            {dayBookings.length === 0 && (
                <p className="text-center text-gray-600 text-[11px] pt-1">
                    אין הזמנות פעילות ביום זה
                </p>
            )}

            {detailsBooking && (
                <BookingDetailsModal
                    booking={detailsBooking}
                    onClose={() => setDetailsBooking(null)}
                    onEdit={onEditBooking}
                />
            )}
        </div>
    );
};

export default DayTimeline;
