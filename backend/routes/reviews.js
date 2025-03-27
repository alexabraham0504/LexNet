const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Lawyer = require('../models/Lawyer');
const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust the path as needed

// POST - Create a new review
router.post('/', async (req, res) => {
  try {
    const { clientID, lawyerID, rating, review } = req.body;

    // Enhanced logging with colored output for better visibility in terminal
    console.log("\n\x1b[36m%s\x1b[0m", "╔═══════════════════════════════════════════╗");
    console.log("\x1b[36m%s\x1b[0m", "║           NEW REVIEW SUBMISSION           ║");
    console.log("\x1b[36m%s\x1b[0m", "╚═══════════════════════════════════════════╝");
    console.log("\x1b[33m%s\x1b[0m", `📅 Timestamp: ${new Date().toLocaleString()}`);
    console.log("\x1b[33m%s\x1b[0m", `👤 Client ID: ${clientID}`);
    console.log("\x1b[33m%s\x1b[0m", `⚖️ Lawyer ID: ${lawyerID}`);
    console.log("\x1b[33m%s\x1b[0m", `⭐ Rating: ${rating} stars`);
    console.log("\x1b[33m%s\x1b[0m", `💬 Review: "${review}"`);
    console.log("\x1b[36m%s\x1b[0m", "═══════════════════════════════════════════════\n");

    // Validate input
    if (!clientID || !lawyerID || !rating || !review) {
      console.log("\x1b[31m%s\x1b[0m", "❌ VALIDATION ERROR: Missing required fields");
      console.log("\x1b[31m%s\x1b[0m", `Missing: ${!clientID ? 'clientID ' : ''}${!lawyerID ? 'lawyerID ' : ''}${!rating ? 'rating ' : ''}${!review ? 'review' : ''}`);
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if valid ObjectIds
    if (!mongoose.Types.ObjectId.isValid(clientID) || !mongoose.Types.ObjectId.isValid(lawyerID)) {
      console.log("\x1b[31m%s\x1b[0m", "❌ VALIDATION ERROR: Invalid ID format");
      console.log("\x1b[31m%s\x1b[0m", `Invalid: ${!mongoose.Types.ObjectId.isValid(clientID) ? 'clientID ' : ''}${!mongoose.Types.ObjectId.isValid(lawyerID) ? 'lawyerID' : ''}`);
      return res.status(400).json({ message: 'Invalid client or lawyer ID' });
    }

    // Check if lawyer exists
    const lawyer = await Lawyer.findById(lawyerID);
    if (!lawyer) {
      console.log("\x1b[31m%s\x1b[0m", `❌ ERROR: Lawyer with ID ${lawyerID} not found`);
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    // Log lawyer info for context
    console.log("\x1b[32m%s\x1b[0m", `ℹ️ LAWYER INFO: ${lawyer.fullName} (${lawyer.specialization})`);

    // Check if review already exists
    const existingReview = await Review.findOne({ clientID, lawyerID });
    
    if (existingReview) {
      console.log("\x1b[33m%s\x1b[0m", `🔄 UPDATING EXISTING REVIEW: Client ${clientID} for Lawyer ${lawyerID}`);
      console.log("\x1b[33m%s\x1b[0m", `Previous Rating: ${existingReview.rating} ➡️ New Rating: ${rating}`);
      
      // Update existing review
      existingReview.rating = rating;
      existingReview.review = review;
      existingReview.createdAt = Date.now();
      
      await existingReview.save();
      
      // Update lawyer's average rating
      await updateLawyerRating(lawyerID);
      
      console.log("\x1b[32m%s\x1b[0m", "✅ REVIEW UPDATED SUCCESSFULLY");
      return res.status(200).json(existingReview);
    }

    // Create new review
    console.log("\x1b[32m%s\x1b[0m", "🆕 CREATING NEW REVIEW");
    const newReview = new Review({
      clientID,
      lawyerID,
      rating,
      review
    });

    const savedReview = await newReview.save();
    
    // Update lawyer's average rating
    await updateLawyerRating(lawyerID);
    
    console.log("\x1b[32m%s\x1b[0m", "✅ NEW REVIEW CREATED SUCCESSFULLY");
    console.log("\x1b[32m%s\x1b[0m", `📝 Review ID: ${savedReview._id}`);
    res.status(201).json(savedReview);
  } catch (error) {
    console.error("\x1b[31m%s\x1b[0m", "❌ ERROR CREATING REVIEW:");
    console.error("\x1b[31m%s\x1b[0m", error.stack || error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET - Get all reviews for a lawyer
router.get('/lawyer/:lawyerID', async (req, res) => {
  try {
    const { lawyerID } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(lawyerID)) {
      return res.status(400).json({ message: 'Invalid lawyer ID' });
    }
    
    const reviews = await Review.find({ lawyerID })
      .sort({ createdAt: -1 }) // Sort by newest first
      .populate('clientID', 'fullname profilePicture'); // Get client name and picture
      
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to update lawyer's average rating
async function updateLawyerRating(lawyerID) {
  try {
    const reviews = await Review.find({ lawyerID });
    
    if (reviews.length === 0) {
      console.log("\x1b[33m%s\x1b[0m", `⚠️ No reviews found for lawyer ${lawyerID} - skipping rating update`);
      return;
    }
    
    // Force convert ratings to numbers and calculate average
    const totalRating = reviews.reduce((sum, review) => sum + Number(review.rating), 0);
    const averageRating = totalRating / reviews.length;
    
    // Skip loading the lawyer and directly update the fields we need
    console.log("\x1b[33m%s\x1b[0m", "⚠️ Using direct update to avoid validation errors");
    
    // Use updateOne with $set to only update specific fields
    const updateResult = await Lawyer.updateOne(
      { _id: lawyerID },
      { 
        $set: {
          rating: parseFloat(averageRating.toFixed(1)),
          ratingsCount: reviews.length,
      reviewCount: reviews.length
        }
      }
    );
    
    console.log("\x1b[32m%s\x1b[0m", "Update result:", updateResult);
    
    // Fetch the lawyer to verify the update
    const updatedLawyer = await Lawyer.findById(lawyerID);
    console.log("\x1b[32m%s\x1b[0m", `⭐ LAWYER RATING UPDATED: ${updatedLawyer.fullName || 'Unknown'}`);
    console.log("\x1b[32m%s\x1b[0m", `Rating: Previous → ${updatedLawyer.rating || 'Not updated'}`);
    console.log("\x1b[32m%s\x1b[0m", `Reviews count: Previous → ${updatedLawyer.ratingsCount || updatedLawyer.reviewCount || 'Not updated'}`);
    
    return updatedLawyer;
  } catch (error) {
    console.error("\x1b[31m%s\x1b[0m", '❌ Error updating lawyer rating:');
    console.error("\x1b[31m%s\x1b[0m", error.stack || error.message);
    throw error;
  }
}

// Add this debug endpoint to your reviews.js
router.get('/debug/lawyer/:lawyerId', async (req, res) => {
  try {
    const { lawyerId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(lawyerId)) {
      return res.status(400).json({ message: 'Invalid lawyer ID' });
    }
    
    const lawyer = await Lawyer.findById(lawyerId);
    
    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }
    
    // Get the model structure
    const lawyerObject = lawyer.toObject();
    const modelKeys = Object.keys(lawyerObject);
    
    // Get the schema details
    const modelSchema = Lawyer.schema.paths;
    const schemaInfo = {};
    
    for (const key in modelSchema) {
      if (key !== '__v' && !key.startsWith('_')) {
        schemaInfo[key] = {
          type: modelSchema[key].instance,
          path: modelSchema[key].path,
          required: !!modelSchema[key].isRequired
        };
      }
    }
    
    res.json({
      lawyer: {
        _id: lawyer._id,
        fullName: lawyer.fullName,
        rating: lawyer.rating,
        ratingsCount: lawyer.ratingsCount,
        // Include other fields as needed
      },
      modelKeys,
      schemaInfo
    });
    
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add this route to get review statistics for a lawyer
router.get('/stats/:lawyerId', async (req, res) => {
  try {
    const { lawyerId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(lawyerId)) {
      return res.status(400).json({ message: 'Invalid lawyer ID' });
    }
    
    const stats = await Review.getReviewStats(lawyerId);
    res.status(200).json(stats);
    
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add this route to get just the count of reviews for a lawyer
router.get('/count/:lawyerId', async (req, res) => {
  try {
    const { lawyerId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(lawyerId)) {
      return res.status(400).json({ message: 'Invalid lawyer ID' });
    }
    
    // This is a lightweight query that just counts documents
    const count = await Review.countDocuments({ lawyerID: lawyerId });
    
    // Return a simple response with just the count
    res.status(200).json({ count });
    
  } catch (error) {
    console.error('Error fetching review count:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add this route to get a client's review for a specific lawyer
router.get('/client/:clientId/lawyer/:lawyerId', async (req, res) => {
  try {
    const { clientId, lawyerId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(clientId) || !mongoose.Types.ObjectId.isValid(lawyerId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    const review = await Review.findOne({ 
      clientID: clientId,
      lawyerID: lawyerId
    });
    
    if (!review) {
      return res.status(404).json({ 
        exists: false,
        message: 'No review found for this lawyer by this client' 
      });
    }
    
    res.status(200).json({
      exists: true,
      review
    });
    
  } catch (error) {
    console.error('Error fetching client review:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a new endpoint to get fresh lawyer data with rating
router.get('/rated-lawyer/:lawyerId', async (req, res) => {
  try {
    const { lawyerId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(lawyerId)) {
      return res.status(400).json({ message: 'Invalid lawyer ID' });
    }
    
    // Get the lawyer data
    const lawyer = await Lawyer.findById(lawyerId);
    
    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }
    
    // Count the reviews
    const reviewCount = await Review.countDocuments({ lawyerID: lawyerId });
    
    // Force update the lawyer's rating data if needed
    if ((lawyer.ratingsCount || lawyer.reviewCount || 0) !== reviewCount) {
      await updateLawyerRating(lawyerId);
      // Get the updated lawyer
      const updatedLawyer = await Lawyer.findById(lawyerId);
      return res.status(200).json(updatedLawyer);
    }
    
    // Return the lawyer with rating data
    res.status(200).json(lawyer);
    
  } catch (error) {
    console.error('Error fetching rated lawyer:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add this endpoint to force refresh a lawyer's rating
router.get('/force-refresh-rating/:lawyerId', async (req, res) => {
  try {
    const { lawyerId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(lawyerId)) {
      return res.status(400).json({ message: 'Invalid lawyer ID' });
    }
    
    // Force update the lawyer's rating
    await updateLawyerRating(lawyerId);
    
    // Get the updated lawyer with fresh rating data
    const updatedLawyer = await Lawyer.findById(lawyerId);
    
    if (!updatedLawyer) {
      return res.status(404).json({ message: 'Lawyer not found after rating update' });
    }
    
    // Return the updated lawyer data with refreshed rating
    res.status(200).json({
      success: true,
      lawyer: updatedLawyer,
      message: 'Lawyer rating successfully refreshed'
    });
    
  } catch (error) {
    console.error('Error in force refresh rating:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update the fix-lawyer-rating endpoint to avoid validation errors
router.post('/fix-lawyer-rating/:lawyerId', async (req, res) => {
  try {
    const { lawyerId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(lawyerId)) {
      return res.status(400).json({ message: 'Invalid lawyer ID' });
    }
    
    // Find the lawyer
    const lawyer = await Lawyer.findById(lawyerId);
    
    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }
    
    // Count the reviews
    const reviews = await Review.find({ lawyerID: lawyerId });
    const reviewCount = reviews.length;
    
    if (reviewCount === 0) {
      return res.status(200).json({ 
        message: 'No reviews found for this lawyer',
        lawyer
      });
    }
    
    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + Number(review.rating), 0);
    const averageRating = totalRating / reviewCount;
    
    // Use direct MongoDB update instead of save() to avoid validation
    const result = await Lawyer.updateOne(
      { _id: lawyerId },
      { 
        $set: {
          rating: parseFloat(averageRating.toFixed(1)),
          ratingsCount: reviewCount,
          reviewCount: reviewCount
        }
      },
      { runValidators: false }
    );
    
    // Get the updated lawyer
    const updatedLawyer = await Lawyer.findById(lawyerId);
    
    // Return the updated lawyer
    res.status(200).json({
      success: true,
      message: 'Lawyer rating manually fixed',
      lawyer: updatedLawyer,
      reviewCount,
      averageRating: parseFloat(averageRating.toFixed(1)),
      updateResult: result
    });
    
  } catch (error) {
    console.error('Error fixing lawyer rating:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET - Get all reviews for admin moderation
router.get('/admin/all', async (req, res) => {
  try {
    // Fetch all reviews
    const reviews = await Review.find({}).sort({ createdAt: -1 });
    
    // Get all client IDs from reviews to batch fetch users
    const clientIds = reviews.map(review => review.clientID);
    
    // Batch fetch all users at once (more efficient)
    const users = await User.find({ _id: { $in: clientIds } });
    
    // Create a map of user IDs to user objects for quick lookup
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = user;
    });
    
    // Format the response with properly populated client details
    const formattedReviews = await Promise.all(reviews.map(async (review) => {
      let lawyerName = "Unknown Lawyer";
      let clientName = "Unknown Client";
      
      // Get lawyer details
      if (review.lawyerID) {
        try {
          const lawyer = await Lawyer.findById(review.lawyerID);
          if (lawyer) {
            lawyerName = lawyer.fullName || "Unknown Lawyer";
          }
        } catch (err) {
          console.error(`Error fetching lawyer ${review.lawyerID}:`, err);
        }
      }
      
      // Look up client in our map instead of making separate queries
      const clientIdStr = review.clientID.toString();
      if (userMap[clientIdStr]) {
        const user = userMap[clientIdStr];
        clientName = user.fullName || "Unknown Client";
      }
      
      return {
        _id: review._id,
        clientID: review.clientID,
        lawyerID: review.lawyerID,
        clientName: clientName,
        lawyerName: lawyerName,
        rating: review.rating,
        review: review.review,
        status: review.status || 'pending',
        createdAt: review.createdAt
      };
    }));
    
    res.status(200).json(formattedReviews);
  } catch (error) {
    console.error('Error fetching reviews for admin:', error);
    res.status(500).json({ 
      message: 'Server error fetching reviews',
      error: error.message
    });
  }
});

// PUT - Approve a review
router.put('/admin/approve/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: 'Invalid review ID' });
    }
    
    const review = await Review.findByIdAndUpdate(
      reviewId, 
      { status: 'approved' },
      { new: true }
    );
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Trigger rating update for the lawyer
    await updateLawyerRating(review.lawyerID);
    
    res.status(200).json({ message: 'Review approved successfully', review });
  } catch (error) {
    console.error('Error approving review:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT - Reject a review
router.put('/admin/reject/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: 'Invalid review ID' });
    }
    
    const review = await Review.findByIdAndUpdate(
      reviewId, 
      { status: 'rejected' },
      { new: true }
    );
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Recalculate lawyer rating to exclude this review
    await updateLawyerRating(review.lawyerID);
    
    res.status(200).json({ message: 'Review rejected successfully', review });
  } catch (error) {
    console.error('Error rejecting review:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE - Delete a review
router.delete('/admin/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: 'Invalid review ID' });
    }
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    const lawyerID = review.lawyerID;
    
    // Delete the review
    await Review.findByIdAndDelete(reviewId);
    
    // Recalculate lawyer rating
    await updateLawyerRating(lawyerID);
    
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 