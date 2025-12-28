// controllers/leadController.js
const Lead = require('../models/Lead');
const asyncHandler = require('../utils/asyncHandler');

// יצירת ליד חדש (פומבי - לטופס צור קשר)
exports.createLead = asyncHandler(async (req, res) => {
    const lead = await Lead.create(req.body);
    res.status(201).json({ status: 'success', data: lead });
});

// קבלת כל הלידים (לאדמין)
exports.getAllLeads = asyncHandler(async (req, res) => {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', data: leads });
});

// עדכון סטטוס ליד (חדש -> טופל)
exports.updateLeadStatus = asyncHandler(async (req, res) => {
    const lead = await Lead.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.status(200).json({ status: 'success', data: lead });
});

// מחיקת ליד
exports.deleteLead = asyncHandler(async (req, res) => {
    await Lead.findByIdAndDelete(req.params.id);
    res.status(204).json({ status: 'success', data: null });
});