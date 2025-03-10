const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    required: true,
  },
  lawyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lawyer",
    required: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  orderId: {
    type: String,
    required: true,
  },
  paymentId: String,
  receiptNumber: {
    type: String,
    unique: true
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: "INR"
  },
  status: {
    type: String,
    enum: ['created', 'authorized', 'captured', 'refunded', 'failed'],
    default: 'created'
  },
  paymentMethod: String,
  description: String,
  feeType: {
    type: String,
    enum: ['consultation', 'appointment', 'videoCall', 'caseDetails', 'caseHandling'],
    default: 'consultation'
  },
  razorpayResponse: Object,
  paidAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date
});

// Generate a unique receipt number before saving
paymentSchema.pre('save', async function(next) {
  if (this.status === 'captured' && !this.receiptNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.receiptNumber = `LN-${year}${month}-${random}`;
  }
  next();
});

module.exports = mongoose.model("Payment", paymentSchema); 