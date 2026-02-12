const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const reviewController = require('../controllers/reviewController');

// Validation schema for public review submission
const reviewSchema = {
    authorName: { type: 'string', required: true, min: 2, max: 100 },
    email:      { type: 'string', required: true, max: 200, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    rating:     { type: 'number', required: true, min: 1, max: 5 },
    content:    { type: 'string', required: true, min: 10, max: 2000 },
    roomId:     { type: 'objectId', required: true },
    marketingConsent: { type: 'boolean', required: false, default: false }
};

// Public
router.post('/', validate(reviewSchema), reviewController.createReview);
router.get('/', reviewController.getAllReviews);

// Admin only
router.patch('/:id', auth, reviewController.toggleApproval);
router.delete('/:id', auth, reviewController.deleteReview);

module.exports = router;
