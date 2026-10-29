// server/routes/coupons.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const couponController = require('../controllers/couponController');

// Public - check a code from the booking form
router.post('/validate', couponController.validateCoupon);

// Admin only - coupon series for a partner / club (must come before /:id routes)
router.post('/batch', auth, couponController.createBatch);
router.get('/campaign', auth, couponController.getCampaignReport);
router.patch('/campaign', auth, couponController.updateCampaign);
router.delete('/campaign', auth, couponController.deleteCampaign);

// Admin only
router.get('/', auth, couponController.getCoupons);
router.post('/', auth, couponController.createCoupon);
router.patch('/:id', auth, couponController.updateCoupon);
router.delete('/:id', auth, couponController.deleteCoupon);

module.exports = router;
