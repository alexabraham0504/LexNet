const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  lawyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lawyer",
    required: true,
  },
  clientName: {
    type: String,
    required: true,
  },
  clientEmail: {
    type: String,
    required: true,
  },
  clientPhone: {
    type: String,
    required: true,
  },
  appointmentDate: {
    type: Date,
    required: true,
  },
  appointmentTime: {
    type: String,
    required: true,
  },
  notes: String,
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  rescheduleRequest: {
    requested: { type: Boolean, default: false },
    reason: String,
    proposedDate: Date,
    proposedTime: String,
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected', null],
      default: null
    }
  },
});

module.exports = mongoose.model("Appointment", appointmentSchema);
