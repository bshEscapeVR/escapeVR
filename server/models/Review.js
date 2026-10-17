// models/Review.js
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    authorName: { type: String, required: true },
    email: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' }, // אופציונלי - אם הביקורת על חדר ספציפי
    isApproved: { type: Boolean, default: false }, // דורש אישור מנהל כדי להופיע באתר
    dateDisplay: String, // "לפני יומיים" או תאריך טקסטואלי אם רוצים לשמר מקור

    // מקור הביקורת - טופס באתר או סנכרון מגוגל מפות
    source: { type: String, enum: ['website', 'google'], default: 'website' },
    externalId: { type: String, unique: true, sparse: true }, // מזהה הביקורת בגוגל (מונע כפילויות)
    externalUrl: String,     // קישור לביקורת בגוגל מפות
    authorPhotoUrl: String,
    publishedAt: Date        // תאריך פרסום המקורי בגוגל
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);