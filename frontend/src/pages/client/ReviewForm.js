import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import Navbar from "../../components/navbar/navbar-client";
import Footer from "../../components/footer/footer-client";
import "./ReviewForm.css";

const ReviewForm = () => {
  const { lawyerId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lawyer, setLawyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const clientID = sessionStorage.getItem("userid");

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

        setLawyer(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching lawyer details:", error);
        setMessage("Error loading lawyer details. Please try again.");
        setLoading(false);
      }
    };

    fetchLawyerDetails();
  }, [lawyerId, navigate]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!rating || !review.trim()) {
      setMessage("Please provide both a rating and a review.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post("http://localhost:5000/api/reviews", {
        clientID,
        lawyerID: lawyerId,
        rating,
        review,
      });
      setMessage("Review submitted successfully!");
      setRating(0);
      setReview("");
      
      // Redirect after successful submission
      setTimeout(() => {
        navigate('/client/review-lawyers');
      }, 2000);
    } catch (error) {
      setMessage("Error submitting review. Please try again.");
      console.error("Review submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = () => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? "selected" : ""}`}
            onClick={() => setRating(star)}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="review-form-page">
      <Navbar />
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
                  <h3>{lawyer.fullName || lawyer.name}</h3>
                  <p><strong>Specialization:</strong> {lawyer.specialization}</p>
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
                      <label>Rating:</label>
                      <StarRating />
                    </div>

                    <div className="form-group mb-3">
                      <label>Write your review:</label>
                      <textarea
                        className="form-control"
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Share your experience..."
                        rows="5"
                      ></textarea>
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Review"}
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
    </div>
  );
};

export default ReviewForm;
