const mongoose = require("mongoose");

const analysisResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  crime: {
    type: String,
    required: true
  },
  sections: [{
    number: String,
    description: String
  }],
  severity: String,
  category: String,
  date: {
    type: Date,
    default: Date.now
  },
  documentText: String,
  confidence: Number
}, { timestamps: true });

const AnalysisResult = mongoose.model("AnalysisResult", analysisResultSchema);
module.exports = AnalysisResult; 