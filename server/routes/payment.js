'use strict';
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { initiatePayment, handleIPN } = require('../controllers/paymentController');

// Admin creates a payment session for a specific booking
router.post('/initiate/:bookingId', auth, initiatePayment);

// uPay IPN callback — no auth, called server-to-server by uPay
router.post('/ipn', handleIPN);

module.exports = router;
