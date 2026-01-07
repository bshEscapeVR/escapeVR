// controllers/pricingController.js
const PricingPlan = require('../models/PricingPlan');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// קבלת כל תוכניות המחירים הפעילות (לאתר)
exports.getAllPricingPlans = asyncHandler(async (req, res, next) => {
    const plans = await PricingPlan.find({ isActive: true }).sort({ order: 1, players: 1 });

    res.status(200).json({
        status: 'success',
        results: plans.length,
        data: plans
    });
});

// קבלת כל תוכניות המחירים כולל לא פעילות (לאדמין)
exports.getAllPricingPlansAdmin = asyncHandler(async (req, res, next) => {
    const plans = await PricingPlan.find().sort({ order: 1, players: 1 });

    res.status(200).json({
        status: 'success',
        results: plans.length,
        data: plans
    });
});

// קבלת תוכנית מחיר בודדת
exports.getPricingPlan = asyncHandler(async (req, res, next) => {
    const plan = await PricingPlan.findById(req.params.id);

    if (!plan) {
        return next(new AppError('No pricing plan found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: plan
    });
});

// יצירת תוכנית מחיר חדשה
exports.createPricingPlan = asyncHandler(async (req, res, next) => {
    // חישוב הנחה אוטומטי אם לא סופק
    if (!req.body.discount && req.body.oldPrice && req.body.newPrice) {
        req.body.discount = Math.round((1 - req.body.newPrice / req.body.oldPrice) * 100);
    }

    const newPlan = await PricingPlan.create(req.body);

    res.status(201).json({
        status: 'success',
        data: newPlan
    });
});

// עדכון תוכנית מחיר
exports.updatePricingPlan = asyncHandler(async (req, res, next) => {
    // חישוב הנחה אוטומטי אם לא סופק
    if (req.body.oldPrice && req.body.newPrice && !req.body.discount) {
        req.body.discount = Math.round((1 - req.body.newPrice / req.body.oldPrice) * 100);
    }

    const plan = await PricingPlan.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!plan) {
        return next(new AppError('No pricing plan found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: plan
    });
});

// מחיקת תוכנית מחיר
exports.deletePricingPlan = asyncHandler(async (req, res, next) => {
    const plan = await PricingPlan.findByIdAndDelete(req.params.id);

    if (!plan) {
        return next(new AppError('No pricing plan found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// עדכון סדר התוכניות
exports.reorderPricingPlans = asyncHandler(async (req, res, next) => {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
        return next(new AppError('orderedIds must be an array', 400));
    }

    // עדכון הסדר לכל תוכנית
    const updatePromises = orderedIds.map((id, index) =>
        PricingPlan.findByIdAndUpdate(id, { order: index })
    );

    await Promise.all(updatePromises);

    const plans = await PricingPlan.find().sort({ order: 1, players: 1 });

    res.status(200).json({
        status: 'success',
        data: plans
    });
});
