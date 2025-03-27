import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import Navbar from "../../components/navbar/navbar-client";
import Footer from "../../components/footer/footer-client";
import "./ReviewForm.css";
import { Filter } from 'bad-words';

const ReviewForm = () => {
  const { lawyerId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lawyer, setLawyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const clientID = sessionStorage.getItem("userid");
  const [showSweetAlert, setShowSweetAlert] = useState(false);
  const [sweetAlertMessage, setSweetAlertMessage] = useState("");
  const [sweetAlertType, setSweetAlertType] = useState("success");
  const [lawyerRatings, setLawyerRatings] = useState({
    averageRating: 0,
    totalReviews: 0
  });
  
  const filter = new Filter();
  
  // Create a simple profanity filter without external dependency
  const profaneWords = [
    'bloody hell', 'bloodyshit', 'bullshit', 'motherfucker', 
    'asshole', 'bastard', 'bitch', 'stupid', 'moron', 'idiot',
    'fuck', 'shit', 'damn', 'hell', 'crap', 'dick', 'ass', 'pussy'
  ];
  
  // Function to check for profanity
  const containsProfanity = (text) => {
    const lowerText = text.toLowerCase();
    return profaneWords.some(word => lowerText.includes(word));
  };

  // Add this function near your other validation functions
  const isKeyboardSpam = (text) => {
    // Check for repetitive character patterns (keyboard smashing)
    const repetitiveCharsRegex = /([a-z])\1{3,}/i;  // Same character repeated 4+ times
    
    // Check for random character sequences without spaces
    const longNoSpaceSequence = /[a-z]{15,}/i;  // 15+ consecutive letters without space
    
    // Check for low entropy (limited character variety compared to length)
    const uniqueChars = new Set(text.toLowerCase().replace(/[^a-z]/g, '')).size;
    const lettersOnly = text.toLowerCase().replace(/[^a-z]/g, '').length;
    const entropyRatio = uniqueChars / (lettersOnly || 1);
    
    // If text is long and has low character variety, it's likely spam
    const lowEntropy = lettersOnly > 15 && entropyRatio < 0.3;
    
    return repetitiveCharsRegex.test(text) || 
           longNoSpaceSequence.test(text) || 
           lowEntropy;
  };

  // Improve the fetchCurrentRatings function to directly use the lawyer endpoint
  const fetchCurrentRatings = async (lawyerId) => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/lawyers/${lawyerId}?refresh=${Date.now()}`, 
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data && response.data.data) {
        setLawyerRatings({
          averageRating: response.data.data.rating || 0,
          totalReviews: response.data.data.ratingsCount || response.data.data.reviewCount || 0
        });
      }
    } catch (error) {
      console.error("Error fetching lawyer ratings:", error);
    }
  };

  useEffect(() => {
    const fetchLawyerDetails = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          navigate('/login');
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        const response = await axios.get(
          `http://localhost:5000/api/lawyers/${lawyerId}`,
          config
        );

        // Store the lawyer data correctly
        setLawyer(response.data);
        setLoading(false);
        
        // Also fetch current ratings
        fetchCurrentRatings(lawyerId);
      } catch (error) {
        console.error("Error fetching lawyer details:", error);
        setMessage("Error loading lawyer details. Please try again.");
        setLoading(false);
      }
    };

    fetchLawyerDetails();
  }, [lawyerId, navigate]);

  // Update the validateForm function to include keyboard spam detection
  const validateForm = () => {
    const newErrors = {};
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      newErrors.rating = "Please select a rating from 1 to 5 stars";
    }
    
    // Validate review text
    if (!review.trim()) {
      newErrors.review = "Please write a review";
      
    } else if (review.trim().length < 10) {
      newErrors.review = "Review should be at least 10 characters long";
      
    } else if (review.trim().length > 500) {
      newErrors.review = "Review should not exceed 500 characters";
      
    } else {
      // Check for keyboard spam/gibberish
      if (isKeyboardSpam(review)) {
        newErrors.review = "Please write a meaningful review without random characters or keyboard spam.";
        return newErrors; // Exit early if spam is detected
      }
      
      // Check for profanity
      if (containsProfanity(review)) {
        newErrors.review = "Your review contains inappropriate language. Please revise.";
      }
      
      // Check for repetitive words (more than 3 times)
      const words = review.toLowerCase().split(/\s+/);
      const wordCounts = {};
      
      words.forEach(word => {
        // Only check words that are at least 3 characters
        if (word.length >= 3) {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      });
      
      const repetitiveWords = Object.keys(wordCounts).filter(word => wordCounts[word] > 3);
      
      if (repetitiveWords.length > 0) {
        newErrors.review = `Your review contains repetitive words: "${repetitiveWords.join('", "')}". Please revise for better readability.`;
      }
      
      // Check for all caps words or sentences (shouting)
      const allCapsRegex = /[A-Z]{5,}/;
      if (allCapsRegex.test(review)) {
        newErrors.review = "Please avoid using ALL CAPS in your review as it appears like shouting.";
      }
      
      // Check for excessive punctuation
      const excessivePunctuationRegex = /([!?.]{3,}|[!?.]{2,}[!?.]{2,})/;
      if (excessivePunctuationRegex.test(review)) {
        newErrors.review = "Please avoid excessive punctuation in your review.";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to sanitize the review text before submission
  const sanitizeReview = (text) => {
    // Replace multiple spaces with a single space
    let sanitized = text.replace(/\s+/g, ' ').trim();
    
    // Remove excessive punctuation
    sanitized = sanitized.replace(/([!?.]{3,})/g, '$1'.substring(0, 3));
    
    // Ensure first letter is capitalized
    sanitized = sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
    
    return sanitized;
  };

  // Update the getUpdatedRating function to use the force refresh endpoint
  const getUpdatedRating = async () => {
    try {
      // Call the force refresh endpoint instead
      const response = await axios.get(
        `http://localhost:5000/api/reviews/force-refresh-rating/${lawyerId}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        return {
          rating: response.data.lawyer.rating,
          reviewCount: response.data.lawyer.ratingsCount || response.data.lawyer.reviewCount || 0
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error getting updated rating:", error);
      return null;
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    
    // Clear any previous messages
    setMessage("");
    setShowSweetAlert(false);
    
    // Validate the form
    if (!validateForm()) {
      return;
    }

    // Sanitize the review text
    const sanitizedReview = sanitizeReview(review);

    // Log review data to console
    console.log("--- REVIEW SUBMISSION ---");
    console.log(`Lawyer ID: ${lawyerId}`);
    console.log(`Client ID: ${clientID}`);
    console.log(`Rating: ${rating} stars`);
    console.log(`Review Text (original): ${review}`);
    console.log(`Review Text (sanitized): ${sanitizedReview}`);
    console.log("------------------------");

    try {
      setIsSubmitting(true);
      
      // Check if client is trying to review their own profile
      if (!clientID) {
        setMessage("Error: You must be logged in to submit a review.");
        console.error("Review Submission Error: No client ID found");
        setIsSubmitting(false);
        return;
      }
      
      const reviewData = {
        clientID,
        lawyerID: lawyerId,
        rating: Number(rating),
        review: sanitizedReview,
      };
      
      // Log the data being sent to API
      console.log("Sending review data to API:", reviewData);
      
      const response = await axios.post("http://localhost:5000/api/reviews", reviewData);
      
      // Log successful response
      console.log("Review submission successful:", response.data);
      
      // Show sweet alert for success
      setSweetAlertMessage("Your review has been submitted successfully!");
      setSweetAlertType("success");
      setShowSweetAlert(true);
      
      setRating(0);
      setReview("");
      
      // Wait for the rating to update before redirecting
      setTimeout(async () => {
        // Force update the rating
        const updatedRating = await getUpdatedRating();
        console.log("Updated rating before redirect:", updatedRating);
        
        // Redirect with updated data
        navigate('/client/review-lawyers', { 
          state: { 
            reviewedLawyerId: lawyerId,
            reviewSubmitted: true,
            updatedRating: updatedRating
          } 
        });
      }, 2000); // 2 second delay to allow rating to update

      // Refresh ratings after submission
      fetchCurrentRatings(lawyerId);
    } catch (error) {
      console.error("Review submission error:", error);
      
      let errorMsg = "Error submitting review. Please try again.";
      
      // Log detailed error information
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        
        if (error.response.data && error.response.data.message) {
          errorMsg = `Error: ${error.response.data.message}`;
        }
      }
      
      // Show sweet alert for error too
      setSweetAlertMessage(errorMsg);
      setSweetAlertType("error");
      setShowSweetAlert(true);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a function to close the sweet alert
  const closeSweetAlert = () => {
    setShowSweetAlert(false);
  };

  // Update the handleReviewChange function to provide real-time feedback on keyboard spam
  const handleReviewChange = (e) => {
    const value = e.target.value;
    setReview(value);
    
    // Only validate in real-time if the review is long enough
    if (value.trim().length >= 10) {
      // Check for keyboard spam first
      if (isKeyboardSpam(value)) {
        setErrors({...errors, review: "Please write a meaningful review without random characters or keyboard spam."});
        return;
      }
      
      // Check for profanity
      if (containsProfanity(value)) {
        setErrors({...errors, review: "Your review contains inappropriate language. Please revise."});
        return;
      }
      
      // Check for repetitive words
      const words = value.toLowerCase().split(/\s+/);
      const wordCounts = {};
      
      words.forEach(word => {
        if (word.length >= 3) {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      });
      
      const repetitiveWords = Object.keys(wordCounts).filter(word => wordCounts[word] > 3);
      
      if (repetitiveWords.length > 0) {
        setErrors({
          ...errors, 
          review: `Your review contains repetitive words: "${repetitiveWords.join('", "')}". Please revise.`
        });
        return;
      }
      
      // If passed all checks, clear the error
      if (errors.review) {
        setErrors({...errors, review: null});
      }
    } else if (errors.review && errors.review.includes("repetitive words") || errors.review && errors.review.includes("inappropriate")) {
      // Clear specific errors about content if the text is now too short to validate
      setErrors({...errors, review: null});
    }
  };

  const StarRating = () => {
    return (
      <div className="star-rating-container">
        <div className="star-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`star ${star <= rating ? "selected" : ""}`}
              onClick={() => {
                setRating(star);
                // Clear error when user selects a rating
                if (errors.rating) {
                  setErrors({...errors, rating: null});
                }
              }}
              title={`${star} star${star > 1 ? 's' : ''}`}
            >
              ★
            </span>
          ))}
        </div>
        {errors.rating && <div className="error-message">{errors.rating}</div>}
      </div>
    );
  };

  // Calculate remaining characters
  const maxReviewLength = 500;
  const remainingChars = maxReviewLength - review.length;

  return (
    <div className="review-form-page">
      <Navbar />
      
      {/* Add the sweet alert modal */}
      {showSweetAlert && (
        <div className="sweet-alert-overlay" onClick={closeSweetAlert}>
          <div className="sweet-alert-modal" onClick={e => e.stopPropagation()}>
            <div className={`sweet-alert-icon ${sweetAlertType}`}>
              {sweetAlertType === "success" ? (
                <span>✓</span>
              ) : (
                <span>✕</span>
              )}
            </div>
            <h2>{sweetAlertType === "success" ? "Success!" : "Error!"}</h2>
            <p>{sweetAlertMessage}</p>
            <button 
              className={`sweet-alert-button ${sweetAlertType}`}
              onClick={closeSweetAlert}
            >
              OK
            </button>
          </div>
        </div>
      )}
      
      <div className="container mt-5 mb-5">
        <Helmet>
          <title>Review Lawyer - Lex Net</title>
        </Helmet>

        <div className="card shadow">
          <div className="card-header bg-primary text-white">
            <h2 className="mb-0">
              <FontAwesomeIcon icon={faStar} className="me-2" />
              Review Lawyer
            </h2>
          </div>
          <div className="card-body">
            <button 
              onClick={() => navigate('/client/review-lawyers')} 
              className="btn btn-outline-secondary mb-4"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
              Back to Lawyers List
            </button>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading lawyer details...</p>
              </div>
            ) : lawyer ? (
              <div>
                <div className="lawyer-info mb-4">
                  <h3>{lawyer.data?.fullName || 'Unknown Lawyer'}</h3>
                  <p className="specialization-label">
                    <strong>Specialization:</strong> 
                    <span className="specialization-value">
                      {lawyer.data?.specialization || 'Not specified'}
                    </span>
                  </p>
                  
                  <div className="current-ratings-section">
                    <h4>Current Rating</h4>
                    <div className="current-rating-display">
                      <div className="rating-number">
                        {lawyerRatings.averageRating > 0 ? lawyerRatings.averageRating.toFixed(1) : 'N/A'}
                      </div>
                      <div className="rating-stars">
                        <div className="stars-container">
                          {lawyerRatings.averageRating > 0 ? (
                            <span className="stars">
                              {'★'.repeat(Math.round(lawyerRatings.averageRating))}
                              {'☆'.repeat(5 - Math.round(lawyerRatings.averageRating))}
                            </span>
                          ) : (
                            <span className="stars empty-stars">☆☆☆☆☆</span>
                          )}
                        </div>
                        <span className="reviews-count">
                          {lawyerRatings.totalReviews > 0 ? 
                            `(${lawyerRatings.totalReviews} ${lawyerRatings.totalReviews === 1 ? 'review' : 'reviews'})` : 
                            'No reviews yet'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="review-form-container">
                  <h4>Leave Your Review</h4>
                  {message && (
                    <div className={`alert ${message.includes("Error") ? "alert-danger" : "alert-success"}`}>
                      {message}
                    </div>
                  )}
                  <form onSubmit={submitReview}>
                    <div className="form-group mb-3">
                      <label>Rating: <span className="text-danger">*</span></label>
                      <StarRating />
                    </div>

                    <div className="form-group mb-3">
                      <label>
                        Write your review: <span className="text-danger">*</span>
                        <span className="char-counter">
                          {remainingChars} characters remaining
                        </span>
                      </label>
                      <textarea
                        className={`form-control ${errors.review ? 'is-invalid' : ''}`}
                        value={review}
                        onChange={handleReviewChange}
                        placeholder="Share your experience with this lawyer..."
                        rows="5"
                        maxLength={maxReviewLength}
                      ></textarea>
                      {errors.review && (
                        <div className="invalid-feedback">{errors.review}</div>
                      )}
                      <small className="form-text text-muted">
                        Guidelines: Please provide honest feedback without using inappropriate language, 
                        excessive repetition, or random keyboard spam. Your review helps other clients make informed decisions.
                      </small>
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Submitting...
                        </>
                      ) : "Submit Review"}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="alert alert-danger">
                Lawyer not found. Please try again.
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
      <style jsx="true">{`
        .review-form-page {
          background-color: #f8f9fa;
          min-height: 100vh;
        }
        
        .card {
          border: none;
          border-radius: 10px;
          overflow: hidden;
        }
        
        .card-header {
          background-color: #2196f3 !important;
          padding: 1.25rem;
        }
        
        .card-header h2 {
          font-size: 1.5rem;
          margin: 0;
        }
        
        .lawyer-info {
          padding: 1rem;
          background-color: #f5f5f5;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }
        
        .lawyer-info h3 {
          margin-bottom: 0.5rem;
          color: #333;
        }
        
        .specialization-label {
          color: #555;
          margin-bottom: 0;
        }
        
        .specialization-value {
          margin-left: 0.5rem;
          color: #333;
          font-weight: 500;
        }
        
        .review-form-container {
          padding: 1.5rem;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .review-form-container h4 {
          margin-bottom: 1.5rem;
          color: #333;
          font-weight: 600;
        }
        
        .star-rating {
          display: flex;
          margin-top: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .star {
          color: #e0e0e0;
          font-size: 2rem;
          cursor: pointer;
          transition: color 0.2s ease;
          margin-right: 0.5rem;
        }
        
        .star.selected {
          color: #ffc107;
        }
        
        .star:hover {
          color: #ffd54f;
        }
        
        textarea.form-control {
          border: 1px solid #ddd;
          padding: 0.75rem;
          border-radius: 8px;
          resize: vertical;
        }
        
        textarea.form-control:focus {
          border-color: #2196f3;
          box-shadow: 0 0 0 0.25rem rgba(33, 150, 243, 0.25);
        }
        
        .btn-primary {
          background-color: #2196f3;
          border: none;
          padding: 0.75rem 2rem;
          font-weight: 500;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .btn-primary:hover {
          background-color: #1976d2;
          transform: translateY(-2px);
        }
        
        .btn-outline-secondary {
          color: #555;
          border-color: #ccc;
          transition: all 0.3s ease;
        }
        
        .btn-outline-secondary:hover {
          background-color: #f5f5f5;
          color: #333;
        }
        
        .error-message {
          color: #dc3545;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
        
        .is-invalid {
          border-color: #dc3545 !important;
        }
        
        .invalid-feedback {
          display: block;
          width: 100%;
          margin-top: 0.25rem;
          font-size: 0.875rem;
          color: #dc3545;
        }
        
        .star-rating-container {
          display: flex;
          flex-direction: column;
        }
        
        .char-counter {
          float: right;
          font-size: 0.8rem;
          color: #6c757d;
          margin-top: 0.25rem;
        }
        
        .text-danger {
          color: #dc3545;
        }
        
        /* Sweet Alert Styles */
        .sweet-alert-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          animation: fadeIn 0.3s ease-out;
        }
        
        .sweet-alert-modal {
          background-color: white;
          border-radius: 10px;
          padding: 30px;
          width: 90%;
          max-width: 400px;
          text-align: center;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
          animation: slideIn 0.4s ease-out;
        }
        
        .sweet-alert-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          margin: 0 auto 20px;
          font-size: 36px;
          font-weight: bold;
          color: white;
        }
        
        .sweet-alert-icon.success {
          background-color: #4CAF50;
        }
        
        .sweet-alert-icon.error {
          background-color: #F44336;
        }
        
        .sweet-alert-modal h2 {
          margin: 10px 0;
          color: #333;
          font-size: 24px;
        }
        
        .sweet-alert-modal p {
          margin: 20px 0;
          color: #555;
          font-size: 16px;
        }
        
        .sweet-alert-button {
          padding: 10px 24px;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .sweet-alert-button.success {
          background-color: #4CAF50;
        }
        
        .sweet-alert-button.success:hover {
          background-color: #3e9142;
        }
        
        .sweet-alert-button.error {
          background-color: #F44336;
        }
        
        .sweet-alert-button.error:hover {
          background-color: #d32f2f;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { transform: translateY(-50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .current-ratings-section {
          margin-top: 15px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #2196f3;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        
        .current-ratings-section h4 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 1rem;
          font-weight: 600;
        }
        
        .current-rating-display {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .rating-number {
          font-size: 2.5rem;
          font-weight: 700;
          color: #2196f3;
          line-height: 1;
          min-width: 60px;
          text-align: center;
        }
        
        .rating-stars {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .stars-container {
          height: 30px;
          display: flex;
          align-items: center;
        }
        
        .stars {
          color: #ffc107;
          font-size: 1.5rem;
          letter-spacing: 2px;
        }
        
        .empty-stars {
          color: #e0e0e0;
        }
        
        .reviews-count {
          color: #666;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default ReviewForm;