//server/server.js
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
app.set('trust proxy', 1);
// Security: Helmet for HTTP headers
// app.use(helmet());
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Rate Limiter: 100 requests per 15 minutes
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100, // limit each IP to 100 requests per windowMs
//     message: 'Too many requests from this IP, please try again after 15 minutes'
// });

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 דקות
    max: 1000, // 👇 הגדלנו מ-100 ל-1000 כדי שלא ייחסם בפיתוח
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

// CORS: Dynamic origin validation
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:5173'];

// Regex patterns for dynamic origins
const vercelPattern = /\.vercel\.app$/;

console.log('Allowed CORS origins:', allowedOrigins);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like server-to-server, Postman, curl)
        if (!origin) return callback(null, true);

        // Allow wildcard
        if (allowedOrigins.includes('*')) {
            return callback(null, true);
        }

        // Allow if in static list
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Allow any Vercel subdomain (preview deployments, production)
        if (vercelPattern.test(origin)) {
            console.log('CORS allowed Vercel origin:', origin);
            return callback(null, true);
        }

        // Block everything else
        console.warn('CORS blocked origin:', origin);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vr_escape')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error(err));

// Legacy: Keep static uploads route as backup for old local files
app.use('/uploads', express.static('uploads'));
app.use('/api/upload', uploadRouter);
app.use('/api', mainRouter);

// 👇 התיקון כאן: שימוש ב- /(.*)/ במקום '*'
app.all(/(.*)/, (req, res, next) => {
    const AppError = require('./utils/AppError');
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));