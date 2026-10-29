'use strict';
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { getPaymentStatus, verifySumitPayment, cancelSumitPayment, retrySumitPayment } = require('../controllers/paymentController');

// Admin: are the Sumit keys configured on the server?
router.get('/status', auth, getPaymentStatus);

// Confirmation page: check with Sumit whether the booking was paid
router.post('/sumit/verify', verifySumitPayment);

// Customer pressed "cancel" on the payment page - release the slot right away
router.post('/sumit/cancel', cancelSumitPayment);

// Customer left the payment page - open a new one while the slot is still held
router.post('/sumit/retry', retrySumitPayment);

module.exports = router;
