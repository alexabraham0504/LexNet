const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  lawyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientNotes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  },
  assignmentDate: {
    type: Date,
    default: Date.now
  },
  responseDate: {
    type: Date
  },
  responseNotes: {
    type: String
  }
});

module.exports = mongoose.model("Assignment", assignmentSchema); 