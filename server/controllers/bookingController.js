'use strict';
const mongoose = require('mongoose');
const Booking     = require('../models/Booking');
const Room        = require('../models/Room');
const BlockedDate = require('../models/BlockedDate');
const SiteSettings = require('../models/SiteSettings');
const asyncHandler = require('../utils/asyncHandler');
const AppError     = require('../utils/AppError');
const { HebrewCalendar, Location } = require('@hebcal/core');
const { sendNewBookingAdminNotification, sendBookingConfirmationToCustomer } = require('../utils/emailService');

// ─────────────────────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────────────────────
const ISRAEL_TZ             = 'Asia/Jerusalem';
const TOTAL_STATIONS        = 2;    // Physical VR stations / rooms in the venue
const BOOKING_DURATION_MIN  = 75;   // Every session lasts exactly 75 minutes (1h 15m)
const BOOKING_DURATION_MS   = BOOKING_DURATION_MIN * 60 * 1000;
const SLOT_INTERVAL_MIN     = 15;   // Time-picker increments (every 15 minutes)
const LARGE_GROUP_THRESHOLD = 4;    // Groups > 4 require both physical stations
const MOTZASH_MIN_HOUR      = 19;   // Saturday: only slots starting at 19:00+

// Default operating window — used when a day has no entry in SiteSettings.weeklyHours.
const DEFAULT_OPEN  = '10:00';
const DEFAULT_CLOSE = '22:00';

// ─────────────────────────────────────────────────────────────────────────────
//  Private helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return a Date object whose local-time getters (.getHours() etc.) reflect
 * Israel time. Used only for getDay() / getHours() comparisons — never stored.
 */
const toIsraelDate = (date) =>
    new Date(date.toLocaleString('en-US', { timeZone: ISRAEL_TZ }));

/**
 * Return the calendar date visible in Israel as "YYYY-MM-DD".
 * sv-SE locale reliably produces ISO-formatted date strings.
 */
const toIsraelDateStr = (date) =>
    new Intl.DateTimeFormat('sv-SE', { timeZone: ISRAEL_TZ }).format(date);

/**
 * Convert an Israel-timezone calendar date + "HH:MM" wall-clock string → UTC Date.
 *
 * Algorithm (same DST-safe approach used in migrate.js):
 *   1. Build UTC midnight for the Israel calendar date.
 *   2. Measure Israel's UTC offset at that midnight (UTC+2 winter / UTC+3 summer).
 *   3. UTC slot time = Israel slot time − offset.
 *   setUTCMinutes() handles underflow (e.g. negative values) by rolling the day back.
 */
const israelTimeToUTC = (israelDateStr, timeStr) => {
    const [h, m]      = timeStr.split(':').map(Number);
    const utcMidnight = new Date(israelDateStr + 'T00:00:00Z');

    // "02:00" in winter (UTC+2) or "03:00" in summer (UTC+3)
    const israelHour = parseInt(
        new Intl.DateTimeFormat('en-US', {
            timeZone: ISRAEL_TZ, hour: '2-digit', minute: '2-digit', hour12: false,
        }).format(utcMidnight).split(':')[0],
        10
    );

    const utcMinutes = h * 60 + m - israelHour * 60;
    const result = new Date(utcMidnight);
    result.setUTCMinutes(utcMinutes); // setUTCMinutes handles overflow/underflow
    return result;
};

/** Parse "HH:MM" → total minutes from midnight. */
const parseMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

/** Convert total minutes from midnight → "HH:MM". */
const minutesToTimeStr = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Generate every 15-minute slot string from `openStr` through `closeStr` (inclusive).
 *
 * `open`  = first slot start time.
 * `close` = last  slot start time — a session starting here ends at close + 75 min.
 *
 * Example: open="10:00", close="22:00" → ["10:00","10:15", … ,"22:00"] (49 slots)
 */
const generateIntervals = (openStr = DEFAULT_OPEN, closeStr = DEFAULT_CLOSE) => {
    const openMin  = parseMinutes(openStr);
    const closeMin = parseMinutes(closeStr);
    const slots    = [];
    for (let t = openMin; t <= closeMin; t += SLOT_INTERVAL_MIN) {
        slots.push(minutesToTimeStr(t));
    }
    return slots;
};

/**
 * Return true if `jsDate` falls on a Jewish holiday (CHAG — no-work day).
 * Fails open (returns false) on any calendar library error so we never
 * accidentally block the entire day due to a library glitch.
 */
const isJewishHoliday = (jsDate) => {
    try {
        const events = HebrewCalendar.calendar({
            start: jsDate, end: jsDate,
            isHebrewYear: false, candlelighting: false,
            location: Location.lookup('Jerusalem'),
            il: true, sedrot: false, omer: false,
        });
        return events.some(ev => (ev.getFlags() & 32) !== 0); // 32 = CHAG flag
    } catch (e) {
        console.error('Hebcal error:', e);
        return false;
    }
};

/**
 * Ensure a booking has `startTime` and `endTime` properties for the overlap query.
 *
 * v2 documents → already have them, return as-is.
 * v1 documents → have only `timeSlot`; reconstruct UTC datetimes on the fly.
 *                This handles the period between Phase 1 deploy and migrate.js run.
 * Returns null if neither field is present (document can't be scheduled — skip it).
 */
const normalizeBookingTimes = (booking, israelDateStr) => {
    if (booking.startTime && booking.endTime) return booking;
    if (booking.timeSlot) {
        const startTime = israelTimeToUTC(israelDateStr, booking.timeSlot);
        const endTime   = new Date(startTime.getTime() + BOOKING_DURATION_MS);
        return { ...booking, startTime, endTime };
    }
    return null;
};

/**
 * Count total physical station slots consumed by bookings overlapping [start, end).
 *
 * Classic interval-overlap condition: existing.start < newEnd AND existing.end > newStart
 *
 * We use SUM of roomIds.length — NOT Set cardinality — so that two simultaneous
 * small-group bookings that happen to carry the same experience Room ID are
 * still counted as 2 distinct station slots.
 *
 * v1 documents without roomIds default to 1 station each (safe assumption).
 */
const countStationsUsed = (normalizedBookings, windowStart, windowEnd) =>
    normalizedBookings
        .filter(b => b.startTime < windowEnd && b.endTime > windowStart)
        .reduce((total, b) => total + (b.roomIds?.length || 1), 0);

/**
 * Return true if a MongoServerError means the driver is connected to a
 * standalone node that does not support multi-document transactions.
 *
 * MongoDB error code 20 / codeName "IllegalOperation" is returned when you
 * attempt to use a transaction on a non-replica-set member.
 */
const isTransactionUnsupported = (err) =>
    err.code === 20 ||
    err.message?.includes('Transaction numbers are only allowed');

// ─────────────────────────────────────────────────────────────────────────────
//  _reserveBooking  (private — not exported)
//
//  Core availability re-check + document creation.
//  Called inside a MongoDB transaction when supported, or bare when falling back.
//
//  Throws AppError(409) if the window is no longer free when we arrive here,
//  which is the intended race-condition guard.
// ─────────────────────────────────────────────────────────────────────────────
async function _reserveBooking({
    session,           // mongoose ClientSession or null (fallback mode)
    startTime,         // UTC Date — booking window start
    endTime,           // UTC Date — booking window end (startTime + 75 min)
    startOfDay,        // UTC Date — midnight of the booking date
    endOfDay,          // UTC Date — end of booking date
    israelDateStr,     // "YYYY-MM-DD" in Israel TZ
    stationsNeeded,    // 1 (small group) or 2 (large group)
    allRooms,          // Array of { _id } — all active Room documents
    experienceRoomId,  // ObjectId or null — the chosen experience/theme
    pCount,            // Number — participant count
    date,              // raw date string from request body
    timeSlot,          // "HH:MM" display string
    customer,          // customer sub-document
    source,            // booking source string
    finalPrice,        // calculated price
}) {
    const queryOpts = session ? { session } : {};

    // ── Re-validate availability (atomic read inside the transaction) ──────────
    //
    // Single day-range query catches BOTH:
    //   • v2 documents (have startTime/endTime indexed)
    //   • v1 documents (only have timeSlot — normalized in memory below)
    //
    // This is intentionally conservative: we fetch the whole day, then filter
    // the 60-minute window in memory. After migrate.js has run we can tighten
    // this to a startTime/endTime range query alone.
    const dayBookings = await Booking.find(
        {
            date:      { $gte: startOfDay, $lte: endOfDay },
            status:    { $ne: 'cancelled' },
            isDeleted: { $ne: true },
        },
        null,
        queryOpts
    ).lean();

    const normalised = dayBookings
        .map(b => normalizeBookingTimes(b, israelDateStr))
        .filter(Boolean);

    const stationsUsed = countStationsUsed(normalised, startTime, endTime);

    if (TOTAL_STATIONS - stationsUsed < stationsNeeded) {
        throw new AppError(
            stationsNeeded === 2
                ? 'Not enough rooms available for a large group at this time'
                : 'Slot is no longer available',
            409
        );
    }

    // ── Assign physical station IDs ────────────────────────────────────────────
    //
    // Build the set of room IDs already committed to the overlapping window,
    // then pick free ones for this booking. Using Set<string> for O(1) lookup.
    const roomIdsInUse = new Set(
        normalised
            .filter(b => b.startTime < endTime && b.endTime > startTime)
            .flatMap(b => (b.roomIds || []).map(id => id.toString()))
    );

    const freeRoomIds = allRooms
        .map(r => r._id)
        .filter(id => !roomIdsInUse.has(id.toString()));

    // Slice exactly `stationsNeeded` IDs.
    // For small groups: freeRoomIds[0] is guaranteed (we verified stationsUsed < 2).
    // For large groups: stationsUsed must be 0, so freeRoomIds = all allRooms.
    const assignedRoomIds = freeRoomIds.slice(0, stationsNeeded);

    // ── Persist ────────────────────────────────────────────────────────────────
    const doc = new Booking({
        // Keep `roomId` (deprecated) populated so existing admin-panel code that
        // does .populate('roomId', 'title') continues to work without changes.
        roomId:  experienceRoomId || assignedRoomIds[0],
        roomIds: assignedRoomIds,
        date:    new Date(date),
        timeSlot,
        startTime,
        endTime,
        customer,
        details: { participantsCount: pCount, totalPrice: finalPrice },
        source:  source || 'website',
    });
    await doc.save(queryOpts);

    return doc;
}

// ─────────────────────────────────────────────────────────────────────────────
//  getAvailableSlots
// ─────────────────────────────────────────────────────────────────────────────
exports.getAvailableSlots = asyncHandler(async (req, res, next) => {
    const { date, participantsCount, admin } = req.query;
    const isAdmin = admin === 'true';
    const pCount  = parseInt(participantsCount, 10) || 1;

    if (!date) {
        return next(new AppError('Please provide date', 400));
    }
    if (pCount < 1 || pCount > 8) {
        return next(new AppError('participantsCount must be between 1 and 8', 400));
    }

    // ── 1. Calendar context ──────────────────────────────────────────────────
    const requestedDate = new Date(date);
    const israelDate    = toIsraelDate(requestedDate);
    const israelDateStr = toIsraelDateStr(requestedDate); // "YYYY-MM-DD"
    const dayOfWeek     = israelDate.getDay();            // 0 Sun … 6 Sat
    const isSaturday    = dayOfWeek === 6;

    // ── 2. Day-level gates (cheap — return early, no more DB calls) ──────────
    if (!isAdmin && dayOfWeek === 5) {
        return res.json({ status: 'success', data: [], reason: 'friday' });
    }
    if (!isAdmin && isJewishHoliday(requestedDate)) {
        return res.json({ status: 'success', data: [], reason: 'holiday' });
    }

    // ── 3. Admin-blocked dates ───────────────────────────────────────────────
    // Use the Israel calendar date boundaries (UTC-anchored) for the query
    // so the server's local timezone never affects the lookup.
    const startOfDay = new Date(israelDateStr + 'T00:00:00Z');
    const endOfDay   = new Date(israelDateStr + 'T23:59:59.999Z');

    let blockedRecord = null;
    try {
        blockedRecord = await BlockedDate.findOne({
            date: { $gte: startOfDay, $lte: endOfDay },
        }).lean();
    } catch (_) { /* collection may not exist on a fresh install */ }

    if (!isAdmin && blockedRecord?.isFullDay) {
        return res.json({ status: 'success', data: [], reason: 'admin_blocked' });
    }

    // ── 4. Load allowed slots for this day ───────────────────────────────────
    let candidates;

    try {
        const settings = await SiteSettings.findOne().lean();
        // .lean() returns the Map as a plain object — access by string key directly.
        const dayCfg = settings?.booking?.weeklyHours?.[String(dayOfWeek)];

        if (Array.isArray(dayCfg) && dayCfg.length > 0) {
            // Primary format: admin-defined array of "HH:MM" slot strings.
            candidates = [...dayCfg].sort();
        } else if (dayCfg && dayCfg.open && dayCfg.close) {
            // Backwards-compat: legacy { open, close } objects still in DB.
            candidates = generateIntervals(dayCfg.open, dayCfg.close);
        } else {
            // No config for this day → 15-min grid from DEFAULT_OPEN to DEFAULT_CLOSE.
            candidates = generateIntervals(DEFAULT_OPEN, DEFAULT_CLOSE);
        }
    } catch (err) {
        console.error('Error fetching SiteSettings:', err);
        candidates = generateIntervals(DEFAULT_OPEN, DEFAULT_CLOSE);
    }

    // ── 5. Cheap in-memory filters (no extra DB calls needed) ────────────────

    // 5a. Past-time filter — only for today, non-admin
    if (!isAdmin) {
        const israelNowStr = toIsraelDateStr(new Date());
        if (israelNowStr === israelDateStr) {
            const israelNow = toIsraelDate(new Date());
            const nowMins   = israelNow.getHours() * 60 + israelNow.getMinutes();
            // A slot is "past" if its start time ≤ now. Keep only future slots.
            candidates = candidates.filter(s => parseMinutes(s) > nowMins);
        }
    }

    // 5b. Admin partial-block slots
    if (blockedRecord?.blockedSlots?.length > 0) {
        const blocked = new Set(blockedRecord.blockedSlots);
        candidates = candidates.filter(s => !blocked.has(s));
    }

    // Short-circuit — no point running a DB query for an empty list
    if (candidates.length === 0) {
        return res.json({ status: 'success', data: [] });
    }

    // ── 6. ONE DB query: all active bookings for this day ────────────────────
    //
    // We deliberately fetch ALL bookings (any experience/roomId) because the
    // two physical stations are a shared pool. A booking for any experience
    // consumes a station and reduces capacity for everyone else.
    const dayBookings = await Booking.find({
        date:      { $gte: startOfDay, $lte: endOfDay },
        status:    { $ne: 'cancelled' },
        isDeleted: { $ne: true },
    }).lean();

    // Normalise: ensure every booking exposes startTime/endTime for the
    // overlap check (reconstructs from timeSlot for old v1 documents).
    const normalised = dayBookings
        .map(b => normalizeBookingTimes(b, israelDateStr))
        .filter(Boolean);

    // ── 7. Per-slot availability (in-memory, O(candidates × bookings)) ───────
    //
    // Stations needed:
    //   1–4 participants → 1 station  (needs at least 1 of 2 free)
    //   5–8 participants → 2 stations (needs both free)
    const stationsNeeded = pCount > LARGE_GROUP_THRESHOLD ? 2 : 1;

    candidates = candidates.filter(slotStr => {
        const windowStart = israelTimeToUTC(israelDateStr, slotStr);
        const windowEnd   = new Date(windowStart.getTime() + BOOKING_DURATION_MS);
        const used        = countStationsUsed(normalised, windowStart, windowEnd);
        return (TOTAL_STATIONS - used) >= stationsNeeded;
    });

    // ── 8. Saturday (Motzash) evening-only filter ─────────────────────────────
    // Applied last because it depends on nothing else and rarely fires.
    if (!isAdmin && isSaturday) {
        candidates = candidates.filter(
            s => parseMinutes(s) >= MOTZASH_MIN_HOUR * 60
        );
    }

    res.json({ status: 'success', data: candidates });
});

// ─────────────────────────────────────────────────────────────────────────────
//  createBooking
// ─────────────────────────────────────────────────────────────────────────────
exports.createBooking = asyncHandler(async (req, res, next) => {
    const {
        date, timeSlot, participantsCount,
        customer, source, totalPrice,
        roomId, // optional — the chosen experience/theme Room
    } = req.body;

    if (!date || !timeSlot || !participantsCount || !customer) {
        return next(new AppError('date, timeSlot, participantsCount, and customer are required', 400));
    }

    const pCount = parseInt(participantsCount, 10);
    if (isNaN(pCount) || pCount < 1 || pCount > 8) {
        return next(new AppError('participantsCount must be between 1 and 8', 400));
    }

    // ── Build time window ────────────────────────────────────────────────────
    const israelDateStr = toIsraelDateStr(new Date(date));
    const startTime     = israelTimeToUTC(israelDateStr, timeSlot);
    const endTime       = new Date(startTime.getTime() + BOOKING_DURATION_MS);
    const startOfDay    = new Date(israelDateStr + 'T00:00:00Z');
    const endOfDay      = new Date(israelDateStr + 'T23:59:59.999Z');
    const stationsNeeded = pCount > LARGE_GROUP_THRESHOLD ? 2 : 1;

    // ── Load experience room for price calculation + email content ────────────
    const experienceRoomId = roomId || null;
    const room = experienceRoomId ? await Room.findById(experienceRoomId) : null;

    let finalPrice = totalPrice;
    if (!finalPrice && room) {
        const pKey = pCount.toString();
        const override = room.pricing.overrides?.get?.(pKey);
        finalPrice = override !== undefined
            ? override
            : room.pricing.basePrice + pCount * (room.pricing.personPenalty ?? 0);
    }
    if (!finalPrice) finalPrice = 0;

    // ── Fetch all active Room IDs (station pool) ─────────────────────────────
    const allRooms = await Room.find({ isActive: true }, '_id').lean();
    if (allRooms.length < TOTAL_STATIONS) {
        return next(new AppError(
            `System requires at least ${TOTAL_STATIONS} active rooms — only ${allRooms.length} found.`,
            503
        ));
    }

    // ── Shared payload for _reserveBooking ───────────────────────────────────
    const reserveArgs = {
        startTime, endTime, startOfDay, endOfDay,
        israelDateStr, stationsNeeded, allRooms,
        experienceRoomId, pCount,
        date, timeSlot, customer, source, finalPrice,
    };

    // ─────────────────────────────────────────────────────────────────────────
    //  Transaction attempt
    //
    //  MongoDB transactions require the server to be running as a replica set.
    //  We try the transactional path first. If the driver reports that the
    //  environment doesn't support transactions (code 20 / standalone node),
    //  we fall back to a sequential check-then-insert.
    //
    //  Fallback caveat: the sequential path has a sub-millisecond race window.
    //  For production, run MongoDB as a replica set (even a single-node rs).
    // ─────────────────────────────────────────────────────────────────────────
    let newBooking;
    let session = null;

    try {
        session = await mongoose.startSession();
        session.startTransaction();

        newBooking = await _reserveBooking({ ...reserveArgs, session });

        await session.commitTransaction();

    } catch (err) {
        // Always attempt to abort so the session isn't left open
        if (session) {
            try { await session.abortTransaction(); } catch (_) {}
        }

        if (isTransactionUnsupported(err)) {
            // ── Graceful fallback ─────────────────────────────────────────────
            console.warn(
                '[createBooking] MongoDB transactions not supported on this node ' +
                '(standalone deployment). Falling back to sequential check-then-insert.\n' +
                'For full race-condition protection, configure a replica set.'
            );
            try {
                // _reserveBooking with session=null performs the same availability
                // check and insert, just without transaction isolation.
                newBooking = await _reserveBooking({ ...reserveArgs, session: null });
            } catch (fallbackErr) {
                return next(fallbackErr); // could be AppError(409) or system error
            }

        } else if (err instanceof AppError) {
            // Clean domain error (e.g. 409 slot taken) — pass straight to client
            return next(err);

        } else {
            // Unexpected database / network error
            console.error('[createBooking] Unexpected error during transaction:', err);
            return next(new AppError('Booking could not be completed. Please try again.', 500));
        }

    } finally {
        if (session) session.endSession();
    }

    // ── Async emails (do not block the response) ─────────────────────────────
    const roomName  = room?.title?.he || room?.title?.en || 'חדר בריחה';
    const roomImage = room?.images?.main || null;
    sendNewBookingAdminNotification(newBooking, roomName, roomImage)
        .catch(err => console.error('[createBooking] Admin email error:', err));
    sendBookingConfirmationToCustomer(newBooking, roomName, roomImage)
        .catch(err => console.error('[createBooking] Customer email error:', err));

    res.status(201).json({ status: 'success', data: newBooking });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Admin CRUD — unchanged logic, updated populate() calls
// ─────────────────────────────────────────────────────────────────────────────

// קבלת כל ההזמנות (לא כולל מחוקות)
exports.getAllBookings = asyncHandler(async (_req, res, _next) => {
    const bookings = await Booking.find({ isDeleted: { $ne: true } })
        // populate both fields: roomId (deprecated, still set on new bookings for compat)
        // and roomIds (the new array). Admin panel can use either.
        .populate('roomId',  'title')
        .populate('roomIds', 'title')
        .sort({ date: -1, timeSlot: 1 });

    res.status(200).json({ status: 'success', results: bookings.length, data: bookings });
});

// עדכון הזמנה קיימת
exports.updateBooking = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { roomId, date, timeSlot, customer, participantsCount, totalPrice, status } = req.body;

    // ── 1. Load & guard ───────────────────────────────────────────────────────
    const existing = await Booking.findById(id);
    if (!existing)          return next(new AppError('Booking not found', 404));
    if (existing.isDeleted) return next(new AppError('Cannot edit a deleted booking', 400));

    // ── 2. Resolve effective values ───────────────────────────────────────────
    const newDate     = date             ? new Date(date)              : existing.date;
    const newTimeSlot = timeSlot         || existing.timeSlot;
    const newPCount   = participantsCount
        ? parseInt(participantsCount, 10)
        : existing.details.participantsCount;

    if (isNaN(newPCount) || newPCount < 1 || newPCount > 8) {
        return next(new AppError('participantsCount must be between 1 and 8', 400));
    }

    // ── 3. Detect schedule-affecting changes ──────────────────────────────────
    const dateChanged   = !!date             && newDate.toDateString()  !== existing.date.toDateString();
    const slotChanged   = !!timeSlot         && timeSlot                !== existing.timeSlot;
    const pCountChanged = !!participantsCount && newPCount              !== existing.details.participantsCount;
    const scheduleChanged = dateChanged || slotChanged || pCountChanged;

    const updateData = {};

    // ── 4. Re-validate availability + re-assign stations when needed ──────────
    //
    // Any change to date, time, or participant count can alter how many physical
    // stations are required or which window they occupy. We re-run the full
    // station-counting check (same algorithm as createBooking) while excluding
    // the booking being edited so it doesn't count against itself.
    if (scheduleChanged) {
        const israelDateStr  = toIsraelDateStr(newDate);
        const newStartTime   = israelTimeToUTC(israelDateStr, newTimeSlot);
        const newEndTime     = new Date(newStartTime.getTime() + BOOKING_DURATION_MS);
        const stationsNeeded = newPCount > LARGE_GROUP_THRESHOLD ? 2 : 1;

        const startOfDay = new Date(israelDateStr + 'T00:00:00Z');
        const endOfDay   = new Date(israelDateStr + 'T23:59:59.999Z');

        // Fetch the day's bookings excluding self
        const dayBookings = await Booking.find({
            _id:       { $ne: id },
            date:      { $gte: startOfDay, $lte: endOfDay },
            status:    { $ne: 'cancelled' },
            isDeleted: { $ne: true },
        }).lean();

        const normalised   = dayBookings
            .map(b => normalizeBookingTimes(b, israelDateStr))
            .filter(Boolean);
        const stationsUsed = countStationsUsed(normalised, newStartTime, newEndTime);

        if (TOTAL_STATIONS - stationsUsed < stationsNeeded) {
            return next(new AppError(
                stationsNeeded === 2
                    ? 'Not enough rooms available for a large group at this time'
                    : 'Slot is no longer available',
                409
            ));
        }

        // Re-assign physical station IDs from the shared pool
        const allRooms = await Room.find({ isActive: true }, '_id').lean();
        const roomIdsInUse = new Set(
            normalised
                .filter(b => b.startTime < newEndTime && b.endTime > newStartTime)
                .flatMap(b => (b.roomIds || []).map(rid => rid.toString()))
        );
        const assignedRoomIds = allRooms
            .map(r => r._id)
            .filter(id => !roomIdsInUse.has(id.toString()))
            .slice(0, stationsNeeded);

        updateData.startTime = newStartTime;
        updateData.endTime   = newEndTime;
        updateData.roomIds   = assignedRoomIds;
        // Keep deprecated roomId in sync: prefer the chosen experience room, fall back to station 0
        updateData.roomId    = roomId || existing.primaryRoomId || assignedRoomIds[0];
    }

    // ── 5. Simple field updates ───────────────────────────────────────────────
    if (date)     updateData.date     = newDate;
    if (timeSlot) updateData.timeSlot = newTimeSlot;
    // roomId here is the experience/theme room (not a physical station) — only
    // update the deprecated field when no schedule change already handled it.
    if (roomId && !scheduleChanged) updateData.roomId = roomId;
    if (status)   updateData.status   = status;

    if (customer) {
        updateData.customer = {
            ...(existing.customer.toObject?.() ?? existing.customer),
            ...customer,
        };
    }

    if (participantsCount || totalPrice) {
        updateData.details = {
            ...(existing.details.toObject?.() ?? existing.details),
            ...(participantsCount && { participantsCount: newPCount }),
            ...(totalPrice        && { totalPrice }),
        };
    }

    // ── 6. Persist & respond ──────────────────────────────────────────────────
    const updatedBooking = await Booking.findByIdAndUpdate(id, updateData, {
        new: true, runValidators: true,
    })
        .populate('roomId',  'title')
        .populate('roomIds', 'title');

    res.status(200).json({ status: 'success', data: updatedBooking });
});

// מחיקה רכה (soft delete)
exports.deleteBooking = asyncHandler(async (req, res, next) => {
    const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
    );
    if (!booking) {
        return next(new AppError('Booking not found', 404));
    }
    res.status(200).json({ status: 'success', data: null });
});

// ─── Trash management ─────────────────────────────────────────────────────────

exports.getDeletedBookings = asyncHandler(async (_req, res, _next) => {
    const bookings = await Booking.find({ isDeleted: true })
        .populate('roomId',  'title')
        .populate('roomIds', 'title')
        .sort({ deletedAt: -1 });
    res.status(200).json({ status: 'success', results: bookings.length, data: bookings });
});

exports.restoreBooking = asyncHandler(async (req, res, next) => {
    const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        { isDeleted: false, deletedAt: null },
        { new: true }
    )
        .populate('roomId',  'title')
        .populate('roomIds', 'title');

    if (!booking) {
        return next(new AppError('Booking not found', 404));
    }
    res.status(200).json({ status: 'success', data: booking });
});

exports.permanentDeleteBooking = asyncHandler(async (req, res, next) => {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
        return next(new AppError('Booking not found', 404));
    }
    res.status(204).json({ status: 'success', data: null });
});

exports.emptyTrash = asyncHandler(async (_req, res, _next) => {
    const result = await Booking.deleteMany({ isDeleted: true });
    res.status(200).json({
        status: 'success',
        message: `${result.deletedCount} bookings permanently deleted`,
    });
});

// ─── Admin blocked-date management ───────────────────────────────────────────

exports.blockDate = asyncHandler(async (req, res, _next) => {
    const { date, reason, isFullDay, blockedSlots } = req.body;
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const block = await BlockedDate.findOneAndUpdate(
        { date: dateObj },
        { reason, isFullDay, blockedSlots },
        { new: true, upsert: true }
    );
    res.status(200).json({ status: 'success', data: block });
});

exports.getBlockedDates = asyncHandler(async (_req, res, _next) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const blocks = await BlockedDate.find({ date: { $gte: today } }).sort({ date: 1 });
    res.status(200).json({ status: 'success', data: blocks });
});

exports.removeBlock = asyncHandler(async (req, res, _next) => {
    await BlockedDate.findByIdAndDelete(req.params.id);
    res.status(204).json({ status: 'success', data: null });
});
