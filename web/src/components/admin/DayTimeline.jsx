'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { Users, Clock } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────────────────────
const DAY_START_MIN = 10 * 60; // 10:00
const DAY_END_MIN   = 22 * 60; // 22:00
const DAY_SPAN_MIN  = DAY_END_MIN - DAY_START_MIN; // 720 min = 100%
const SESSION_MIN   = 60;
const HOUR_LABELS   = Array.from({ length: 13 }, (_, i) => i + 10); // [10…22]

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
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Greedy lane assignment — places each booking in bar 1 or bar 2.
 * Large-group bookings (roomIds.length >= 2) are painted on both bars.
 * Bookings are processed in chronological order.
 */
const assignLanes = (dayBookings) => {
    const sorted = [...dayBookings].sort(
        (a, b) => parseTimeMin(a.timeSlot) - parseTimeMin(b.timeSlot)
    );

    let bar1EndMin = 0;
    let bar2EndMin = 0;

    return sorted.map((booking) => {
        const startMin     = parseTimeMin(booking.timeSlot);
        const endMin       = startMin + SESSION_MIN;
        const stationsUsed = booking.roomIds?.length || 1;

        if (stationsUsed >= 2) {
            // Large group — occupies both physical stations simultaneously
            bar1EndMin = endMin;
            bar2EndMin = endMin;
            return { ...booking, _bar: 'both' };
        }
        if (startMin >= bar1EndMin) {
            bar1EndMin = endMin;
            return { ...booking, _bar: 1 };
        }
        if (startMin >= bar2EndMin) {
            bar2EndMin = endMin;
            return { ...booking, _bar: 2 };
        }
        // Both bars full — data inconsistency, show on bar 1 as fallback
        return { ...booking, _bar: 1 };
    });
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
    const isLarge  = (booking.roomIds?.length || 1) >= 2;

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
                    {isLarge && (
                        <p className="text-cyan-400 text-xs mt-1">★ קבוצה גדולה · 2 חדרים</p>
                    )}
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
//  BookingBlock — a single coloured segment on a timeline bar
// ─────────────────────────────────────────────────────────────────────────────
const BookingBlock = ({ booking }) => {
    const [anchorRect, setAnchorRect] = useState(null);

    const startMin = parseTimeMin(booking.timeSlot);
    const leftPct  = toPercent(startMin);
    const widthPct = (SESSION_MIN / DAY_SPAN_MIN) * 100;
    const isLarge  = (booking.roomIds?.length || 1) >= 2;

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
const TimelineBar = ({ label, bookings: barBookings }) => (
    <div className="flex items-center gap-3">
        {/* Label */}
        <span className="text-gray-500 text-xs w-12 text-left flex-shrink-0 font-medium">
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
                <BookingBlock key={booking._id} booking={booking} />
            ))}
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  DayTimeline — public component
//
//  Props:
//    bookings     — full bookings array already loaded in TabBookings (no extra fetch)
//    selectedDate — JS Date from the form's date picker
// ─────────────────────────────────────────────────────────────────────────────
const DayTimeline = ({ bookings = [], selectedDate }) => {
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
                    תפוסה יומית — {dateLabel}
                </p>
                <div className="flex items-center gap-4 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-brand-primary/70 inline-block" />
                        1–4 משתתפים
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/70 inline-block" />
                        5–8 משתתפים
                    </span>
                </div>
            </div>

            {/* ── Hour axis labels ── */}
            <div className="flex items-center gap-3">
                <div className="w-12 flex-shrink-0" /> {/* spacer aligns with bar labels */}
                <div className="relative flex-1 h-4">
                    {HOUR_LABELS.map((hour) => (
                        <span
                            key={hour}
                            className="absolute text-[10px] text-gray-600 -translate-x-1/2 select-none"
                            style={{ left: `${toPercent(hour * 60)}%` }}
                        >
                            {hour}
                        </span>
                    ))}
                </div>
            </div>

            {/* ── Two parallel bars ── */}
            <TimelineBar label="חדר 1" bookings={bar1} />
            <TimelineBar label="חדר 2" bookings={bar2} />

            {/* ── Empty state ── */}
            {dayBookings.length === 0 && (
                <p className="text-center text-gray-600 text-[11px] pt-1">
                    אין הזמנות פעילות ביום זה
                </p>
            )}
        </div>
    );
};

export default DayTimeline;
