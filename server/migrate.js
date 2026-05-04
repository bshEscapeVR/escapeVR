'use strict';
/**
 * migrate.js — One-time migration: Booking schema v1 → v2
 *
 * What it does:
 *   1. Drops the old compound unique index { roomId, date, timeSlot } that can
 *      no longer enforce overlap-based uniqueness.
 *   2. For every Booking that has a `roomId` but no `roomIds`, backfills:
 *        • roomIds  → [roomId]
 *        • startTime → UTC datetime reconstructed from date + timeSlot (Israel TZ)
 *        • endTime   → startTime + 75 minutes
 *
 * Safe to run multiple times — already-migrated documents are skipped.
 *
 * Usage:
 *   node migrate.js
 *
 * Requires MONGODB_URI in .env (same variable the main server uses).
 */

require('dotenv').config();
const mongoose = require('mongoose');

const ISRAEL_TZ = 'Asia/Jerusalem';
const DURATION_MS = 75 * 60 * 1000; // 75 minutes in milliseconds (1h 15m)

// ─────────────────────────────────────────────────────────────────────────────
//  Helper: reconstruct a UTC Date from a stored `date` + `timeSlot` ("HH:MM")
//
//  Strategy (matches the toIsraelDate() pattern already used in the controller):
//    1. Find the calendar date as "YYYY-MM-DD" in the Israel timezone.
//    2. Get UTC midnight for that Israel calendar date.
//    3. Measure Israel's UTC offset at that exact moment (handles DST correctly:
//       Israel is UTC+2 in winter, UTC+3 in summer).
//    4. Subtract the offset from the slot's Israel time to get the UTC time.
// ─────────────────────────────────────────────────────────────────────────────
function buildStartTime(bookingDate, timeSlot) {
    const [slotHour, slotMinute] = timeSlot.split(':').map(Number);

    // Step 1: "YYYY-MM-DD" in Israel timezone.
    // sv-SE locale reliably produces ISO date format.
    const israelDateStr = new Intl.DateTimeFormat('sv-SE', {
        timeZone: ISRAEL_TZ,
    }).format(new Date(bookingDate));

    // Step 2: UTC midnight of that Israel calendar date.
    const utcMidnight = new Date(israelDateStr + 'T00:00:00Z');

    // Step 3: At UTC midnight, what hour is it in Israel?
    //   UTC+2 → "02:00"   UTC+3 → "03:00"
    const israelHourStr = new Intl.DateTimeFormat('en-US', {
        timeZone: ISRAEL_TZ,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(utcMidnight);
    // israelHourStr is e.g. "02:00" or "03:00"
    const offsetHours = parseInt(israelHourStr.split(':')[0], 10);

    // Step 4: UTC minutes from midnight = Israel slot minutes − offset minutes.
    //   setUTCMinutes() handles values outside [0, 59] by rolling over hours,
    //   so negative values (rare early-morning slots) are handled correctly.
    const slotUtcMinutes = slotHour * 60 + slotMinute - offsetHours * 60;

    const startTime = new Date(utcMidnight);
    startTime.setUTCMinutes(slotUtcMinutes);
    return startTime;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main
// ─────────────────────────────────────────────────────────────────────────────
async function run() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('❌  MONGO_URI is not set in .env');
        process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('✅  Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const bookings = db.collection('bookings');

    // ── Step 1: Drop the old unique compound index ────────────────────────────
    // The index name MongoDB auto-generates for { roomId:1, date:1, timeSlot:1 }.
    // If it was never created (fresh install), the catch handles it gracefully.
    console.log('── Step 1: Dropping old compound index ─────────────────────');
    try {
        await bookings.dropIndex('roomId_1_date_1_timeSlot_1');
        console.log('   ✅  Dropped: roomId_1_date_1_timeSlot_1');
    } catch (err) {
        if (err.codeName === 'IndexNotFound') {
            console.log('   ℹ️   Index not found — already dropped or never created.');
        } else {
            // Unexpected error — surface it and abort.
            throw err;
        }
    }

    // ── Step 2: Migrate old Booking documents ─────────────────────────────────
    console.log('\n── Step 2: Migrating booking documents ─────────────────────');

    // Only target documents that still use the old schema:
    //   • have a `roomId` (old field), AND
    //   • are missing `roomIds` or have an empty array (not yet migrated).
    const cursor = bookings.find({
        roomId: { $exists: true },
        $or: [
            { roomIds: { $exists: false } },
            { roomIds: { $size: 0 } },
        ],
    });

    const total = await bookings.countDocuments({
        roomId: { $exists: true },
        $or: [
            { roomIds: { $exists: false } },
            { roomIds: { $size: 0 } },
        ],
    });

    console.log(`   Found ${total} document(s) to migrate\n`);

    let migrated = 0;
    let partial  = 0; // migrated roomIds but could not compute startTime/endTime
    const failed = [];

    for await (const booking of cursor) {
        try {
            const $set = {
                roomIds: [booking.roomId],
            };

            if (booking.date && booking.timeSlot) {
                const startTime = buildStartTime(booking.date, booking.timeSlot);
                $set.startTime  = startTime;
                $set.endTime    = new Date(startTime.getTime() + DURATION_MS);
            } else {
                // Missing date or timeSlot — backfill roomIds only.
                // startTime/endTime will remain null until manually corrected.
                console.warn(
                    `   ⚠️   ${booking._id} — missing date or timeSlot. ` +
                    `roomIds backfilled; startTime/endTime skipped.`
                );
                partial++;
            }

            await bookings.updateOne({ _id: booking._id }, { $set });
            migrated++;
        } catch (err) {
            console.error(`   ❌  ${booking._id} — ${err.message}`);
            failed.push({ id: booking._id, error: err.message });
        }
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n── Summary ──────────────────────────────────────────────────');
    console.log(`   ✅  Fully migrated  : ${migrated - partial}`);
    console.log(`   ⚠️   Partial (roomIds only): ${partial}`);
    console.log(`   ❌  Errors          : ${failed.length}`);
    if (failed.length > 0) {
        console.log('\n   Failed document IDs:');
        failed.forEach(f => console.log(`     • ${f.id}: ${f.error}`));
        console.log('\n   ⚠️   Resolve the above before deploying Phase 2.');
    } else {
        console.log('\n   ✅  All documents migrated successfully.');
        console.log('   You may now deploy Phase 2 (controller rewrite).');
    }

    await mongoose.disconnect();
    console.log('\n✅  Disconnected. Migration complete.');
}

run().catch(err => {
    console.error('\n❌  Migration aborted:', err);
    process.exit(1);
});
