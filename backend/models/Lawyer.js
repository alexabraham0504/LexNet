const mongoose = require('mongoose');

const lawyerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  barCouncilId: {
    type: String,
    required: true,
    unique: true
  },
  specialization: {
    type: String,
    required: true
  },
  experience: {
    type: Number,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Lawyer', lawyerSchema);
