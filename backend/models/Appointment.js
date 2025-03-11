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
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'not_initiated'],
    default: 'not_initiated'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment"
  },
  appointmentType: {
    type: String,
    enum: ['inPerson', 'videoCall'],
    default: 'inPerson',
    required: true
  }
});

// Add a pre-find middleware to populate lawyer details
appointmentSchema.pre('find', function(next) {
  this.populate({
    path: 'lawyerId',
    select: 'fullName specialization' // Select the fields you want to populate
  });
  next();
});

// Add a pre-findOne middleware to populate lawyer details
appointmentSchema.pre('findOne', function(next) {
  this.populate({
    path: 'lawyerId',
    select: 'fullName specialization'
  });
  next();
});

// Virtual properties to get lawyer details
appointmentSchema.virtual('lawyerName').get(function() {
  return this.lawyerId ? this.lawyerId.fullName : null;
});

appointmentSchema.virtual('lawyerSpecialization').get(function() {
  return this.lawyerId ? this.lawyerId.specialization : null;
});

// Enable virtuals in JSON
appointmentSchema.set('toJSON', { virtuals: true });
appointmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("Appointment", appointmentSchema);
