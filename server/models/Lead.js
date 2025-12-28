const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    // 👇 שיניתי: הטלפון כבר לא חובה ברמת הדאטה-בייס (הולידציה נעשית בקליינט)
    phone: { type: String }, 
    email: { type: String },
    interest: String, // באיזה חדר התעניין
    source: String,
    status: {
        type: String,
        enum: ['new', 'contacted', 'converted', 'closed'],
        default: 'new'
    },
    notes: String
}, { timestamps: true });

module.exports = mongoose.model('Lead', LeadSchema);