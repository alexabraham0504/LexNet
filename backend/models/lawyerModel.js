const mongoose = require("mongoose");

const additionalCertificateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  file: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  description: { type: String, default: "" },
});

const lawyerSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  AEN: { type: String, required: true },
  specialization: { type: String, required: true },
  location: { type: String, required: true },
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
  visibleToClients: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  deactivationReason: { type: String },
  deactivationMessage: { type: String, default: null },
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
