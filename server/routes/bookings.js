// server/routes/bookings.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');

// Public routes
router.get('/slots', bookingController.getAvailableSlots);
router.post('/', bookingController.createBooking);

// Protected routes (require auth)
router.get('/all', auth, bookingController.getAllBookings);
router.delete('/:id', auth, bookingController.deleteBooking);

// Admin: Blocked Dates Management
router.post('/blocked-dates', auth, bookingController.blockDate);
router.get('/blocked-dates', auth, bookingController.getBlockedDates);
router.delete('/blocked-dates/:id', auth, bookingController.removeBlock);

module.exports = router;
