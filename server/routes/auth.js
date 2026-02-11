const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');

// Rate limiter for login - 5 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: 'Too many login attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Helper: sign JWT token securely
const signToken = (adminId) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not set');
    }
    return jwt.sign({ id: adminId }, process.env.JWT_SECRET, { expiresIn: '4h' });
};

// @route   POST /api/auth/login
// @desc    Authenticate admin & get token
router.post('/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    try {
        const admin = await Admin.findOne({ username });
        if (!admin) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            admin.failedAttempts = (admin.failedAttempts || 0) + 1;
            await admin.save();
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Reset failed attempts and update lastLogin on success
        admin.failedAttempts = 0;
        admin.lastLogin = new Date();
        await admin.save();

        const token = signToken(admin._id);
        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/auth/verify
// @desc    Verify token validity
router.get('/verify', auth, (req, res) => {
    res.json({ valid: true, userId: req.user.id });
});

// @route   POST /api/auth/refresh
// @desc    Refresh token - returns new token if current one is still valid
router.post('/refresh', auth, (req, res) => {
    try {
        const newToken = signToken(req.user.id);
        res.json({ token: newToken });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/register-initial
// @desc    One-time use - create first admin only if NO admins exist in the system
router.post('/register-initial', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    try {
        // Block registration if any admin already exists
        const adminCount = await Admin.countDocuments();
        if (adminCount > 0) {
            return res.status(403).json({ message: 'Registration disabled' });
        }

        const admin = new Admin({ username, password });
        await admin.save();

        res.json({ message: 'Admin created successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
