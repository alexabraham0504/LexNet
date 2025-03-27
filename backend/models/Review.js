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
    max: 5,
    validate: {
      validator: function(value) {
        return Number.isInteger(value) && value >= 1 && value <= 5;
      },
      message: 'Rating must be an integer between 1 and 5'
    }
  },
  review: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate reviews from the same client for the same lawyer
reviewSchema.index({ clientID: 1, lawyerID: 1 }, { unique: true });

// Add a pre-save hook to ensure rating is a number
reviewSchema.pre('save', function(next) {
  if (typeof this.rating !== 'number') {
    this.rating = Number(this.rating);
  }
  next();
});

// Add this static method to get review statistics for a lawyer
reviewSchema.statics.getReviewStats = async function(lawyerID) {
  // Get all reviews for the lawyer
  const reviews = await this.find({ lawyerID });
  
  // If no reviews, return default stats
  if (!reviews || reviews.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      mostCommonRating: 'N/A'
    };
  }
  
  // Calculate total reviews
  const totalReviews = reviews.length;
  
  // Calculate average rating
  const totalRating = reviews.reduce((sum, review) => sum + Number(review.rating), 0);
  const averageRating = (totalRating / totalReviews).toFixed(1);
  
  // Find most common rating
  const ratingsCount = {};
  reviews.forEach(review => {
    const rating = review.rating;
    ratingsCount[rating] = (ratingsCount[rating] || 0) + 1;
  });
  
  let mostCommonRating = 0;
  let highestCount = 0;
  
  for (const [rating, count] of Object.entries(ratingsCount)) {
    if (count > highestCount) {
      mostCommonRating = Number(rating);
      highestCount = count;
    }
  }
  
  return {
    totalReviews,
    averageRating,
    mostCommonRating: mostCommonRating || 'N/A',
    ratingDistribution: ratingsCount
  };
};

// Also update the updateLawyerRating function to only count approved reviews
async function updateLawyerRating(lawyerID) {
  try {
    // Only include approved reviews in rating calculation
    const reviews = await Review.find({ 
      lawyerID,
      status: 'approved' 
    });
    
    // ... rest of the function remains the same
  } catch (error) {
    // ... error handling
  }
}

module.exports = mongoose.model('Review', reviewSchema); 