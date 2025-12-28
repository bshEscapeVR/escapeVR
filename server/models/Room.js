// models/Room.js
const mongoose = require('mongoose');
const BilingualSchema = require('./Schemas/BilingualSchema');

const RoomSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true }, // למשל: 'submarine-vr' (טוב ל-URL)
    
    title: { type: BilingualSchema, required: true },
    subtitle: { type: BilingualSchema },
    description: { type: BilingualSchema, required: true },
    
    // מידע טכני שראינו בכרטיסים
    features: {
        durationMinutes: { type: Number, default: 60 },
        difficultyLevel: { type: Number, min: 1, max: 5, default: 3 },
        minPlayers: { type: Number, required: true },
        maxPlayers: { type: Number, required: true },
        isVr: { type: Boolean, default: true }
    },

    // מדיה
    images: {
        main: { type: String, required: true }, // תמונה ראשית
        gallery: [String], // גלריה
        trailerUrl: String
    },

    // מחירים (מפה של כמות משתתפים -> מחיר)
    pricing: {
        basePrice: { type: Number, required: true }, // מחיר בסיס למינימום שחקנים
        personPenalty: { type: Number, default: 0 }, // תוספת לאדם מעל הבסיס
        overrides: {
            type: Map,
            of: Number,
            default: {} 
            // דוגמה: { "2": 270, "3": 365 } - מאפשר לדרוס מחיר ספציפי לכמות אנשים
        }
    },

    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 } // לסידור החדרים באתר
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);