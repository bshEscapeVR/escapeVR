// server/routes/leads.js
const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');

// Leads Routes
router.post('/', leadController.createLead);
router.get('/', leadController.getAllLeads);
router.patch('/:id', leadController.updateLeadStatus);
router.delete('/:id', leadController.deleteLead);

module.exports = router;