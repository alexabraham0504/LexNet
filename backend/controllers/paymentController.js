const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Lawyer = require('../models/Lawyer');
const User = require('../models/User');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Meeting = require('../models/Meeting');

// Initialize Razorpay with proper environment variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create a Razorpay order
exports.createOrder = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID is required"
      });
    }
    
    // Get appointment details
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }
    
    // Get lawyer details to determine fees
    const lawyer = await Lawyer.findById(appointment.lawyerId);
    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: "Lawyer not found"
      });
    }
    
    // Extract fee amount (remove ₹ symbol and convert to number)
    const feeString = lawyer.consultationFees || "₹1000";
    const feeAmount = parseInt(feeString.replace(/[^\d]/g, '')) * 100; // Convert to paise
    
    // Create Razorpay order
    const options = {
      amount: feeAmount,
      currency: "INR",
      receipt: `receipt_${appointmentId}`,
      notes: {
        appointmentId: appointmentId,
        lawyerName: lawyer.fullName || lawyer.name,
        clientName: appointment.clientName
      }
    };
    
    console.log("Creating Razorpay order with options:", options);
    
    const order = await razorpay.orders.create(options);
    console.log("Razorpay order created:", order);
    
    // Find client user ID if available
    let clientId = null;
    try {
      const user = await User.findOne({ email: appointment.clientEmail });
      if (user) {
        clientId = user._id;
      }
    } catch (error) {
      console.log("Error finding client user:", error);
      // Continue without client ID
    }
    
    // Create a new payment record
    const payment = new Payment({
      appointmentId: appointment._id,
      lawyerId: appointment.lawyerId,
      clientId: clientId,
      orderId: order.id,
      amount: feeAmount / 100, // Store in rupees
      currency: "INR",
      status: 'created',
      feeType: 'consultation',
      description: `Appointment with ${lawyer.fullName || lawyer.name} on ${new Date(appointment.appointmentDate).toLocaleDateString()} at ${appointment.appointmentTime}`,
      createdAt: new Date()
    });
    
    await payment.save();
    
    // Update appointment with payment status and reference
    appointment.paymentStatus = 'pending';
    appointment.paymentId = payment._id;
    await appointment.save();
    
    // Return order details to client
    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        lawyerName: lawyer.fullName || lawyer.name,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime
      }
    });
    
  } catch (error) {
    console.error("Error creating payment order:", error);
    res.status(500).json({
      success: false,
      message: "Error creating payment order",
      error: error.message
    });
  }
};

// Verify payment
exports.verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature,
      appointmentId 
    } = req.body;
    
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !appointmentId) {
      return res.status(400).json({
        success: false,
        message: "All payment details are required"
      });
    }
    
    // Get appointment details
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }
    
    // Find the payment record
    const payment = await Payment.findOne({ 
      appointmentId: appointment._id,
      orderId: razorpay_order_id
    });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found"
      });
    }
    
    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
    
    const isAuthentic = expectedSignature === razorpay_signature;
    
    if (isAuthentic) {
      // Get payment details from Razorpay
      const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
      
      // Update payment record
      payment.paymentId = razorpay_payment_id;
      payment.status = paymentDetails.status || 'captured';
      payment.paymentMethod = paymentDetails.method;
      payment.razorpayResponse = paymentDetails;
      payment.paidAt = new Date();
      payment.updatedAt = new Date();
      
      await payment.save();
      
      // Update appointment status
      appointment.paymentStatus = 'completed';
      appointment.status = 'confirmed';
      
      await appointment.save();
      
      res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        appointment,
        payment: {
          id: payment._id,
          status: payment.status,
          amount: payment.amount,
          paidAt: payment.paidAt
        }
      });
    } else {
      // Payment verification failed
      payment.status = 'failed';
      payment.updatedAt = new Date();
      await payment.save();
      
      appointment.paymentStatus = 'failed';
      await appointment.save();
      
      res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
    }
    
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: error.message
    });
  }
};

// Get payment status
exports.getPaymentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }
    
    // Get payment details if available
    let paymentDetails = null;
    if (appointment.paymentId) {
      const payment = await Payment.findById(appointment.paymentId);
      if (payment) {
        paymentDetails = {
          id: payment._id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          paidAt: payment.paidAt,
          paymentMethod: payment.paymentMethod
        };
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        appointmentId: appointment._id,
        paymentStatus: appointment.paymentStatus,
        appointmentStatus: appointment.status,
        payment: paymentDetails
      }
    });
    
  } catch (error) {
    console.error("Error getting payment status:", error);
    res.status(500).json({
      success: false,
      message: "Error getting payment status",
      error: error.message
    });
  }
};

// Get all payments for a lawyer
exports.getLawyerPayments = async (req, res) => {
  try {
    const { lawyerId } = req.params;
    
    const payments = await Payment.find({ 
      lawyerId,
      status: { $in: ['captured', 'authorized'] }
    })
    .sort({ paidAt: -1 })
    .populate('appointmentId', 'appointmentDate appointmentTime clientName');
    
    const totalEarnings = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    res.status(200).json({
      success: true,
      data: {
        payments,
        totalEarnings,
        count: payments.length
      }
    });
    
  } catch (error) {
    console.error("Error fetching lawyer payments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching lawyer payments",
      error: error.message
    });
  }
};

// Get payment statistics for a lawyer
exports.getLawyerPaymentStats = async (req, res) => {
  try {
    const { lawyerId } = req.params;
    
    // Get current date
    const now = new Date();
    
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    // Get all successful payments
    const allPayments = await Payment.find({
      lawyerId,
      status: { $in: ['captured', 'authorized'] }
    });
    
    // Get payments in the last 30 days
    const recentPayments = await Payment.find({
      lawyerId,
      status: { $in: ['captured', 'authorized'] },
      paidAt: { $gte: thirtyDaysAgo }
    });
    
    // Calculate total earnings
    const totalEarnings = allPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Calculate earnings in the last 30 days
    const recentEarnings = recentPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Group payments by fee type
    const earningsByType = {};
    allPayments.forEach(payment => {
      if (!earningsByType[payment.feeType]) {
        earningsByType[payment.feeType] = 0;
      }
      earningsByType[payment.feeType] += payment.amount;
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        recentEarnings,
        totalPayments: allPayments.length,
        recentPayments: recentPayments.length,
        earningsByType
      }
    });
    
  } catch (error) {
    console.error("Error fetching payment statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payment statistics",
      error: error.message
    });
  }
};

// Get receipt details
exports.getReceiptDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await Payment.findById(paymentId)
      .populate('appointmentId', 'appointmentDate appointmentTime clientName clientEmail clientPhone notes')
      .populate('lawyerId', 'fullName name email phone specialization consultationFees');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }
    
    // Format the receipt data
    const receiptData = {
      receiptNumber: payment.receiptNumber,
      paymentId: payment._id,
      orderId: payment.orderId,
      razorpayPaymentId: payment.paymentId,
      date: payment.paidAt || payment.createdAt,
      clientDetails: {
        name: payment.appointmentId.clientName,
        email: payment.appointmentId.clientEmail,
        phone: payment.appointmentId.clientPhone
      },
      lawyerDetails: {
        name: payment.lawyerId.fullName || payment.lawyerId.name,
        specialization: payment.lawyerId.specialization,
        email: payment.lawyerId.email,
        phone: payment.lawyerId.phone
      },
      appointmentDetails: {
        date: payment.appointmentId.appointmentDate,
        time: payment.appointmentId.appointmentTime,
        notes: payment.appointmentId.notes
      },
      paymentDetails: {
        amount: payment.amount,
        currency: payment.currency,
        method: payment.paymentMethod,
        status: payment.status,
        description: payment.description,
        feeType: payment.feeType
      }
    };
    
    res.status(200).json({
      success: true,
      data: receiptData
    });
    
  } catch (error) {
    console.error("Error getting receipt details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting receipt details",
      error: error.message
    });
  }
};

// Get all receipts for a client
exports.getClientReceipts = async (req, res) => {
  try {
    const { clientEmail } = req.params;
    
    // Find appointments for this client
    const appointments = await Appointment.find({ clientEmail });
    
    if (!appointments || appointments.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          receipts: []
        }
      });
    }
    
    // Get appointment IDs
    const appointmentIds = appointments.map(app => app._id);
    
    // Find payments for these appointments
    const payments = await Payment.find({ 
      appointmentId: { $in: appointmentIds },
      status: { $in: ['captured', 'authorized'] }
    })
    .populate('appointmentId', 'appointmentDate appointmentTime')
    .populate('lawyerId', 'fullName name');
    
    // Format the receipts
    const receipts = payments.map(payment => ({
      receiptId: payment._id,
      receiptNumber: payment.receiptNumber,
      date: payment.paidAt || payment.createdAt,
      amount: payment.amount,
      currency: payment.currency,
      lawyerName: payment.lawyerId.fullName || payment.lawyerId.name,
      appointmentDate: payment.appointmentId.appointmentDate,
      appointmentTime: payment.appointmentId.appointmentTime
    }));
    
    res.status(200).json({
      success: true,
      data: {
        receipts,
        count: receipts.length
      }
    });
    
  } catch (error) {
    console.error("Error getting client receipts:", error);
    res.status(500).json({
      success: false,
      message: "Error getting client receipts",
      error: error.message
    });
  }
};

exports.createVideoCallOrder = async (req, res) => {
  try {
    const { roomId, clientId, clientEmail } = req.body;

    // Get meeting and lawyer details with proper population
    const meeting = await Meeting.findOne({ roomName: roomId })
      .populate({
        path: 'lawyerId',
        select: 'videoCallFees fullName'
      });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found"
      });
    }

    // Get the lawyer's video call fees
    // Remove the ₹ symbol and convert to number if it's a string
    let videoCallFees = meeting.lawyerId.videoCallFees;
    if (typeof videoCallFees === 'string') {
      videoCallFees = Number(videoCallFees.replace(/[^0-9.-]+/g, ""));
    }

    // Ensure we have a valid fee amount
    if (!videoCallFees || isNaN(videoCallFees)) {
      console.error("Invalid video call fees:", meeting.lawyerId.videoCallFees);
      return res.status(400).json({
        success: false,
        message: "Invalid video call fees configuration"
      });
    }

    // Convert fee to paise (Razorpay expects amount in smallest currency unit)
    const amount = Math.round(videoCallFees * 100);

    // Create a shorter receipt ID (max 40 chars)
    const shortRoomId = roomId.substring(0, 20);
    const timestamp = Date.now().toString().substring(0, 10);
    const receipt = `vc-${shortRoomId}-${timestamp}`;

    // Create Razorpay order with validated parameters
    const order = await razorpay.orders.create({
      amount: amount,
      currency: "INR",
      receipt: receipt,
      notes: {
        roomId: roomId,
        clientId: clientId || 'guest',
        service: 'video-call',
        lawyerName: meeting.lawyerId.fullName
      }
    });

    // Create payment record
    const payment = new Payment({
      appointmentId: meeting._id,
      lawyerId: meeting.lawyerId._id,
      clientId: clientId,
      orderId: order.id,
      amount: videoCallFees, // Store original amount, not paise
      feeType: 'videoCall',
      description: 'Video Call Consultation Fee',
      status: 'created'
    });
    await payment.save();

    // Update meeting with payment reference
    meeting.paymentId = payment._id;
    await meeting.save();

    res.status(200).json({
      success: true,
      order,
      amount: videoCallFees // Send original amount for display
    });

  } catch (error) {
    console.error("Error creating video call order:", error);
    res.status(500).json({
      success: false,
      message: "Error creating payment order",
      error: error.message
    });
  }
};

exports.verifyVideoCallPayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      roomId
    } = req.body;

    console.log("Verifying payment for room:", roomId);
    console.log("Payment details:", { razorpay_payment_id, razorpay_order_id });

    // First check if the order exists
    const payment = await Payment.findOne({ orderId: razorpay_order_id });
    if (!payment) {
      console.log("Payment record not found for order:", razorpay_order_id);
      return res.status(404).json({
        success: false,
        message: "Payment record not found"
      });
    }

    // Find the meeting by roomName
    const meeting = await Meeting.findOne({ roomName: roomId });
    
    if (!meeting) {
      console.log("Meeting not found for room:", roomId);
      return res.status(404).json({
        success: false,
        message: "Meeting not found"
      });
    }

    // Verify signature
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');
    
    console.log("Signature verification:", { 
      generated: digest, 
      received: razorpay_signature,
      match: digest === razorpay_signature 
    });
    
    if (digest === razorpay_signature) {
      // Update payment record
      payment.status = 'captured';
      payment.paymentId = razorpay_payment_id;
      payment.paidAt = new Date();
      await payment.save();
      console.log("Payment record updated:", payment._id);

      // Update meeting status
      meeting.paymentStatus = 'completed';
      meeting.paymentId = payment._id;
      await meeting.save();
      console.log("Meeting payment status updated to completed:", meeting._id);

      res.status(200).json({
        success: true,
        message: "Payment verified successfully"
      });
    } else {
      console.log("Signature verification failed");
      res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
    }
  } catch (error) {
    console.error("Error verifying video call payment:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: error.message
    });
  }
};

exports.getVideoCallPaymentStatus = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    console.log("Checking payment status for room:", roomId);
    
    // Find the meeting by roomName
    const meeting = await Meeting.findOne({ roomName: roomId });
    if (!meeting) {
      console.log("Meeting not found for room:", roomId);
      return res.status(404).json({
        success: false,
        message: "Meeting not found"
      });
    }

    console.log("Meeting found:", meeting._id, "Payment status:", meeting.paymentStatus);
    
    // Check if payment is completed directly from meeting
    if (meeting.paymentStatus === 'completed') {
      return res.status(200).json({
        success: true,
        isPaid: true
      });
    }

    // Double-check with payment record if available
    if (meeting.paymentId) {
      const payment = await Payment.findById(meeting.paymentId);
      if (payment && payment.status === 'captured') {
        // Update meeting status if needed
        if (meeting.paymentStatus !== 'completed') {
          meeting.paymentStatus = 'completed';
          await meeting.save();
          console.log("Updated meeting payment status to completed");
        }
        
        return res.status(200).json({
          success: true,
          isPaid: true
        });
      }
    }

    res.status(200).json({
      success: true,
      isPaid: false
    });
  } catch (error) {
    console.error("Error checking video call payment status:", error);
    res.status(500).json({
      success: false,
      message: "Error checking payment status",
      error: error.message
    });
  }
}; 