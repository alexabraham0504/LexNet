const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  lawyerId: mongoose.Schema.Types.ObjectId,
  clientId: mongoose.Schema.Types.ObjectId,
  caseType: String,
  description: String,
  status: { type: String, default: "In Progress" },
  hearingDates: [Date],
  notes: [
    {
      date: { type: Date, default: Date.now },
      content: String
    }
  ],
  documents: [
    {
      fileName: String,
      url: String
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

module.exports = mongoose.model('Case', caseSchema);
