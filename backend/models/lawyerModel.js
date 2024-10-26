const mongoose = require("mongoose");

const lawyerSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  AEN: { type: String, required: true }, // Advocate Enrollment Number
  specialization: { type: String, required: true },
  location: { type: String, required: true },
  availability: { type: String, required: true },
  fees: { type: Number, required: true },
  profilePicture: { type: String },
  lawDegreeCertificate: { type: String },
  barCouncilCertificate: { type: String },
  visibleToClients: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false }, // Added for verification
});

const Lawyer = mongoose.model("Lawyer", lawyerSchema);

module.exports = Lawyer;
