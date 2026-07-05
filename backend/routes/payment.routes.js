const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/payment.controller');

router.post('/create-intent', ctrl.createPaymentIntent);
router.post('/process', ctrl.processPayment);
router.get('/status/:orderId', ctrl.getPaymentStatus);
router.get('/admin/list', protect, authorize('admin'), ctrl.getAdminPayments);

module.exports = router;
