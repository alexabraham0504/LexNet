const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { isAuthenticated } = require('../middleware/auth');

// Create a payment order
router.post('/create-order', paymentController.createOrder);

// Verify payment
router.post('/verify', paymentController.verifyPayment);

// Get payment status
router.get('/status/:appointmentId', paymentController.getPaymentStatus);

// Get all payments for a lawyer
router.get('/lawyer/:lawyerId', isAuthenticated, paymentController.getLawyerPayments);

// Get payment statistics for a lawyer
router.get('/lawyer/:lawyerId/stats', isAuthenticated, paymentController.getLawyerPaymentStats);

// Get receipt details
router.get('/receipt/:paymentId', paymentController.getReceiptDetails);

// Get all receipts for a client
router.get('/receipts/client/:clientEmail', paymentController.getClientReceipts);

// Add these new routes
router.post('/create-video-call-order', paymentController.createVideoCallOrder);
router.post('/verify-video-call', paymentController.verifyVideoCallPayment);
router.get('/status/video-call/:roomId', paymentController.getVideoCallPaymentStatus);

module.exports = router; 