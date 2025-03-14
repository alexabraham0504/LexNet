const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  clientID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  lawyerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate reviews from the same client for the same lawyer
reviewSchema.index({ clientID: 1, lawyerID: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema); 