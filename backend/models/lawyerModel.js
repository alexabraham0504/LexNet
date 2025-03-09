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
  specialization: { 
    type: String, 
    required: true,
    enum: [
      'Environmental Law',
      'Criminal Law',
      'Civil Law',
      'Family Law',
      'Real Estate Law',
      'General Practice',
      'All'
    ],
    set: function(val) {
      // Ensure proper capitalization and formatting
      if (!val) return val;
      return val.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
  },
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
    enum: ['active', 'inactive', 'pending'],
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
  yearsOfExperience: { 
    type: Number,
    required: true,
    min: 1,
    max: 50,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value for years of experience'
    }
  },
  lawFirm: { type: String },
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
  ipcSections: {
    type: [String],
    default: []
  },
  crimeTypes: {
    type: [String],
    default: []
  },
  expertise: {
    type: [String],
    default: []
  },
  keywords: {
    type: [String],
    default: function() {
      // Auto-generate keywords from specialization and expertise
      const keywords = [this.specialization];
      if (this.expertise) {
        keywords.push(...this.expertise);
      }
      return keywords;
    }
  },
});

// Enable getters
lawyerSchema.set("toObject", { getters: true });
lawyerSchema.set("toJSON", { getters: true });

// Add middleware to handle additionalCertificates updates
lawyerSchema.pre("save", function (next) {
  console.log("Pre-save middleware:", this.additionalCertificates);
  if (this.specialization) {
    // Ensure proper capitalization
    this.specialization = this.specialization
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  next();
});

// Add static method to find lawyers by specialization
lawyerSchema.statics.findBySpecialization = async function(specialization) {
  const query = {
    isVerified: true,
    visibleToClients: true,
    status: 'active'
  };

  if (specialization && specialization.toLowerCase() !== 'all') {
    // Format the specialization to match the stored format
    const formattedSpecialization = specialization
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    query.specialization = formattedSpecialization;
  }

  console.log('Search query:', query); // Debug log

  return this.find(query)
    .select('fullName email phone specialization location fees rating expertise')
    .sort({ rating: -1 })
    .lean();
};

module.exports = mongoose.model("Lawyer", lawyerSchema);
