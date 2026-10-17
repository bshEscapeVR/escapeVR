// controllers/pricingController.js
const PricingPlan = require('../models/PricingPlan');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// טווח השחקנים שכרטיס מכסה
const planRange = (plan) => ({
    min: plan.players,
    max: plan.maxPlayers > plan.players ? plan.maxPlayers : plan.players
});

// נרמול שדה הטווח: "עד" ריק או שווה ל"מ-" => כרטיס רגיל
const normalizeRange = (data) => {
    if (data.maxPlayers === undefined) return null;
    const max = Number(data.maxPlayers) || null;
    if (max !== null && data.players !== undefined && max < Number(data.players)) {
        return 'סוף הטווח חייב להיות גדול ממספר השחקנים ההתחלתי';
    }
    data.maxPlayers = max && max > Number(data.players) ? max : null;
    return null;
};

// מניעת כפל: אסור ששני כרטיסים פעילים יכסו אותה כמות שחקנים
const findOverlap = async (plan, excludeId) => {
    if (!plan.isActive) return null;
    const { min, max } = planRange(plan);
    const others = await PricingPlan.find({ isActive: true, ...(excludeId && { _id: { $ne: excludeId } }) });
    for (const other of others) {
        const r = planRange(other);
        if (min <= r.max && r.min <= max) {
            const label = r.min === r.max ? `${r.min}` : `${r.min}-${r.max}`;
            return `כמות השחקנים חופפת לכרטיס קיים (${label} שחקנים)`;
        }
    }
    return null;
};

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

    const rangeError = normalizeRange(req.body);
    if (rangeError) return next(new AppError(rangeError, 400));

    const overlap = await findOverlap({ isActive: true, ...req.body });
    if (overlap) return next(new AppError(overlap, 400));

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

    const existing = await PricingPlan.findById(req.params.id);
    if (!existing) {
        return next(new AppError('No pricing plan found with that ID', 404));
    }

    if (req.body.players === undefined) req.body.players = existing.players;
    const rangeError = normalizeRange(req.body);
    if (rangeError) return next(new AppError(rangeError, 400));

    const merged = { ...existing.toObject(), ...req.body };
    const overlap = await findOverlap(merged, existing._id);
    if (overlap) return next(new AppError(overlap, 400));

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
