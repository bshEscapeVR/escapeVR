// server/routes/index.js
const express = require('express');
const router = express.Router();

const roomsRouter = require('./rooms');
const bookingsRouter = require('./bookings');
const settingsRouter = require('./settings');
const authRouter = require('./auth');
const leadsRouter = require('./leads');
const reviewsRouter = require('./reviews');
const statsRouter = require('./stats');
const pricingRouter = require('./pricing');

// Routes
router.use('/rooms', roomsRouter);
router.use('/bookings', bookingsRouter);
router.use('/auth', authRouter);
router.use('/settings', settingsRouter);
router.use('/leads', leadsRouter);
router.use('/reviews', reviewsRouter);
router.use('/stats', statsRouter);
router.use('/pricing', pricingRouter);

module.exports = router;