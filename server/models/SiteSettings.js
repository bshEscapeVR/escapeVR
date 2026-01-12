const mongoose = require('mongoose');
const BilingualSchema = require('./Schemas/BilingualSchema');

const PageSeoSchema = new mongoose.Schema({
    title: BilingualSchema,
    description: BilingualSchema,
    keywords: BilingualSchema,
    ogImage: String
}, { _id: false });

const SiteSettingsSchema = new mongoose.Schema({
    // טאב כללי ותמונות
    general: {
        siteName: BilingualSchema,
        
        // 👇 פרטי התקשרות (ערכים טכניים)
        contactPhone: String,
        contactEmail: String,
        contactAddress: BilingualSchema, // הוספתי תמיכה בכתובת דו-לשונית
        
        logoUrl: String,
        faviconUrl: String,
        showBanner: { type: Boolean, default: true },
        bannerText: BilingualSchema,

        socialLinks: {
            facebook: String,
            instagram: String,
            tiktok: String,
            whatsapp: String
        },
    },

    // טאב מדיה
    media: {
        heroImage: String,
        aboutImage: String, // התמונה של אודות
        heroVideoUrl: String,
        trailerUrl: String
    },

    // טאב תוכן (טקסטים באתר)
    content: {
        // --- Hero ---
        hero: {
            title: BilingualSchema,
            subtitle: BilingualSchema,
            description: BilingualSchema, // טקסט ארוך (אופציונלי)
            ctaButton: BilingualSchema
        },

        // --- 👇 About (חדש) ---
        about: {
            sectionTitle: BilingualSchema,       // כותרת ראשית מעל הכל (אופציונלי)
            sectionDescription: BilingualSchema, // טקסט ארוך מתחת לכותרת (אופציונלי)
            title: BilingualSchema,              // כותרת ליד התמונה
            description: BilingualSchema,        // טקסט ארוך ליד התמונה
        },

        // --- 👇 Rooms Section ---
        rooms: {
            title: BilingualSchema,
            subtitle: BilingualSchema
        },

        // --- 👇 Contact Texts (חדש) ---
        contact: {
            title: BilingualSchema,     // כותרת הסקשן ("צור קשר")
            subtitle: BilingualSchema,  // תת כותרת ("נשמח לשמוע מכם")
            talkTitle: BilingualSchema, // כותרת צד טופס ("דברו איתנו")
            talkDesc: BilingualSchema   // תיאור צד טופס
        }
    },

    // טאב SEO
    seo: {
        home: PageSeoSchema,
        rooms: PageSeoSchema,
        contact: PageSeoSchema,
        booking: PageSeoSchema
    },

    // הגדרות הזמנות
    booking: {
        // מפה של אינדקס יום (0-6) למערך שעות
        // דוגמה: { "0": ["10:00", "11:30"], "1": [...] }
        weeklyHours: { type: Map, of: [String], default: new Map() }
    },

    // פופאפ הודעת כניסה
    welcomePopup: {
        enabled: { type: Boolean, default: false },
        delaySeconds: { type: Number, default: 3 },
        title: BilingualSchema,
        content: BilingualSchema
    }

}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', SiteSettingsSchema);