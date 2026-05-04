'use strict';
const mongoose = require('mongoose');
const { nanoid } = require('nanoid'); // v3 — CommonJS compatible

// ─────────────────────────────────────────────────────────────────────────────
//  Booking Model
//
//  Schema version history:
//    v1 (original): roomId (single ObjectId), timeSlot (string), no startTime/endTime
//    v2 (current):  roomIds (array), startTime + endTime (UTC Dates), roomId kept
//                   for backwards compatibility during migration period.
//
//  Run `node migrate.js` once to backfill old documents to v2 format.
// ─────────────────────────────────────────────────────────────────────────────

const BookingSchema = new mongoose.Schema(
    {
        // Collision-resistant human-readable ID (e.g. "V1StGXR8_Z").
        // Replaces the old '#' + random-4-digit approach.
        bookingId: {
            type: String,
            unique: true,
            default: () => nanoid(10),
        },

        // ── v2: primary room field ────────────────────────────────────────────
        // 1 entry  → small group (1–4 participants), occupies 1 physical room.
        // 2 entries → large group (5–8 participants), occupies both rooms.
        roomIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],

        // ── v1 (DEPRECATED): kept so existing documents remain readable ───────
        // New code must use roomIds / primaryRoomId virtual instead.
        // Remove this field once migrate.js has run and Phase 2 is deployed.
        roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },

        // Calendar date of the booking (used for day-level admin queries).
        date: { type: Date, required: true },

        // Display-only slot string e.g. "18:00". Business logic uses startTime/endTime.
        // Not required so old documents with it set and new documents both pass validation.
        timeSlot: { type: String },

        // ── v2: full UTC datetimes ────────────────────────────────────────────
        // Required by the new overlap query in getAvailableSlots / createBooking.
        // Null on old documents until migrate.js runs.
        startTime: { type: Date }, // Israel wall-clock start time converted to UTC
        endTime:   { type: Date }, // always startTime + 75 minutes (1h 15m)

        customer: {
            fullName: { type: String, required: true },
            email:    { type: String },   // optional (phone bookings may omit email)
            phone:    { type: String, required: true },
            notes:    { type: String },
        },

        details: {
            participantsCount: { type: Number, required: true },
            totalPrice:        { type: Number, required: true },
        },

        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
            default: 'confirmed',
        },

        source: {
            type: String,
            enum: ['website', 'phone', 'walk-in', 'whatsapp'],
            default: 'website',
        },

        // ── Payment ──────────────────────────────────────────────────────────
        payment: {
            status: {
                type: String,
                enum: ['unpaid', 'paid', 'failed'],
                default: 'unpaid',
            },
            // Unique token embedded in the uPay IPN callback URL for lookup
            ref: { type: String, default: null },
            transactionId: { type: String, default: null },
        },

        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date,    default: null  },
    },
    {
        timestamps: true,
        // Expose virtuals when documents are serialised (e.g. res.json()).
        toJSON:   { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ─────────────────────────────────────────────────────────────────────────────
//  Virtual: primaryRoomId
//
//  Backwards-compatible single-room accessor. Use this in any new code that
//  only needs one room reference (e.g. populate, email templates).
//
//  • New documents  → returns roomIds[0]
//  • Old documents (pre-migration) → falls back to legacy roomId field
// ─────────────────────────────────────────────────────────────────────────────
BookingSchema.virtual('primaryRoomId').get(function () {
    if (this.roomIds && this.roomIds.length > 0) return this.roomIds[0];
    return this.roomId ?? null;
});

// ─────────────────────────────────────────────────────────────────────────────
//  Pre-save hook: on-the-fly partial migration
//
//  If an old document (has roomId but empty roomIds) is saved for any reason
//  before migrate.js runs — e.g. an admin edits a booking status — backfill
//  roomIds automatically so it is never persisted in a half-migrated state.
// ─────────────────────────────────────────────────────────────────────────────
BookingSchema.pre('save', async function () {
    if ((!this.roomIds || this.roomIds.length === 0) && this.roomId) {
        this.roomIds = [this.roomId];
    }
});

// ─────────────────────────────────────────────────────────────────────────────
//  Indexes
//
//  REMOVED (v1):
//    { roomId: 1, date: 1, timeSlot: 1 } unique partial index
//    — Cannot model window-based overlap. Uniqueness is now enforced by the
//      MongoDB transaction in createBooking(). The old index is dropped by
//      migrate.js; until then it remains in MongoDB as a harmless safety net.
//
//  ADDED (v2):
//    { startTime, endTime } — primary index for the overlap range query.
//    { date, status, isDeleted } — day-based admin list views.
//    { status, isDeleted } — general status filters.
// ─────────────────────────────────────────────────────────────────────────────
BookingSchema.index({ startTime: 1, endTime: 1 });
BookingSchema.index({ date: 1, status: 1, isDeleted: 1 });
BookingSchema.index({ status: 1, isDeleted: 1 });
BookingSchema.index({ 'payment.ref': 1 }, { sparse: true });

module.exports = mongoose.model('Booking', BookingSchema);
