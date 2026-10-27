'use strict';
const mongoose = require('mongoose');
const Booking     = require('../models/Booking');
const Room        = require('../models/Room');
const BlockedDate = require('../models/BlockedDate');
const SiteSettings = require('../models/SiteSettings');
const PricingPlan  = require('../models/PricingPlan');
const asyncHandler = require('../utils/asyncHandler');
const AppError     = require('../utils/AppError');
const { getDayHoursKey, resolveDayRange } = require('../utils/openingHours');
const { calcTotalPrice } = require('../utils/pricing');
const { sendNewBookingAdminNotification, sendBookingConfirmationToCustomer } = require('../utils/emailService');

// ─────────────────────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────────────────────
const ISRAEL_TZ             = 'Asia/Jerusalem';
const TOTAL_STATIONS        = 2;    // Physical VR rooms in the venue
const TOTAL_HEADSETS        = 8;    // VR headsets shared by both rooms at any moment
const BOOKING_DURATION_MIN  = 75;   // A room is occupied 75 minutes per session (1h 15m)
const BOOKING_DURATION_MS   = BOOKING_DURATION_MIN * 60 * 1000;
const SLOT_INTERVAL_MIN     = 15;   // Time-picker increments (every 15 minutes)
const LARGE_GROUP_THRESHOLD = 5;    // Max players in the big room — larger groups split across both rooms
const SMALL_ROOM_MAX        = 4;    // The second room holds up to 4 — a group of 5 must get the big room
const MIN_START_GAP_MIN     = 15;   // Different groups never start within 15 min (private briefing)
const MIN_START_GAP_MS      = MIN_START_GAP_MIN * 60 * 1000;

// Fallback window for admin bookings on a closed day.
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
 * Generate every 15-minute slot string from `openMin` through `closeMin` (inclusive).
 *
 * `open`  = first slot start time.
 * `close` = last  slot start time — a session starting here ends at close + 75 min.
 * Minutes past midnight produce "24:00", "24:15"… so the slot stays on the same
 * business day (israelTimeToUTC rolls it over to the next calendar day).
 *
 * Example: 10:00 → 22:00 → ["10:00","10:15", … ,"22:00"] (49 slots)
 */
const generateIntervals = (openMin, closeMin) => {
    const slots = [];
    for (let t = openMin; t <= closeMin; t += SLOT_INTERVAL_MIN) {
        slots.push(minutesToTimeStr(t));
    }
    return slots;
};

/** Rooms a group occupies: up to 5 players → 1 room, 6–8 → both rooms. */
const stationsFor = (participantsCount) =>
    participantsCount > LARGE_GROUP_THRESHOLD ? 2 : 1;

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
 * Peak rooms and headsets in use by existing bookings at any moment inside [start, end).
 *
 * Usage only changes when a booking starts, so it is enough to sample the window
 * start and every booking start inside the window. This is exact (unlike summing
 * every overlapping booking): two back-to-back groups in the same room never
 * count against each other.
 *
 * Rooms per booking come from its participant count (stationsFor), not from the
 * stored roomIds, so older bookings follow the current room rules too.
 */
const getPeakUsage = (normalizedBookings, windowStart, windowEnd) => {
    const overlapping = normalizedBookings.filter(
        b => b.startTime < windowEnd && b.endTime > windowStart
    );
    const samplePoints = [
        windowStart,
        ...overlapping.map(b => b.startTime).filter(t => t > windowStart),
    ];

    let stations = 0;
    let headsets = 0;
    for (const t of samplePoints) {
        const active = overlapping.filter(b => b.startTime <= t && b.endTime > t);
        const pCounts = active.map(b => b.details?.participantsCount || 1);
        stations = Math.max(stations, pCounts.reduce((sum, p) => sum + stationsFor(p), 0));
        headsets = Math.max(headsets, pCounts.reduce((sum, p) => sum + p, 0));
    }
    return { stations, headsets };
};

/**
 * Can the day's single-room groups (1–5 players) be split between the big room
 * and the small room so that no two overlapping groups share a room and every
 * group of 5 is in the big room?
 *
 * Groups that overlap must be in different rooms, so each chain of overlapping
 * groups alternates big/small — a 2-colouring of the overlap graph (it is always
 * 2-colourable while at most 2 groups overlap, which getPeakUsage enforces).
 * Inside a chain the colouring is fixed up to swapping the rooms, so it works
 * iff all groups of 5 in the chain land on the same colour.
 * Groups of 6–8 use both rooms and never overlap anyone, so they are skipped.
 */
const isRoomAssignmentFeasible = (bookings) => {
    const items = bookings.filter(b => (b.details?.participantsCount || 1) <= LARGE_GROUP_THRESHOLD);
    const overlaps = (a, b) => a.startTime < b.endTime && b.startTime < a.endTime;
    const color = new Array(items.length).fill(null);

    for (let seed = 0; seed < items.length; seed++) {
        if (color[seed] !== null) continue;
        color[seed] = 0;
        const queue = [seed];
        const chain = [seed];
        while (queue.length) {
            const i = queue.shift();
            for (let j = 0; j < items.length; j++) {
                if (j === i || !overlaps(items[i], items[j])) continue;
                if (color[j] === null) {
                    color[j] = 1 - color[i];
                    queue.push(j);
                    chain.push(j);
                } else if (color[j] === color[i]) {
                    return false;
                }
            }
        }
        const bigRoomColors = new Set(
            chain
                .filter(i => (items[i].details?.participantsCount || 1) > SMALL_ROOM_MAX)
                .map(i => color[i])
        );
        if (bigRoomColors.size > 1) return false;
    }
    return true;
};

/**
 * Why a group of `pCount` cannot start in [windowStart, windowEnd), or null if it can.
 *
 *   1. Another group already starts within 15 minutes (each group gets a private briefing).
 *   2. Not enough free rooms (1 room for up to 5 players, both rooms for 6–8).
 *   3. Not enough free headsets (8 in total across both rooms).
 *   4. The rooms can't be split so that every group of 5 gets the big room
 *      (e.g. a couple already in the big room while the small room can't take 5).
 */
const getCapacityError = (normalizedBookings, windowStart, windowEnd, pCount) => {
    const tooClose = normalizedBookings.some(
        b => Math.abs(b.startTime - windowStart) < MIN_START_GAP_MS
    );
    if (tooClose) return 'Another group starts within 15 minutes of this time';

    const { stations, headsets } = getPeakUsage(normalizedBookings, windowStart, windowEnd);
    if (TOTAL_STATIONS - stations < stationsFor(pCount)) {
        return 'Not enough rooms available at this time';
    }
    if (TOTAL_HEADSETS - headsets < pCount) {
        return 'Not enough VR headsets available at this time';
    }

    // Only reject when this booking is what breaks the big/small split — if the
    // day was already unsplittable (older bookings), don't block unrelated times.
    if (pCount <= LARGE_GROUP_THRESHOLD) {
        const candidate = { startTime: windowStart, endTime: windowEnd, details: { participantsCount: pCount } };
        if (!isRoomAssignmentFeasible([...normalizedBookings, candidate]) && isRoomAssignmentFeasible(normalizedBookings)) {
            return 'The large room is not available at this time';
        }
    }
    return null;
};

/**
 * Largest group (0–8) that can still start in [windowStart, windowEnd).
 * Capacity only shrinks as the group grows, so the first fit from the top wins.
 */
const getMaxPlayers = (normalizedBookings, windowStart, windowEnd) => {
    for (let p = TOTAL_HEADSETS; p >= 1; p--) {
        if (!getCapacityError(normalizedBookings, windowStart, windowEnd, p)) return p;
    }
    return 0;
};

/**
 * Pick `stationsNeeded` room IDs for a new booking. roomIds.length is what the
 * admin timeline uses to draw a group on one bar or both, so the length must
 * always match stationsNeeded — prefer IDs not used by overlapping bookings,
 * then fall back to any active room.
 */
const assignStationIds = (allRooms, normalizedBookings, windowStart, windowEnd, stationsNeeded) => {
    const roomIdsInUse = new Set(
        normalizedBookings
            .filter(b => b.startTime < windowEnd && b.endTime > windowStart)
            .flatMap(b => (b.roomIds || []).map(id => id.toString()))
    );
    const allIds  = allRooms.map(r => r._id);
    const freeIds = allIds.filter(id => !roomIdsInUse.has(id.toString()));
    const usedIds = allIds.filter(id => roomIdsInUse.has(id.toString()));
    return [...freeIds, ...usedIds].slice(0, stationsNeeded);
};

/**
 * Candidate start times for an Israel calendar date, before capacity checks.
 *
 * Customers: the day's opening hours (weekday / Friday / Motzash / holiday eve /
 * motzei chag — see utils/openingHours), minus closed days, admin-blocked dates
 * and slots, and slots that already passed today.
 * Admin (isAdmin): skips closures and the past-time filter so phone bookings
 * stay flexible; a closed day falls back to its weekday hours or 10:00–22:00.
 *
 * Returns { candidates, reason } — reason explains an empty list for customers.
 */
const getDayCandidates = async (israelDateStr, isAdmin) => {
    const startOfDay = new Date(israelDateStr + 'T00:00:00Z');
    const endOfDay   = new Date(israelDateStr + 'T23:59:59.999Z');

    // ── Admin-blocked dates ──────────────────────────────────────────────────
    // Use the Israel calendar date boundaries (UTC-anchored) for the query
    // so the server's local timezone never affects the lookup.
    let blockedRecord = null;
    try {
        blockedRecord = await BlockedDate.findOne({
            date: { $gte: startOfDay, $lte: endOfDay },
        }).lean();
    } catch (_) { /* collection may not exist on a fresh install */ }

    if (!isAdmin && blockedRecord?.isFullDay) {
        return { candidates: [], reason: 'admin_blocked' };
    }

    // ── Opening hours for this kind of day ───────────────────────────────────
    let settings = null;
    try {
        settings = await SiteSettings.findOne().lean();
    } catch (err) {
        console.error('Error fetching SiteSettings:', err);
    }
    // .lean() returns Maps as plain objects — access by string key directly.
    const openingHours = settings?.openingHours;

    const dayKey = getDayHoursKey(israelDateStr);
    let range = dayKey ? resolveDayRange(openingHours, dayKey) : null;

    if (!range) {
        if (!isAdmin) return { candidates: [], reason: 'closed' };
        const [y, m, d] = israelDateStr.split('-').map(Number);
        const weekdayKey = String(new Date(Date.UTC(y, m - 1, d)).getUTCDay());
        range = resolveDayRange(openingHours, weekdayKey)
            || { openMin: parseMinutes(DEFAULT_OPEN), closeMin: parseMinutes(DEFAULT_CLOSE) };
    }

    let candidates = generateIntervals(range.openMin, range.closeMin);

    // Legacy per-day start-time lists (SiteSettings.booking.weeklyHours), if an
    // admin ever saved one, still narrow the day down to those exact times.
    const [y, m, d] = israelDateStr.split('-').map(Number);
    const legacyDay = settings?.booking?.weeklyHours?.[String(new Date(Date.UTC(y, m - 1, d)).getUTCDay())];
    if (Array.isArray(legacyDay) && legacyDay.length > 0) {
        const allowed = new Set(legacyDay);
        candidates = candidates.filter(s => allowed.has(s));
    }

    // ── Past-time filter — only for today, non-admin ─────────────────────────
    if (!isAdmin && toIsraelDateStr(new Date()) === israelDateStr) {
        const israelNow = toIsraelDate(new Date());
        const nowMins   = israelNow.getHours() * 60 + israelNow.getMinutes();
        // A slot is "past" if its start time ≤ now. Keep only future slots.
        candidates = candidates.filter(s => parseMinutes(s) > nowMins);
    }

    // ── Admin partial-block slots ────────────────────────────────────────────
    if (blockedRecord?.blockedSlots?.length > 0) {
        const blocked = new Set(blockedRecord.blockedSlots);
        candidates = candidates.filter(s => !blocked.has(s));
    }

    return { candidates, reason: null };
};

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

    const capacityError = getCapacityError(normalised, startTime, endTime, pCount);
    if (capacityError) {
        throw new AppError(capacityError, 409);
    }

    // ── Assign station IDs (length = rooms the group occupies) ────────────────
    const assignedRoomIds = assignStationIds(allRooms, normalised, startTime, endTime, stationsNeeded);

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
    // excludeId (admin edit): the booking being edited doesn't count against its own new time
    const { date, participantsCount, admin, withCapacity, excludeId } = req.query;
    const isAdmin = admin === 'true';
    const pCount  = parseInt(participantsCount, 10) || 1;

    if (!date) {
        return next(new AppError('Please provide date', 400));
    }
    if (pCount < 1 || pCount > 8) {
        return next(new AppError('participantsCount must be between 1 and 8', 400));
    }

    // ── 1. Calendar context ──────────────────────────────────────────────────
    const israelDateStr = toIsraelDateStr(new Date(date)); // "YYYY-MM-DD"
    const startOfDay    = new Date(israelDateStr + 'T00:00:00Z');
    const endOfDay      = new Date(israelDateStr + 'T23:59:59.999Z');

    // ── 2. Allowed start times: opening hours, closures, blocks, past time ───
    let { candidates, reason } = await getDayCandidates(israelDateStr, isAdmin);

    // Short-circuit — no point running a DB query for an empty list
    if (candidates.length === 0) {
        return res.json({ status: 'success', data: [], ...(reason && { reason }) });
    }

    // ── 3. ONE DB query: all active bookings for this day ────────────────────
    //
    // We deliberately fetch ALL bookings (any experience/roomId) because the
    // two physical rooms and the headsets are a shared pool. A booking for any
    // experience consumes them and reduces capacity for everyone else.
    const dayBookings = await Booking.find({
        ...(excludeId && mongoose.Types.ObjectId.isValid(excludeId) && { _id: { $ne: excludeId } }),
        date:      { $gte: startOfDay, $lte: endOfDay },
        status:    { $ne: 'cancelled' },
        isDeleted: { $ne: true },
    }).lean();

    // Normalise: ensure every booking exposes startTime/endTime for the
    // overlap check (reconstructs from timeSlot for old v1 documents).
    const normalised = dayBookings
        .map(b => normalizeBookingTimes(b, israelDateStr))
        .filter(Boolean);

    // ── 4a. withCapacity=true: every start time with the largest group it fits ─
    //   [{ time: "10:30", maxPlayers: 3 }, …] — maxPlayers 0 = full.
    //   Lets the booking form grey out times / player counts and explain why,
    //   instead of hiding them. The default response (plain strings) is unchanged.
    if (withCapacity === 'true') {
        const slots = candidates.map(slotStr => {
            const windowStart = israelTimeToUTC(israelDateStr, slotStr);
            const windowEnd   = new Date(windowStart.getTime() + BOOKING_DURATION_MS);
            return { time: slotStr, maxPlayers: getMaxPlayers(normalised, windowStart, windowEnd) };
        });
        return res.json({ status: 'success', data: slots });
    }

    // ── 4. Per-slot availability (in-memory, O(candidates × bookings)) ───────
    //
    //   1–5 participants → 1 room,  6–8 → both rooms (entering together)
    //   at most 8 headsets in use at any moment
    //   no other group starting within 15 minutes
    candidates = candidates.filter(slotStr => {
        const windowStart = israelTimeToUTC(israelDateStr, slotStr);
        const windowEnd   = new Date(windowStart.getTime() + BOOKING_DURATION_MS);
        return !getCapacityError(normalised, windowStart, windowEnd, pCount);
    });

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
    const stationsNeeded = stationsFor(pCount);

    // Admin (valid token via optionalAuth) may book any time, set a manual price
    // and a source; customers are limited to opening hours and the price list.
    const isAdmin = Boolean(req.user);

    if (!isAdmin) {
        const { candidates } = await getDayCandidates(israelDateStr, false);
        if (!candidates.includes(timeSlot)) {
            return next(new AppError('This time is outside opening hours or no longer available', 409));
        }
    }

    // ── Load experience room for price calculation + email content ────────────
    const experienceRoomId = roomId || null;
    const room = experienceRoomId ? await Room.findById(experienceRoomId) : null;

    // Price: admin's manual price if given, otherwise the price list (never the
    // customer's browser), then the legacy per-room pricing as a last resort.
    let finalPrice = isAdmin ? Number(totalPrice) || 0 : 0;
    if (!finalPrice) {
        const plans = await PricingPlan.find({ isActive: true }).lean();
        finalPrice = calcTotalPrice(plans, pCount);
    }
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
        date, timeSlot, customer,
        source: isAdmin ? source : 'website',
        finalPrice,
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
//  getPublicBooking — confirmation page after booking / payment (public)
//
//  Looked up by the random bookingId (not the Mongo _id). Returns only what the
//  confirmation page shows — no phone, email or notes.
// ─────────────────────────────────────────────────────────────────────────────
exports.getPublicBooking = asyncHandler(async (req, res, next) => {
    const booking = await Booking.findOne({
        bookingId: req.params.bookingId,
        isDeleted: { $ne: true },
    }).populate('roomId', 'title');

    if (!booking) return next(new AppError('Booking not found', 404));

    res.status(200).json({
        status: 'success',
        data: {
            bookingId:         booking.bookingId,
            date:              booking.date,
            timeSlot:          booking.timeSlot,
            roomTitle:         booking.roomId?.title || null,
            participantsCount: booking.details?.participantsCount,
            totalPrice:        booking.details?.totalPrice,
            status:            booking.status,
            paymentStatus:     booking.payment?.status || 'unpaid',
            customerName:      booking.customer?.fullName,
        },
    });
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
        const stationsNeeded = stationsFor(newPCount);

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
        const capacityError = getCapacityError(normalised, newStartTime, newEndTime, newPCount);
        if (capacityError) {
            return next(new AppError(capacityError, 409));
        }

        // Re-assign station IDs from the shared pool
        const allRooms = await Room.find({ isActive: true }, '_id').lean();
        const assignedRoomIds = assignStationIds(allRooms, normalised, newStartTime, newEndTime, stationsNeeded);

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
    // UTC midnight of the Israel calendar date — the same anchor getDayCandidates
    // queries, regardless of the server's own timezone.
    const dateObj = new Date(toIsraelDateStr(new Date(date)) + 'T00:00:00Z');

    const block = await BlockedDate.findOneAndUpdate(
        { date: dateObj },
        { reason, isFullDay, blockedSlots },
        { new: true, upsert: true }
    );
    res.status(200).json({ status: 'success', data: block });
});

exports.getBlockedDates = asyncHandler(async (_req, res, _next) => {
    const today = new Date(toIsraelDateStr(new Date()) + 'T00:00:00Z');
    const blocks = await BlockedDate.find({ date: { $gte: today } }).sort({ date: 1 });
    res.status(200).json({ status: 'success', data: blocks });
});

exports.removeBlock = asyncHandler(async (req, res, _next) => {
    await BlockedDate.findByIdAndDelete(req.params.id);
    res.status(204).json({ status: 'success', data: null });
});
