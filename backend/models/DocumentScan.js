const mongoose = require('mongoose');

const documentScanSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  originalFileContent: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  scanResult: {
    forgeryScore: {
      type: Number,
      required: true
    },
    isForged: {
      type: Boolean,
      required: true
    },
    language: {
      type: String,
      default: 'Unknown'
    },
    details: [{
      description: String,
      match: Boolean,
      confidence: Number,
      subDetails: [String]
    }]
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    default: null
  },
  tags: [String],
  notes: String
}, { timestamps: true });

const DocumentScan = mongoose.model('DocumentScan', documentScanSchema);

module.exports = DocumentScan; 