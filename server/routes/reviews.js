// server/routes/reviews.js
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// Reviews Routes
router.post('/', reviewController.createReview);
router.get('/', reviewController.getAllReviews);
router.patch('/:id', reviewController.toggleApproval);
router.delete('/:id', reviewController.deleteReview);

module.exports = router;