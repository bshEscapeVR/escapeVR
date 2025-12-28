// controllers/reviewController.js
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');

// יצירת ביקורת (פומבי)
exports.createReview = asyncHandler(async (req, res) => {
    const review = await Review.create(req.body);
    res.status(201).json({ status: 'success', data: review });
});

// קבלת ביקורות (לאדמין - הכל, לפומבי - רק מאושרות)
exports.getAllReviews = asyncHandler(async (req, res) => {
    const filter = req.query.approved === 'true' ? { isApproved: true } : {};
    // const reviews = await Review.find(filter).sort({ createdAt: -1 });
    const reviews = await Review.find(filter)
    .populate('roomId', 'title') // 👈 זה השינוי
    .sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', data: reviews });
});

// אישור/חסימת ביקורת
exports.toggleApproval = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (review) {
        review.isApproved = !review.isApproved;
        await review.save();
    }
    res.status(200).json({ status: 'success', data: review });
});

// מחיקת ביקורת
exports.deleteReview = asyncHandler(async (req, res) => {
    await Review.findByIdAndDelete(req.params.id);
    res.status(204).json({ status: 'success', data: null });
});