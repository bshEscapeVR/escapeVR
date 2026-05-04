require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mainRouter = require('./routes/index');
const errorMiddleware = require('./middleware/errorMiddleware');
const uploadRouter = require('./routes/upload');

// === Verify required environment variables on startup ===
const requiredEnvVars = ['JWT_SECRET', 'MONGO_URI'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`FATAL: ${envVar} environment variable is not set. Server cannot start.`);
        process.exit(1);
    }
}

const app = express();

// 1. Trust proxy (required for Render / reverse proxy to identify client IPs correctly)
app.set('trust proxy', 1);

// 2. Security headers (Helmet)
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

// 3. Global rate limiting (500 requests per 15 minutes)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// 4. CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (server-to-server, Postman, SSR)
        if (!origin) return callback(null, true);

        // Load allowed origins from .env
        const allowedOrigins = process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',').map(url => url.trim())
            : ['http://localhost:3000', 'http://localhost:5173'];

        // Exact match from allowlist
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Allow Vercel preview deployments and production domain
        if (origin.endsWith('.vercel.app') || origin.includes('escapevr.co.il')) {
            return callback(null, true);
        }

        // Block everything else
        console.warn(`CORS blocked origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
};

app.use(cors(corsOptions));

// 5. Body parsing & NoSQL injection prevention
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false })); // required for uPay IPN callbacks

// Custom mongo sanitization (express-mongo-sanitize is incompatible with Express 5)
app.use((req, res, next) => {
    const sanitize = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        for (const key of Object.keys(obj)) {
            if (key.startsWith('$') || key.includes('.')) {
                delete obj[key];
            } else if (typeof obj[key] === 'object') {
                sanitize(obj[key]);
            }
        }
        return obj;
    };
    if (req.body) sanitize(req.body);
    next();
});

// 6. Database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    });

// 7. Health check (useful for Render & debugging)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 8. Routes
app.use('/uploads', express.static('uploads'));
app.use('/v1/upload', uploadRouter);
app.use('/v1', mainRouter);

// 9. 404 handler
app.all(/(.*)/, (req, res, next) => {
    const AppError = require('./utils/AppError');
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 10. Global error handler
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
