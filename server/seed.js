//server/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const Room = require('./models/Room');
const SiteSettings = require('./models/SiteSettings');

if (!process.env.MONGO_URI) {
    console.error('❌  MONGO_URI is not set in .env');
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected for Seeding...'))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

const seedData = async () => {
    try {
        // 1. ניקוי הדאטה-בייס
        await Room.deleteMany({});
        await SiteSettings.deleteMany({});
        console.log('🧹 Old data cleaned.');

        // 2. יצירת חדרים (לפי התמונות)
        const rooms = [
            {
                slug: 'abandoned-hostel',
                title: { he: "ההוסטל הנטוש", en: "The Abandoned Hostel" },
                subtitle: { he: "למדים בבית המשוגעים - ברוכים הבאים לאי-שפיות!", en: "Trapped in insanity - Welcome to the asylum!" },
                description: { 
                    he: "מתקדמים בבית משוגעים נטוש. צללים מרחפים, קולות מוזרים ואווירה שתגרום לכם להטיל ספק במציאות. האם תצליחו לברוח לפני שתהפכו לחלק מהדיירים?", 
                    en: "Navigate through an abandoned asylum. Creepy shadows, strange noises, and an atmosphere that will make you question reality. Can you escape before you become one of the residents?" 
                },
                features: {
                    durationMinutes: 60,
                    difficultyLevel: 4,
                    minPlayers: 2,
                    maxPlayers: 4,
                    isVr: true
                },
                images: {
                    // main: "https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1000&auto=format&fit=crop", // תמונה אפלה להוסטל
                    main: "../../public/images/abandoned-hostel.jpg", // תמונה אפלה להוסטל
                },
                pricing: {
                    basePrice: 0, // המחיר מחושב לפי overrides
                    overrides: { "2": 270, "3": 365, "4": 450 }
                },
                order: 1
            },
            {
                slug: 'pyramid-mystery',
                title: { he: "תעלומת הפירמידה המצרית", en: "Mystery of the Pyramid" },
                subtitle: { he: "טיסה ישירה למצרים העתיקה: האם תצליחו לגנוב את הסודות?", en: "Direct flight to Ancient Egypt: Can you steal the secrets?" },
                description: { 
                    he: "מסע בזמן אל לב הפירמידות. פענחו כתבי חידה עתיקים, התחמקו ממלכודות פרעונים ומצאו את האוצר האבוד לפני שהחמצן נגמר.", 
                    en: "Time travel to the heart of the pyramids. Decipher ancient riddles, dodge pharaoh traps, and find the lost treasure before oxygen runs out." 
                },
                features: {
                    durationMinutes: 60,
                    difficultyLevel: 3,
                    minPlayers: 2,
                    maxPlayers: 4,
                    isVr: true
                },
                images: {
                    // main: "https://images.unsplash.com/photo-1569429593410-15339d3c52e1?q=80&w=1000&auto=format&fit=crop", // פירמידה/זהב
                    main: "../../public/images/pyramid.jpg", // פירמידה/זהב
                },
                pricing: {
                    basePrice: 0,
                    overrides: { "2": 270, "3": 365, "4": 450 }
                },
                order: 2
            },
            {
                slug: 'captain-nemo',
                title: { he: "קפטן נמו והצוללת הלכודה", en: "Captain Nemo's Submarine" },
                subtitle: { he: "מתחת למים: קרב יריות נגד מפלצת ים מיתית!", en: "Underwater: A shootout against a mythical sea monster!" },
                description: { 
                    he: "צללו למעמקים בצוללת סטימפאנק מתקדמת. המנועים מושבתים, המים חודרים, וקראקן ענק מאיים לרסק אתכם. עבודת צוות היא הדרך היחידה לשרוד.", 
                    en: "Dive deep in an advanced steampunk submarine. Engines are down, water is leaking, and a giant Kraken is threatening to crush you. Teamwork is the only way to survive." 
                },
                features: {
                    durationMinutes: 60,
                    difficultyLevel: 5,
                    minPlayers: 2,
                    maxPlayers: 4,
                    isVr: true
                },
                images: {
                    // main: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop", // צוללת/מים
                    main: "../../public/images/captain-nemo.jpg", // צוללת/מים
                },
                pricing: {
                    basePrice: 0,
                    overrides: { "2": 270, "3": 365, "4": 450 }
                },
                order: 3
            }
        ];

        await Room.insertMany(rooms);
        console.log('✅ Rooms seeded successfully.');

        // 3. יצירת הגדרות ברירת מחדל (Settings)
        const settings = {
            general: {
                siteName: { he: "VR Escape Reality", en: "VR Escape Reality" },
                contactPhone: "053-4167771",
                contactEmail: "escapevr.bsh@gmail.com",
                showBanner: true,
                bannerText: { he: "אתר בהרצה - 20% הנחה להזמנות הראשונות!", en: "Soft Launch - 20% OFF for first bookings!" }
            },
            content: {
                hero: {
                    title: { he: "בחרו את ההרפתקה שלכם", en: "Choose Your Adventure" },
                    subtitle: { he: "שלושה עולמות ייחודיים, שלושה אתגרים בלתי נשכחים. מאיזו מציאות תברחו?", en: "Three unique worlds, three unforgettable challenges. Which reality will you escape?" },
                    ctaButton: { he: "הזמן עכשיו", en: "Book Now" }
                }
            },
            seo: {
                home: {
                    title: { he: "VR Escape | חדרי בריחה במציאות מדומה", en: "VR Escape | Virtual Reality Escape Rooms" },
                    description: { he: "חווית ה-VR המתקדמת בישראל. בואו לברוח מהמציאות.", en: "The most advanced VR experience in Israel. Come escape reality." }
                }
            }
        };

        await SiteSettings.create(settings);
        console.log('✅ Settings seeded successfully.');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();