//routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');

// @route   POST /api/auth/login
// @desc    Authenticate admin & get token
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // בדיקה אם משתמש קיים
        const admin = await Admin.findOne({ username });
        if (!admin) return res.status(400).json({ message: 'Invalid credentials' });

        // בדיקת סיסמה
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // יצירת טוקן
        jwt.sign(
            { id: admin._id },
            process.env.JWT_SECRET || 'secretkey123',
            { expiresIn: '12h' }, // תוקף ל-12 שעות
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @route   GET /api/auth/verify
// @desc    בדיקת תוקף הטוקן
router.get('/verify', auth, (req, res) => {
    res.json({ valid: true, userId: req.user.id });
});

// @route   POST /api/auth/register-initial
// @desc    שימוש חד פעמי ליצירת המנהל הראשון
// @route   POST /api/auth/register-initial
// @desc    נתיב זמני ליצירת המנהל הראשון
router.post('/register-initial', async (req, res) => {
    const { username, password } = req.body;
    try {
        // בדיקה אם המשתמש כבר קיים כדי למנוע כפילויות
        let admin = await Admin.findOne({ username });
        if (admin) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        // יצירת המנהל (הסיסמה תוצפן אוטומטית במודל)
        admin = new Admin({ username, password });
        await admin.save();

        res.json({ message: 'Admin created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;