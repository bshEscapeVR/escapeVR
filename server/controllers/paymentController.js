'use strict';
const { nanoid } = require('nanoid');
const Booking    = require('../models/Booking');
const AppError   = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const UPAY_FORM_ACTION = 'https://app.upay.co.il/API6/clientsecure/redirectpage.php';

// ─────────────────────────────────────────────────────────────────────────────
//  POST /v1/payments/initiate/:bookingId   (admin only)
//
//  Generates a unique paymentRef, stores it on the booking, and returns the
//  uPay form parameters so the frontend can submit directly to uPay.
// ─────────────────────────────────────────────────────────────────────────────
exports.initiatePayment = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking || booking.isDeleted) throw new AppError('הזמנה לא נמצאה', 404);
    if (booking.payment?.status === 'paid') throw new AppError('ההזמנה כבר שולמה', 400);

    const merchantEmail = process.env.UPAY_MERCHANT_EMAIL;
    if (!merchantEmail) throw new AppError('הגדרות uPay חסרות בשרת', 500);

    const serverUrl = process.env.SERVER_BASE_URL || 'https://escapevr-server.onrender.com';
    const clientUrl = process.env.CLIENT_BASE_URL  || 'https://www.escapevr.co.il';

    const paymentRef = nanoid(16);

    await Booking.findByIdAndUpdate(bookingId, {
        'payment.ref':    paymentRef,
        'payment.status': 'unpaid',
    });

    res.json({
        formAction: UPAY_FORM_ACTION,
        fields: {
            email:                  merchantEmail,
            amount:                 String(booking.details.totalPrice),
            returnurl:              `${clientUrl}/he/admin/dashboard`,
            ipnurl:                 `${serverUrl}/v1/payments/ipn?ref=${paymentRef}`,
            paymentdetails:         `הזמנה ${booking.bookingId} - חדר בריחה VR`,
            maxpayments:            '2',
            livesystem:             '0', // sandbox — החזר ל-'1' לפני deploy
            commissionreduction:    '',
            createinvoiceandreceipt:'0',
            createinvoice:          '0',
            createreceipt:          '1',
            refername:              'UPAY',
            lang:                   'HE',
            currency:               'NIS',
        },
    });
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /v1/payments/ipn   (called by uPay servers — no auth)
//
//  uPay posts payment result here. Always responds 200 so uPay doesn't retry.
//  The booking is identified via ?ref=<paymentRef> embedded in the IPN URL.
// ─────────────────────────────────────────────────────────────────────────────
exports.handleIPN = async (req, res) => {
    // Respond 200 immediately — uPay may retry if it doesn't get a quick response
    res.status(200).send('OK');

    try {
        const { ref } = req.query;
        const body    = req.body || {};

        console.log('[uPay IPN]', { ref, body });

        if (!ref) {
            console.error('[uPay IPN] Missing payment ref');
            return;
        }

        const booking = await Booking.findOne({ 'payment.ref': ref });
        if (!booking) {
            console.error('[uPay IPN] No booking found for ref:', ref);
            return;
        }

        // uPay success indicators (field names vary by integration version)
        const isSuccess =
            body.Status          === '1'  ||
            body.ResponseCode    === '000'||
            body.TransactionStatus === 'OK';

        if (isSuccess) {
            booking.payment.status = 'paid';
            if (body.TransactionId) booking.payment.transactionId = body.TransactionId;
        } else {
            booking.payment.status = 'failed';
        }

        await booking.save();
        console.log('[uPay IPN] Updated booking', booking.bookingId, '→', booking.payment.status);

    } catch (err) {
        console.error('[uPay IPN] Error processing IPN:', err);
    }
};
