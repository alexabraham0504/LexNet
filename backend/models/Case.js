const mongoose = require('mongoose');

const caseSchema = mongoose.Schema({
  // ... existing fields ...
  
  analysisHistory: [{
    fileName: String,
    date: {
      type: Date,
      default: Date.now
    },
    crime: String,
    sections: [{
      number: String,
      description: String
    }]
  }],
}, { timestamps: true });

module.exports = mongoose.model('Case', caseSchema); 