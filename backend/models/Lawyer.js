const mongoose = require('mongoose');

// Check if model already exists before defining
const Lawyer = mongoose.models.Lawyer || mongoose.model('Lawyer', new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  AEN: {
    type: String,
    required: true,
    unique: true
  },
  barCouncilId: {
    type: String,
    required: true,
    unique: true
  },
  specialization: {
    type: String,
    required: true
  },
  expertise: {
    type: [String],
    default: []
  },
  ipcSections: [{
    type: String
  }],
  location: {
    address: String,
    city: String,
    state: String
  },
  availability: {
    type: Array,
    default: []
  },
  fees: {
    type: String,
    required: true
  },
  consultationFees: {
    type: String,
    default: "₹1000"
  },
  videoCallFees: {
    type: Number,
    required: true,
    default: 1000,
    set: function(value) {
      // If value is a string with ₹ symbol, convert it to number
      if (typeof value === 'string') {
        return Number(value.replace(/[^0-9.-]+/g, ""));
      }
      return value;
    },
    get: function(value) {
      return value;
    }
  },
  caseDetailsFees: {
    type: String,
    default: "₹500"
  },
  yearsOfExperience: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0
  },
  ratingsCount: {
    type: Number,
    default: 0
  },
  languagesSpoken: [{
    type: String
  }],
  practicingCourts: [{
    type: String
  }],
  profilePicture: String,
  bio: String,
  lawDegreeCertificate: {
    type: String
  },
  barCouncilCertificate: {
    type: String
  },
  visibleToClients: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
}));

module.exports = Lawyer;
