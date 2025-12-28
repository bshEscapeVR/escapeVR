const mongoose = require('mongoose');

const BlockedDateSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        default: ''
    },
    isFullDay: {
        type: Boolean,
        default: true
    },
    blockedSlots: {
        type: [String], // e.g. ["10:00", "11:30"]
        default: []
    }
}, { timestamps: true });

// Index for quick date lookups
BlockedDateSchema.index({ date: 1 });

module.exports = mongoose.model('BlockedDate', BlockedDateSchema);
