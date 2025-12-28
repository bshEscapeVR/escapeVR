// controllers/settingsController.js
const SiteSettings = require('../models/SiteSettings');
const asyncHandler = require('../utils/asyncHandler');

exports.getSettings = asyncHandler(async (req, res, next) => {
    let settings = await SiteSettings.findOne();
    
    // אם אין הגדרות בכלל, ניצור ברירת מחדל ריקה כדי שהקלינט לא יקרוס
    if (!settings) {
        settings = await SiteSettings.create({});
    }

    res.status(200).json({
        status: 'success',
        data: settings
    });
});

exports.updateSettings = asyncHandler(async (req, res, next) => {
    const settings = await SiteSettings.findOneAndUpdate(
        {}, 
        req.body, 
        { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
        status: 'success',
        data: settings
    });
});