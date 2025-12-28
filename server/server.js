// server/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mainRouter = require('./routes/index');
const errorMiddleware = require('./middleware/errorMiddleware');
const uploadRouter = require('./routes/upload');

const app = express();

// 1. חובה עבור Render (כדי לזהות כתובות IP נכון מאחורי הפרוקסי)
app.set('trust proxy', 1);

// 2. אבטחה (Helmet)
// מאפשר טעינת תמונות ממקורות אחרים (כדי שהאתר יוכל להציג תמונות מהשרת/Cloudinary)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// 3. הגבלת בקשות (Rate Limiting)
// מונע הצפה של השרת. כרגע מוגדר ל-1000 בקשות ב-15 דקות (נדיב לפיתוח)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 1000, 
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// 4. הגדרות CORS חכמות (התיקון הקריטי)
const corsOptions = {
    origin: (origin, callback) => {
        // א. אפשר בקשות ללא origin (כמו Postman, שרת-לשרת, או גלישה ישירה ל-API)
        if (!origin) return callback(null, true);

        // ב. טעינת רשימת הכתובות המאושרות מקובץ ה-.env
        const allowedOrigins = process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',').map(url => url.trim())
            : ['http://localhost:3000', 'http://localhost:5173']; // ברירת מחדל לפיתוח

        // ג. בדיקה: האם הכתובת נמצאת ברשימה הקבועה?
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // ד. בדיקה: האם הכתובת היא דומיין של Vercel? (כולל כתובות Preview זמניות)
        if (origin.endsWith('.vercel.app')) {
            // לוג שיעזור לנו לראות ב-Render שזה עובד
            console.log(`✅ CORS allowed Dynamic Vercel origin: ${origin}`);
            return callback(null, true);
        }

        // ה. אם שום דבר לא מתאים - חסום
        console.error(`❌ CORS Blocked origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true // חובה כדי לאפשר עוגיות/טוקנים
};

app.use(cors(corsOptions));
app.use(express.json());

// 5. חיבור למסד הנתונים
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vr_escape')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// 6. נתיבים (Routes)
// גיבוי: הגשת קבצים מקומיים (אם נשארו כאלה לפני המעבר ל-Cloudinary)
app.use('/uploads', express.static('uploads'));

// נתיבי API
app.use('/api/upload', uploadRouter);
app.use('/api', mainRouter);

// 7. טיפול בשגיאות 404 (נתיב לא קיים)
app.all(/(.*)/, (req, res, next) => {
    const AppError = require('./utils/AppError');
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 8. טיפול בשגיאות כלליות
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));