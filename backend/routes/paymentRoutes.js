const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Add all payment routes here
router.post('/create-order', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);
router.get('/status/:appointmentId', paymentController.getPaymentStatus);
router.get('/lawyer/:lawyerId', paymentController.getLawyerPayments);
router.get('/stats/:lawyerId', paymentController.getLawyerPaymentStats);
router.get('/receipt/:paymentId', paymentController.getReceiptDetails);
router.get('/client/:clientEmail', paymentController.getClientReceipts);
router.post('/create-video-call-order', paymentController.createVideoCallOrder);
router.post('/verify-video-call', paymentController.verifyVideoCallPayment);
router.get('/video-call-status/:roomId', paymentController.getVideoCallPaymentStatus);

// Add the store payment route
router.post('/store', paymentController.storePayment);

module.exports = router; 