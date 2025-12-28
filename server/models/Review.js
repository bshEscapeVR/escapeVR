// models/Review.js
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    authorName: { type: String, required: true },
    email: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' }, // אופציונלי - אם הביקורת על חדר ספציפי
    isApproved: { type: Boolean, default: false }, // דורש אישור מנהל כדי להופיע באתר
    dateDisplay: String // "לפני יומיים" או תאריך טקסטואלי אם רוצים לשמר מקור
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);