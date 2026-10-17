// models/PricingPlan.js
const mongoose = require('mongoose');
const BilingualSchema = require('./Schemas/BilingualSchema');

const PricingPlanSchema = new mongoose.Schema({
    // כמות שחקנים (בכרטיס טווח - תחילת הטווח)
    players: {
        type: Number,
        required: true,
        min: 1,
        max: 20
    },

    // סוף טווח שחקנים (אופציונלי) - כרטיס "6-8 שחקנים" באותו מחיר לאדם.
    // ריק = כרטיס רגיל לכמות אחת
    maxPlayers: {
        type: Number,
        min: 1,
        max: 20,
        default: null
    },

    // מחיר מקורי לאדם
    oldPrice: {
        type: Number,
        required: true,
        min: 0
    },

    // מחיר חדש לאדם (אחרי הנחה)
    newPrice: {
        type: Number,
        required: true,
        min: 0
    },

    // אחוז הנחה (אופציונלי - מחושב אוטומטית אם לא מסופק)
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },

    // פיצ'רים מותאמים אישית (אופציונלי - אם ריק ישתמש בברירת מחדל)
    features: [{
        type: BilingualSchema
    }],

    // האם הכרטיס פעיל
    isActive: {
        type: Boolean,
        default: true
    },

    // סדר תצוגה
    order: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// וירטואל: האם זה כרטיס טווח
PricingPlanSchema.virtual('isRange').get(function() {
    return this.maxPlayers > this.players;
});

// וירטואל: חישוב מחיר כולל (בכרטיס טווח אין סך כולל קבוע)
PricingPlanSchema.virtual('totalPrice').get(function() {
    return this.isRange ? null : this.newPrice * this.players;
});

// וירטואל: חישוב אחוז הנחה אם לא הוגדר
PricingPlanSchema.virtual('calculatedDiscount').get(function() {
    if (this.discount > 0) return this.discount;
    if (this.oldPrice === 0) return 0;
    return Math.round((1 - this.newPrice / this.oldPrice) * 100);
});

// הוספת וירטואלים ל-JSON
PricingPlanSchema.set('toJSON', { virtuals: true });
PricingPlanSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PricingPlan', PricingPlanSchema);
