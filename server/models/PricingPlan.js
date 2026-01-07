// models/PricingPlan.js
const mongoose = require('mongoose');
const BilingualSchema = require('./Schemas/BilingualSchema');

const PricingPlanSchema = new mongoose.Schema({
    // כמות שחקנים
    players: {
        type: Number,
        required: true,
        min: 1,
        max: 20
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

// וירטואל: חישוב מחיר כולל
PricingPlanSchema.virtual('totalPrice').get(function() {
    return this.newPrice * this.players;
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
