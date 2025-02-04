// visibleToClients: {
//   type: Boolean,
//   default: true
// }, 


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
  location: { type: String, required: true },
  availability: { type: [String], default: [] },
  fees: {
    type: String,
    required: true,
    set: function (value) {
      const cleanValue = value.toString().replace(/[₹\s]/g, "");
      return `₹${cleanValue}`;
    },
    get: function (value) {
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

lawyerSchema.set("toObject", { getters: true });
lawyerSchema.set("toJSON", { getters: true });

lawyerSchema.pre("save", function (next) {
  console.log("Pre-save middleware:", this.additionalCertificates);
  next();
});

// Export as a singleton to prevent model recompilation errors
module.exports = mongoose.models.Lawyer || mongoose.model("Lawyer", lawyerSchema);
