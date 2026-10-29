// controllers/couponController.js
const Coupon = require('../models/Coupon');
const Booking = require('../models/Booking');
const PricingPlan = require('../models/PricingPlan');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { calcTotalPrice } = require('../utils/pricing');
const { normalizeCode, calcDiscount, checkCoupon } = require('../utils/coupons');

// שדות שהמנהל יכול לקבוע (code נשמר באותיות גדולות במודל)
const pickCouponFields = (body) => {
    const fields = {};
    ['code', 'description', 'type', 'value', 'isActive', 'oncePerCustomer'].forEach((key) => {
        if (body[key] !== undefined) fields[key] = body[key];
    });
    // הגבלות אופציונליות: ערך ריק = ללא הגבלה
    ['maxUses', 'minParticipants'].forEach((key) => {
        if (body[key] !== undefined) fields[key] = body[key] === '' || body[key] === null ? null : Number(body[key]);
    });
    if (body.expiresAt !== undefined) {
        // "YYYY-MM-DD" → חצות UTC של התאריך (נבדק מול התאריך בישראל ב-checkCoupon)
        fields.expiresAt = body.expiresAt ? new Date(String(body.expiresAt).slice(0, 10) + 'T00:00:00Z') : null;
    }
    if (fields.type === 'percent' && fields.value > 100) fields.value = 100;
    return fields;
};

// --- Admin ---

exports.getCoupons = asyncHandler(async (_req, res) => {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', data: coupons });
});

exports.createCoupon = asyncHandler(async (req, res, next) => {
    const fields = pickCouponFields(req.body);
    if (!fields.code || !fields.type || fields.value === undefined) {
        return next(new AppError('code, type and value are required', 400));
    }
    if (await Coupon.findOne({ code: normalizeCode(fields.code) })) {
        return next(new AppError('קוד קופון כבר קיים', 400));
    }
    const coupon = await Coupon.create(fields);
    res.status(201).json({ status: 'success', data: coupon });
});

exports.updateCoupon = asyncHandler(async (req, res, next) => {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, pickCouponFields(req.body), { new: true, runValidators: true });
    if (!coupon) return next(new AppError('Coupon not found', 404));
    res.status(200).json({ status: 'success', data: coupon });
});

exports.deleteCoupon = asyncHandler(async (req, res) => {
    await Coupon.findByIdAndDelete(req.params.id);
    res.status(204).json({ status: 'success', data: null });
});

// --- Admin: coupon series for a partner / club / ad agency ---

const MAX_BATCH_SIZE = 500;
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I/L - easy to type

const randomSuffix = (length = 3) =>
    Array.from({ length }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

/**
 * Creates `count` codes like PREFIX-001-K7Q: a running number to keep order and
 * track each code, plus a short random part so codes can't be guessed from each other.
 * Numbering continues if the campaign already has codes.
 */
exports.createBatch = asyncHandler(async (req, res, next) => {
    const campaign = String(req.body.campaign || '').trim();
    const prefix = normalizeCode(req.body.prefix).replace(/[^A-Z0-9]/g, '');
    const count = parseInt(req.body.count, 10);

    if (!campaign) return next(new AppError('יש להזין שם שותף / מועדון', 400));
    if (!prefix) return next(new AppError('יש להזין קידומת באנגלית או מספרים', 400));
    if (!count || count < 1 || count > MAX_BATCH_SIZE) return next(new AppError(`כמות הקופונים: 1 עד ${MAX_BATCH_SIZE}`, 400));

    const shared = pickCouponFields({ ...req.body, code: undefined });
    if (!shared.type || !shared.value) return next(new AppError('type and value are required', 400));

    const last = await Coupon.findOne({ campaign }).sort({ batchNumber: -1 }).lean();
    const start = (last?.batchNumber || 0) + 1;
    const digits = Math.max(3, String(start + count - 1).length);

    const existing = new Set((await Coupon.find({ code: new RegExp(`^${prefix}-`) }, 'code').lean()).map(c => c.code));
    const docs = [];
    for (let i = 0; i < count; i++) {
        const number = start + i;
        let code;
        do {
            code = `${prefix}-${String(number).padStart(digits, '0')}-${randomSuffix()}`;
        } while (existing.has(code));
        existing.add(code);
        docs.push({ ...shared, code, campaign, batchNumber: number });
    }

    const created = await Coupon.insertMany(docs);
    res.status(201).json({ status: 'success', results: created.length, data: created });
});

// Usage report for one campaign: every code with the bookings that used it
exports.getCampaignReport = asyncHandler(async (req, res) => {
    const campaign = String(req.query.name || '').trim();
    const coupons = await Coupon.find({ campaign }).sort({ batchNumber: 1 }).lean();
    const bookings = await Booking.find(
        { 'coupon.code': { $in: coupons.map(c => c.code) }, isDeleted: { $ne: true } },
        'bookingId date timeSlot status details coupon createdAt'
    ).lean();

    const usesByCode = {};
    bookings.forEach((b) => {
        (usesByCode[b.coupon.code] = usesByCode[b.coupon.code] || []).push({
            bookingId: b.bookingId,
            date: b.date,
            timeSlot: b.timeSlot,
            status: b.status,
            participantsCount: b.details?.participantsCount,
            totalPrice: b.details?.totalPrice,
            discount: b.coupon?.discount,
            createdAt: b.createdAt,
        });
    });

    res.status(200).json({
        status: 'success',
        data: coupons.map(c => ({ ...c, uses: usesByCode[c.code] || [] })),
    });
});

// Enable / disable every code of a campaign
exports.updateCampaign = asyncHandler(async (req, res) => {
    const campaign = String(req.query.name || '').trim();
    const result = await Coupon.updateMany({ campaign }, { isActive: Boolean(req.body.isActive) });
    res.status(200).json({ status: 'success', data: { modified: result.modifiedCount } });
});

// Delete every code of a campaign (bookings keep their saved coupon details)
exports.deleteCampaign = asyncHandler(async (req, res) => {
    const campaign = String(req.query.name || '').trim();
    await Coupon.deleteMany({ campaign });
    res.status(204).json({ status: 'success', data: null });
});

// --- Public ---

// בדיקת קופון מחלון ההזמנה: מחזיר את ההנחה והמחיר אחרי הנחה (לתצוגה - ההזמנה עצמה מחשבת שוב)
exports.validateCoupon = asyncHandler(async (req, res) => {
    const { code, participantsCount, phone } = req.body;
    const pCount = parseInt(participantsCount, 10) || null;

    const result = await checkCoupon(code, { participantsCount: pCount, phone });
    if (result.error) {
        return res.status(200).json({
            status: 'success',
            data: { valid: false, reason: result.error, minParticipants: result.minParticipants }
        });
    }

    const plans = await PricingPlan.find({ isActive: true }).lean();
    const basePrice = pCount ? calcTotalPrice(plans, pCount) : 0;
    const discount = calcDiscount(result.coupon, basePrice);

    res.status(200).json({
        status: 'success',
        data: {
            valid: true,
            code: result.coupon.code,
            type: result.coupon.type,
            value: result.coupon.value,
            basePrice,
            discount,
            finalPrice: basePrice - discount
        }
    });
});
