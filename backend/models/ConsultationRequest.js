const mongoose = require("mongoose");

const consultationRequestSchema = new mongoose.Schema({
  lawyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lawyer",
    required: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  clientName: {
    type: String,
    required: true,
  },
  lawyerName: {
    type: String,
    required: true,
  },
  roomName: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: "Request for video consultation"
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined", "completed"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  scheduledTime: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("ConsultationRequest", consultationRequestSchema); 