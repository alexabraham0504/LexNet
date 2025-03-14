const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Lawyer = require('../models/Lawyer');
const mongoose = require('mongoose');

// POST - Create a new review
router.post('/', async (req, res) => {
  try {
    const { clientID, lawyerID, rating, review } = req.body;

    // Validate input
    if (!clientID || !lawyerID || !rating || !review) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if valid ObjectIds
    if (!mongoose.Types.ObjectId.isValid(clientID) || !mongoose.Types.ObjectId.isValid(lawyerID)) {
      return res.status(400).json({ message: 'Invalid client or lawyer ID' });
    }

    // Check if lawyer exists
    const lawyer = await Lawyer.findById(lawyerID);
    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ clientID, lawyerID });
    
    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      existingReview.review = review;
      existingReview.createdAt = Date.now();
      
      await existingReview.save();
      
      // Update lawyer's average rating
      await updateLawyerRating(lawyerID);
      
      return res.status(200).json(existingReview);
    }

    // Create new review
    const newReview = new Review({
      clientID,
      lawyerID,
      rating,
      review
    });

    const savedReview = await newReview.save();
    
    // Update lawyer's average rating
    await updateLawyerRating(lawyerID);
    
    res.status(201).json(savedReview);
  } catch (error) {
    console.error('Error creating review:', error);
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
    
    if (reviews.length === 0) return;
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    await Lawyer.findByIdAndUpdate(lawyerID, { 
      rating: averageRating.toFixed(1),
      reviewCount: reviews.length
    });
  } catch (error) {
    console.error('Error updating lawyer rating:', error);
  }
}

module.exports = router; 