const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    bookingId: { type: String, unique: true }, // מזהה קריא (למשל: #8293)
    
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true }, // "18:00"
    
    customer: {
        fullName: { type: String, required: true },
        email: { type: String }, // לא חובה (אולי הזמנה טלפונית ללא מייל)
        phone: { type: String, required: true }, // טלפון חובה להזמנה
        notes: String
    },

    details: {
        participantsCount: { type: Number, required: true },
        totalPrice: { type: Number, required: true }
    },

    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
        default: 'confirmed'
    },
    
    source: {
        type: String,
        enum: ['website', 'phone', 'walk-in', 'whatsapp'],
        default: 'website'
    },

    // Soft delete
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// אינדקס למניעת הזמנות כפולות (אותו חדר, אותו תאריך, אותה שעה - אלא אם בוטל או נמחק)
BookingSchema.index({ roomId: 1, date: 1, timeSlot: 1 }, {
    unique: true,
    partialFilterExpression: {
        status: { $ne: "cancelled" },
        isDeleted: { $ne: true }
    }
});

module.exports = mongoose.model('Booking', BookingSchema);