// models/Inquiry.js
const mongoose = require('mongoose');

const InquirySchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: String,
    phone: { type: String, required: true },
    message: String,
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Inquiry', InquirySchema);