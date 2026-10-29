'use strict';
const Booking      = require('../models/Booking');
const AppError     = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { isSumitConfigured, getPayment, findPaymentForBooking } = require('../utils/sumit');
const { createPaymentPage, finalizePaidBooking, cancelUnpaidBooking } = require('./bookingController');

// ─────────────────────────────────────────────────────────────────────────────
//  GET /v1/payments/status   (admin only)
//
//  Whether the Sumit keys are set on the server - shown next to the
//  "online payment" switch so the admin doesn't turn it on without them.
// ─────────────────────────────────────────────────────────────────────────────
exports.getPaymentStatus = (req, res) => {
    res.json({ status: 'success', data: { sumitConfigured: isSumitConfigured() } });
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /v1/payments/sumit/verify   (public — the confirmation page)
//
//  Body: { bookingId, paymentId? }  (paymentId = OG-PaymentID Sumit appended
//  to the return URL). The server asks Sumit itself — the browser's word is
//  never enough. Without paymentId, it searches Sumit by the bookingId.
// ─────────────────────────────────────────────────────────────────────────────
exports.verifySumitPayment = asyncHandler(async (req, res, next) => {
    const { bookingId, paymentId } = req.body || {};
    if (!bookingId) return next(new AppError('bookingId is required', 400));

    let booking = await Booking.findOne({ bookingId: String(bookingId), isDeleted: { $ne: true } });
    if (!booking) return next(new AppError('Booking not found', 404));

    const waiting = booking.payment?.provider === 'sumit'
        && ['unpaid', 'expired'].includes(booking.payment?.status);

    if (waiting && isSumitConfigured()) {
        try {
            const payment = paymentId && /^\d+$/.test(String(paymentId))
                ? await getPayment(paymentId)
                : await findPaymentForBooking(booking.bookingId, booking.createdAt);
            if (payment) booking = await finalizePaidBooking(booking, payment);
        } catch (err) {
            console.error('[verifySumitPayment] Sumit error:', err.message);
        }
    }

    res.json({
        status: 'success',
        data: {
            status:        booking.status,
            paymentStatus: booking.payment?.status || 'unpaid',
        },
    });
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /v1/payments/sumit/cancel   (public — Sumit's "cancel" return URL)
//
//  Body: { bookingId }. The customer pressed "cancel" on the payment page —
//  the slot is released right away instead of waiting for the hold to expire.
//  Marked 'expired' (not 'failed') so a payment made later from the still-open
//  Sumit page is still matched and handled like any late payment.
// ─────────────────────────────────────────────────────────────────────────────
exports.cancelSumitPayment = asyncHandler(async (req, res, next) => {
    const { bookingId } = req.body || {};
    if (!bookingId) return next(new AppError('bookingId is required', 400));

    let booking = await Booking.findOne({
        bookingId:        String(bookingId),
        status:           'pending',
        'payment.status': 'unpaid',
        isDeleted:        { $ne: true },
    });

    if (booking) {
        // Paid after all (e.g. another tab)? Confirm instead of cancelling
        let payment = null;
        if (isSumitConfigured()) {
            payment = await findPaymentForBooking(booking.bookingId, booking.createdAt)
                .catch(err => { console.error('[cancelSumitPayment] Sumit error:', err.message); return null; });
        }
        booking = payment
            ? await finalizePaidBooking(booking, payment)
            : (await cancelUnpaidBooking(booking, 'expired')) || booking;
    } else {
        booking = await Booking.findOne({ bookingId: String(bookingId), isDeleted: { $ne: true } });
        if (!booking) return next(new AppError('Booking not found', 404));
    }

    res.json({
        status: 'success',
        data: { status: booking.status, paymentStatus: booking.payment?.status || 'unpaid' },
    });
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /v1/payments/sumit/retry   (public)
//
//  Body: { bookingId, lang }. The customer cancelled / left the payment page —
//  a new payment page, as long as the booking still holds its slot.
// ─────────────────────────────────────────────────────────────────────────────
exports.retrySumitPayment = asyncHandler(async (req, res, next) => {
    const { bookingId, lang } = req.body || {};
    if (!bookingId) return next(new AppError('bookingId is required', 400));

    const booking = await Booking.findOne({
        bookingId:           String(bookingId),
        status:              'pending',
        'payment.status':    'unpaid',
        'payment.expiresAt': { $gt: new Date() },
        isDeleted:           { $ne: true },
    });
    if (!booking) return next(new AppError('PAYMENT:expired', 409));
    if (!isSumitConfigured()) return next(new AppError('PAYMENT:unavailable', 503));

    try {
        const paymentUrl = await createPaymentPage(booking, undefined, lang);
        res.json({ status: 'success', data: { paymentUrl } });
    } catch (err) {
        console.error('[retrySumitPayment] Sumit error:', err.message);
        next(new AppError('PAYMENT:unavailable', 502));
    }
});
