'use strict';
// utils/coupons.js
// בדיקת קופון וחישוב הנחה - משותף לבדיקה בחלון ההזמנה וליצירת ההזמנה בפועל.
const Coupon  = require('../models/Coupon');
const Booking = require('../models/Booking');

const ISRAEL_TZ = 'Asia/Jerusalem';

const normalizeCode = (code) => String(code || '').trim().toUpperCase();

// ספרות בלבד, 972 → 0 (כדי ש-050-1234567 ו-+972501234567 ייחשבו אותו לקוח)
const normalizePhone = (phone) => {
    const digits = String(phone || '').replace(/\D/g, '');
    return digits.startsWith('972') ? '0' + digits.slice(3) : digits;
};

// סכום ההנחה (לא יותר מהמחיר עצמו), מעוגל לשקל
const calcDiscount = (coupon, basePrice) => {
    const raw = coupon.type === 'percent' ? (basePrice * coupon.value) / 100 : coupon.value;
    return Math.min(basePrice, Math.round(raw));
};

/**
 * בודק קופון עבור הזמנה.
 * @returns {Promise<{ coupon } | { error }>}
 *   error: not_found | inactive | expired | max_uses | min_participants | already_used
 */
const checkCoupon = async (code, { participantsCount, phone } = {}) => {
    const coupon = await Coupon.findOne({ code: normalizeCode(code) });
    if (!coupon) return { error: 'not_found' };
    if (!coupon.isActive) return { error: 'inactive' };

    if (coupon.expiresAt) {
        const todayIsrael = new Intl.DateTimeFormat('sv-SE', { timeZone: ISRAEL_TZ }).format(new Date());
        if (todayIsrael > coupon.expiresAt.toISOString().slice(0, 10)) return { error: 'expired' };
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { error: 'max_uses' };
    if (coupon.minParticipants && participantsCount && participantsCount < coupon.minParticipants) {
        return { error: 'min_participants', minParticipants: coupon.minParticipants };
    }

    if (coupon.oncePerCustomer && phone) {
        const wanted = normalizePhone(phone);
        const previous = await Booking.find(
            { 'coupon.code': coupon.code, isDeleted: { $ne: true }, status: { $ne: 'cancelled' } },
            'customer.phone'
        ).lean();
        if (previous.some(b => normalizePhone(b.customer?.phone) === wanted)) return { error: 'already_used' };
    }

    return { coupon };
};

/**
 * תופס שימוש אחד בקופון (אטומי - לא יעבור את maxUses גם בשתי הזמנות במקביל).
 * @returns {Promise<boolean>} false = נגמרו השימושים
 */
const reserveCouponUse = async (coupon) => {
    const filter = { _id: coupon._id };
    if (coupon.maxUses) filter.usedCount = { $lt: coupon.maxUses };
    const updated = await Coupon.findOneAndUpdate(filter, { $inc: { usedCount: 1 } });
    return Boolean(updated);
};

// מחזיר שימוש (אם ההזמנה נכשלה אחרי שתפסנו שימוש)
const releaseCouponUse = (coupon) =>
    Coupon.updateOne({ _id: coupon._id, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });

module.exports = { normalizeCode, calcDiscount, checkCoupon, reserveCouponUse, releaseCouponUse };
