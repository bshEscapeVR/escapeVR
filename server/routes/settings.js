// server/routes/settings.js
const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
// כאן אמור להיות גם מידלוויר לאבטחה (auth)
// const auth = require('../middleware/auth');

router.get('/', getSettings);
router.put('/', updateSettings); // אפשר להוסיף auth כאן

module.exports = router;