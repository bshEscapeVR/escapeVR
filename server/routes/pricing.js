// server/routes/pricing.js
const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricingController');
const auth = require('../middleware/auth');

// Admin routes (require authentication) - must come BEFORE /:id
router.get('/admin/all', auth, pricingController.getAllPricingPlansAdmin);
router.patch('/admin/reorder', auth, pricingController.reorderPricingPlans);

// Public routes
router.get('/', pricingController.getAllPricingPlans);
router.get('/:id', pricingController.getPricingPlan);

// Protected CRUD routes
router.post('/', auth, pricingController.createPricingPlan);
router.patch('/:id', auth, pricingController.updatePricingPlan);
router.delete('/:id', auth, pricingController.deletePricingPlan);

module.exports = router;
