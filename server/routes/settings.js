const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getSettings, updateSettings } = require('../controllers/settingsController');

// Public - client needs settings for rendering
router.get('/', getSettings);

// Admin only - update site settings
router.put('/', auth, updateSettings);

module.exports = router;
