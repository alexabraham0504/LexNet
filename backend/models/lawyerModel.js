const mongoose = require("mongoose");

const additionalCertificateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  file: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  description: { type: String, default: "" },
});

const lawyerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  AEN: { type: String, required: true },
  specialization: { type: String, required: true },
  location: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  officeLocation: {
    address: { type: String },
    lat: { type: Number },
    lng: { type: Number }
  },
  availability: { type: [String], default: [] }, // Changed to an array for multiple slots
  fees: {
    type: String,
    required: true,
    set: function (value) {
      // Remove any existing ₹ symbols and spaces
      const cleanValue = value.toString().replace(/[₹\s]/g, "");
      // Add single ₹ symbol
      return `₹${cleanValue}`;
    },
    get: function (value) {
      // If value doesn't have ₹ symbol, add it
      if (!value) return "";
      if (!value.startsWith("₹")) {
        return `₹${value}`;
      }
      return value;
    },
  },
  profilePicture: { type: String },
  lawDegreeCertificate: { type: String },
  barCouncilCertificate: { type: String },
  additionalCertificates: {
    type: [additionalCertificateSchema],
    default: [],
  },
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  visibleToClients: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  deactivationReason: { type: String },
  deactivationMessage: { type: String, default: null },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  languagesSpoken: { type: [String], default: [] },
  caseHistory: { type: String },
  bio: { type: String },
  officeAddress: { type: String },
  city: { type: String },
  state: { type: String },
  yearsOfExperience: { type: Number },
  lawFirm: { type: String },
  appointmentFees: {
    type: String,
    required: true,
    set: function(value) {
      const cleanValue = value.toString().replace(/[₹\s]/g, "");
      return `₹${cleanValue}`;
    },
    get: function(value) {
      if (!value) return "";
      if (!value.startsWith("₹")) {
        return `₹${value}`;
      }
      return value;
    },
  },
  consultationFees: {
    type: String,
    required: true,
    set: function(value) {
      const cleanValue = value.toString().replace(/[₹\s]/g, "");
      return `₹${cleanValue}`;
    },
    get: function(value) {
      if (!value) return "";
      if (!value.startsWith("₹")) {
        return `₹${value}`;
      }
      return value;
    },
  },
  caseDetailsFees: {
    type: String,
    required: true,
    set: function(value) {
      const cleanValue = value.toString().replace(/[₹\s]/g, "");
      return `₹${cleanValue}`;
    },
    get: function(value) {
      if (!value) return "";
      if (!value.startsWith("₹")) {
        return `₹${value}`;
      }
      return value;
    },
  },
  videoCallFees: {
    type: String,
    required: true,
    set: function(value) {
      const cleanValue = value.toString().replace(/[₹\s]/g, "");
      return `₹${cleanValue}`;
    },
    get: function(value) {
      if (!value) return "";
      if (!value.startsWith("₹")) {
        return `₹${value}`;
      }
      return value;
    },
  },
  caseHandlingFees: {
    type: String,
    required: true,
    set: function(value) {
      const cleanValue = value.toString().replace(/[₹\s]/g, "");
      return `₹${cleanValue}`;
    },
    get: function(value) {
      if (!value) return "";
      if (!value.startsWith("₹")) {
        return `₹${value}`;
      }
      return value;
    },
  },
  practicingCourts: { 
    type: [String], 
    default: [],
    required: true
  },
});

// Enable getters
lawyerSchema.set("toObject", { getters: true });
lawyerSchema.set("toJSON", { getters: true });

// Add middleware to handle additionalCertificates updates
lawyerSchema.pre("save", function (next) {
  console.log("Pre-save middleware:", this.additionalCertificates);
  next();
});

module.exports = mongoose.model("Lawyer", lawyerSchema);
