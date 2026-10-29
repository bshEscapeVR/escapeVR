// models/Coupon.js
const mongoose = require('mongoose');

// קוד קופון להנחה בהזמנה. ההנחה מחושבת בשרת בלבד (utils/coupons.js).
const CouponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },       // הערה למנהל (לא מוצג ללקוח)

    // סדרת קופונים לשותף / מועדון / חברת פרסום (ריק = קופון בודד)
    campaign: { type: String, default: null, trim: true },
    batchNumber: { type: Number, default: null },     // מספר רץ בתוך הסדרה (1, 2, 3...)

    type: { type: String, enum: ['percent', 'fixed'], required: true }, // אחוזים / סכום קבוע בש"ח
    value: { type: Number, required: true, min: 0 },

    isActive: { type: Boolean, default: true },

    // הגבלות (null = ללא הגבלה)
    expiresAt: { type: Date, default: null },           // תקף עד סוף היום הזה (שעון ישראל)
    maxUses: { type: Number, default: null, min: 1 },   // מספר הזמנות מקסימלי בקופון
    minParticipants: { type: Number, default: null, min: 1 },
    oncePerCustomer: { type: Boolean, default: false }, // לפי מספר טלפון

    usedCount: { type: Number, default: 0 }
}, { timestamps: true });

CouponSchema.index({ campaign: 1, batchNumber: 1 });

module.exports = mongoose.model('Coupon', CouponSchema);
