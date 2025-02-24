const mongoose = require('mongoose');

const documentHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  analyses: [{
    fileName: {
      type: String,
      required: true
    },
    dateAnalyzed: {
      type: Date,
      default: Date.now
    },
    crime: {
      type: String,
      required: true
    },
    sections: [{
      number: String,
      description: String
    }],
    documentText: String
  }]
}, { timestamps: true });

// Add indexes for better query performance
documentHistorySchema.index({ userId: 1, caseId: 1 });

module.exports = mongoose.model('DocumentHistory', documentHistorySchema); 