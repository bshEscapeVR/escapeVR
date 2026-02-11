const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const Booking = require('../models/Booking');
const Lead = require('../models/Lead');
const Review = require('../models/Review');
const Room = require('../models/Room');

// Admin only - dashboard statistics
router.get('/', auth, asyncHandler(async (req, res) => {
    const [bookingsCount, leadsCount, reviewsCount, roomsCount] = await Promise.all([
        Booking.countDocuments(),
        Lead.countDocuments(),
        Review.countDocuments(),
        Room.countDocuments()
    ]);

    res.json({
        bookings: bookingsCount,
        leads: leadsCount,
        reviews: reviewsCount,
        rooms: roomsCount
    });
}));

module.exports = router;
