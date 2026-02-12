const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const leadController = require('../controllers/leadController');

// Validation schema for public contact form
const leadSchema = {
    fullName: { type: 'string', required: true, min: 2, max: 100 },
    email:    { type: 'string', required: true, max: 200, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    phone:    { type: 'string', required: false, max: 20 },
    interest: { type: 'string', required: false, max: 200 },
    notes:    { type: 'string', required: false, max: 2000 },
    marketingConsent: { type: 'boolean', required: false, default: false }
};

// Public - contact form submission
router.post('/', validate(leadSchema), leadController.createLead);

// Admin only - manage leads
router.get('/', auth, leadController.getAllLeads);
router.patch('/:id', auth, leadController.updateLeadStatus);
router.delete('/:id', auth, leadController.deleteLead);

module.exports = router;
