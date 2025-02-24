const mongoose = require("mongoose");

const caseSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  documents: [{
    fileName: String,
    filePath: String,
    fileType: String,
    extractedText: String,
    uploadDate: Date
  }],
  status: String,
  ipcSection: String,
  ipcDescription: String,
  relatedSections: [{
    section: String,
    confidence: Number
  }],
  evidenceContext: [String],
  analysisResults: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  caseType: {
    type: String,
    enum: ['criminal', 'civil', 'family', 'corporate', 'other'],
    default: 'other'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  isRestored: {
    type: Boolean,
    default: false
  },
  restoredAt: {
    type: Date
  },
  lastAnalysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentHistory'
  },
  analysisHistory: [{
    results: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
});

// Add pre-save middleware to ensure at least one document
caseSchema.pre('save', function(next) {
  if (!this.documents || this.documents.length === 0) {
    next(new Error('At least one document is required'));
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Case", caseSchema); 