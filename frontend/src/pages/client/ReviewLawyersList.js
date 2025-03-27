import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faStar, 
  faArrowLeft, 
  faSearch, 
  faUserTie, 
  faSpinner,
  faSync
} from "@fortawesome/free-solid-svg-icons";
import Navbar from "../../components/navbar/navbar-client";
import Footer from "../../components/footer/footer-client";
import { motion } from "framer-motion";

const ReviewLawyersList = () => {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const clientID = sessionStorage.getItem("userid");
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [recentlyReviewed, setRecentlyReviewed] = useState(null);
  const [reviewStats, setReviewStats] = useState({});
  const [justSubmittedReview, setJustSubmittedReview] = useState(false);
  const [clientReviews, setClientReviews] = useState({});

  useEffect(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, [location.pathname]);

  useEffect(() => {
    if (location.state?.reviewSubmitted) {
      console.log("Review just submitted, forcing data refresh for lawyer:", location.state.reviewedLawyerId);
      setJustSubmittedReview(true);
      
      // If we have the specific lawyer ID that was reviewed
      if (location.state.reviewedLawyerId) {
        // Force refresh this specific lawyer's rating
        forceRefreshLawyerRating(location.state.reviewedLawyerId)
          .then(refreshedLawyer => {
            console.log("Lawyer rating refreshed:", refreshedLawyer);
            
            // Set as recently reviewed for highlighting
            setRecentlyReviewed(location.state.reviewedLawyerId);
            
            // Clear the "updating..." message after a delay
            setTimeout(() => {
              setJustSubmittedReview(false);
            }, 1500);
            
            // Clear the highlight after a longer delay
            setTimeout(() => {
              setRecentlyReviewed(null);
            }, 5000);
          });
      } else {
        // If no specific lawyer ID, do a general refresh
        setRefreshKey(prevKey => prevKey + 1);
        setTimeout(() => {
          setJustSubmittedReview(false);
        }, 2000);
      }
    }
  }, [location.state]);

  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        setLoading(true);
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

        // First, fetch cases to get lawyers the client has worked with
        console.log("Fetching cases...");
        const casesResponse = await axios.get(
          "http://localhost:5000/api/cases/list",
          config
        );
        
        console.log("Cases response:", casesResponse.data);
        
        // Extract unique lawyer IDs from cases
        const lawyerIds = new Set();
        if (casesResponse.data && casesResponse.data.cases) {
          casesResponse.data.cases.forEach(caseItem => {
            if (caseItem.lawyerId) {
              lawyerIds.add(caseItem.lawyerId);
            }
          });
        }
        
        console.log("Extracted lawyer IDs:", Array.from(lawyerIds));
        
        // If there are no lawyers found in cases, show a message
        if (lawyerIds.size === 0) {
          console.log("No lawyer IDs found in cases");
          setLawyers([]);
          setLoading(false);
          return;
        }
        
        // Fetch details for each lawyer - add cache-busting parameter
        console.log("Fetching lawyer details...");
        const lawyersPromises = Array.from(lawyerIds).map(id => 
          axios.get(`http://localhost:5000/api/lawyers/${id}?t=${Date.now()}`, config)
        );
        
        const lawyersResponses = await Promise.all(lawyersPromises);
        console.log("Lawyer responses:", lawyersResponses);
        
        const lawyersData = lawyersResponses.map(response => response.data);
        console.log("Processed lawyer data:", lawyersData);
        
        setLawyers(lawyersData);
        setLoading(false);
        
        // After lawyers are fetched, fetch review stats and client reviews
        if (lawyersData.length > 0) {
          fetchReviewStats(lawyersData);
          fetchClientReviews(lawyersData);
        }
      } catch (error) {
        console.error("Error fetching lawyers:", error);
        setError(`Failed to load lawyers: ${error.message || "Unknown error"}`);
        setLoading(false);
      }
    };

    fetchLawyers();
  }, [navigate, clientID, refreshKey]);

  useEffect(() => {
    if (location.state?.reviewedLawyerId) {
      setRecentlyReviewed(location.state.reviewedLawyerId);
      setTimeout(() => {
        setRecentlyReviewed(null);
      }, 5000);
    }
  }, [location.state]);

  // Alternative direct fetch approach if the first method isn't working
  useEffect(() => {
    const directFetchLawyers = async () => {
      // Only run this if the primary approach didn't find lawyers
      if (!loading && lawyers.length === 0 && !error) {
        try {
          setLoading(true);
          const token = sessionStorage.getItem("token");
          if (!token) return;

          const config = {
            headers: {
              Authorization: `Bearer ${token}`
            }
          };

          console.log("Attempting direct lawyer fetch...");
          // Try to get all verified lawyers as a fallback
          const response = await axios.get(
            "http://localhost:5000/api/lawyers/verified",
            config
          );
          
          console.log("Direct fetch response:", response.data);
          
          if (response.data && response.data.length > 0) {
            setLawyers(response.data);
          } else {
            console.log("No lawyers found from direct fetch");
          }
        } catch (directError) {
          console.error("Error in direct fetch:", directError);
        } finally {
          setLoading(false);
        }
      }
    };

    directFetchLawyers();
  }, [loading, lawyers, error]);

  const handleLawyerClick = (lawyer) => {
    setSelectedLawyer(lawyer);
  };

  const handleCloseModal = () => {
    setSelectedLawyer(null);
  };

  const fetchReviewStats = async (lawyers) => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) return;

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      // Get both review counts and lawyer data (with updated ratings)
      const statsPromises = lawyers.map(lawyer => 
        axios.get(`http://localhost:5000/api/reviews/count/${lawyer._id}`, config)
      );
      
      const lawyerPromises = lawyers.map(lawyer =>
        axios.get(`http://localhost:5000/api/lawyers/${lawyer._id}?refresh=${Date.now()}`, config)
      );
      
      // Run all requests in parallel for efficiency
      const [statsResponses, lawyerResponses] = await Promise.all([
        Promise.all(statsPromises),
        Promise.all(lawyerPromises)
      ]);
      
      // Update the lawyers array with fresh data
      const updatedLawyers = lawyers.map((lawyer, index) => {
        // Get fresh lawyer data with updated rating
        const freshData = lawyerResponses[index].data;
        
        // Update the lawyer in our state with fresh data
        if (freshData) {
          // Create a new lawyer object with updated rating data
          return {
            ...lawyer,
            rating: freshData.rating || 0,
            ratingsCount: freshData.ratingsCount || freshData.reviewCount || 0
          };
        }
        return lawyer;
      });
      
      // Update the lawyers state with fresh data
      setLawyers(updatedLawyers);
      
      // Create stats objects for each lawyer
      const newStats = {};
      lawyers.forEach((lawyer, index) => {
        newStats[lawyer._id] = {
          totalReviews: statsResponses[index].data.count || 0,
        };
      });
      
      console.log("Updated review stats:", newStats);
      setReviewStats(newStats);
    } catch (error) {
      console.error("Error fetching review stats:", error);
    }
  };

  const fetchClientReviews = async (lawyers) => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token || !clientID) return;

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      // Get the client's reviews for each lawyer
      const reviewPromises = lawyers.map(lawyer => 
        axios.get(`http://localhost:5000/api/reviews/client/${clientID}/lawyer/${lawyer._id}`, config)
          .then(response => ({
            lawyerId: lawyer._id,
            exists: response.data.exists,
            review: response.data.review
          }))
          .catch(error => {
            // If review doesn't exist, that's ok
            if (error.response && error.response.status === 404) {
              return {
                lawyerId: lawyer._id,
                exists: false
              };
            }
            throw error;
          })
      );
      
      const reviewResults = await Promise.all(reviewPromises);
      
      // Build a map of lawyer ID to client's review
      const reviewsMap = {};
      reviewResults.forEach(result => {
        if (result.exists) {
          reviewsMap[result.lawyerId] = result.review;
        }
      });
      
      console.log("Client's reviews for lawyers:", reviewsMap);
      setClientReviews(reviewsMap);
    } catch (error) {
      console.error("Error fetching client reviews:", error);
    }
  };

  // Add this function to force refresh all data
  const forceRefreshData = () => {
    setLoading(true);
    // Use a slight delay to ensure UI updates
    setTimeout(() => {
      setRefreshKey(prevKey => prevKey + 1);
    }, 300);
  };

  // Add this function to directly refresh a lawyer's rating
  const forceRefreshLawyerRating = async (lawyerId) => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) return null;

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      // First try the direct fix endpoint
      const fixResponse = await axios.post(
        `http://localhost:5000/api/reviews/fix-lawyer-rating/${lawyerId}`,
        {}, // Empty body
        config
      );
      
      if (fixResponse.data.success) {
        console.log("Rating manually fixed:", fixResponse.data);
        
        // Update this specific lawyer in the state with the fixed data
        setLawyers(prevLawyers => 
          prevLawyers.map(lawyer => 
            lawyer._id === lawyerId ? {
              ...lawyer,
              rating: fixResponse.data.lawyer.rating,
              ratingsCount: fixResponse.data.lawyer.ratingsCount,
              reviewCount: fixResponse.data.lawyer.reviewCount
            } : lawyer
          )
        );
        
        return fixResponse.data.lawyer;
      }
      
      // If fix endpoint failed, try the regular force refresh endpoint
      const response = await axios.get(
        `http://localhost:5000/api/reviews/force-refresh-rating/${lawyerId}`,
        config
      );
      
      if (response.data.success) {
        // Update this specific lawyer in the state
        setLawyers(prevLawyers => 
          prevLawyers.map(lawyer => 
            lawyer._id === lawyerId ? response.data.lawyer : lawyer
          )
        );
        
        return response.data.lawyer;
      }
      
      return null;
    } catch (error) {
      console.error("Error refreshing lawyer rating:", error);
      return null;
    }
  };

  // Add this function to fix all lawyers' ratings
  const fixAllLawyerRatings = async () => {
    try {
      setLoading(true);
      
      const token = sessionStorage.getItem("token");
      if (!token) return;

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      // Fix ratings for all displayed lawyers
      const fixPromises = lawyers.map(lawyer => 
        axios.post(
          `http://localhost:5000/api/reviews/fix-lawyer-rating/${lawyer._id}`,
          {},
          config
        )
      );
      
      await Promise.all(fixPromises);
      
      // Refresh the entire list
      setRefreshKey(prevKey => prevKey + 1);
      
    } catch (error) {
      console.error("Error fixing all ratings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add this function to forcefully update all lawyer ratings
  const forceMigrateLawyerRatings = async () => {
    try {
      setLoading(true);
      
      const token = sessionStorage.getItem("token");
      if (!token) return;

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      // Get all lawyers
      const lawyerResponse = await axios.get(
        "http://localhost:5000/api/lawyers/verified",
        config
      );
      
      if (!lawyerResponse.data || !lawyerResponse.data.length) {
        alert("No lawyers found to update");
        setLoading(false);
        return;
      }
      
      // Force update each lawyer's rating
      const updatePromises = lawyerResponse.data.map(lawyer => 
        axios.post(
          `http://localhost:5000/api/reviews/fix-lawyer-rating/${lawyer._id}`,
          {},
          config
        ).catch(err => ({ error: err, lawyerId: lawyer._id }))
      );
      
      const results = await Promise.all(updatePromises);
      
      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error("Errors updating some lawyers:", errors);
      }
      
      // Refresh current data
      setRefreshKey(prevKey => prevKey + 1);
      alert(`Updated ${results.length - errors.length} lawyer ratings successfully`);
      
    } catch (error) {
      console.error("Error in force migration:", error);
      alert("Error updating lawyer ratings: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-lawyers-page">
      <Navbar />
      <div className="review-lawyers-content">
        <Helmet>
          <title>Review Lawyers - Lex Net</title>
        </Helmet>
        
        <div className="review-lawyers-container">
          <div className="review-lawyers-header">
            <h1>
              <FontAwesomeIcon icon={faStar} className="me-3" />
              Review Your Lawyers
            </h1>
            <p>Rate and review lawyers you've worked with</p>
            
            <div className="header-buttons">
            <button 
              onClick={() => navigate('/clientdashboard')}
              className="back-button"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
              Back to Dashboard
            </button>
              
              {/* <button 
                onClick={forceRefreshData}
                className="refresh-button"
                disabled={loading}
              >
                {loading ? (
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
          </div>
                ) : (
                  <FontAwesomeIcon icon={faSync} className="me-2" />
                )}
                Refresh Ratings
              </button> */}
              
              {/* <button 
                onClick={fixAllLawyerRatings}
                className="fix-button"
                disabled={loading}
              >
                {loading ? (
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : (
                  <FontAwesomeIcon icon={faSync} className="me-2" />
                )}
                Fix All Ratings
              </button> */}
              
              {/* <button 
                onClick={forceMigrateLawyerRatings}
                className="emergency-fix-button"
                disabled={loading}
              >
                {loading ? (
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : (
                  <FontAwesomeIcon icon={faSync} className="me-2" />
                )}
                Emergency Fix All
              </button> */}
            </div>
          </div>
          
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading lawyers...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="retry-button"
              >
                Try Again
              </button>
            </div>
          ) : lawyers.length === 0 ? (
            <div className="empty-state">
              <FontAwesomeIcon icon={faUserTie} className="empty-icon" />
              <h3>No Lawyers to Review</h3>
              <p>You haven't worked with any lawyers yet. Once you do, they'll appear here for you to review.</p>
              <div className="debug-info">
                <p>Client ID: {clientID || "Not found"}</p>
                <p>Token Present: {sessionStorage.getItem("token") ? "Yes" : "No"}</p>
              </div>
            </div>
          ) : (
            <div className="lawyers-grid">
              {lawyers.map(lawyer => (
                <div key={lawyer._id} className="lawyer-card" onClick={() => handleLawyerClick(lawyer)}>
                  {recentlyReviewed === lawyer._id && (
                    <div className="recently-reviewed-badge">
                      <FontAwesomeIcon icon={faStar} className="me-1" />
                      Recently Reviewed
                    </div>
                  )}
                  <div className="lawyer-info">
                    <img 
                      src={lawyer.profilePicture ? 
                        `http://localhost:5000/uploads/${lawyer.profilePicture}` : 
                        '/default-lawyer-avatar.png'
                      } 
                      alt={lawyer.fullName} 
                      className="lawyer-avatar"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default-lawyer-avatar.png';
                      }}
                    />
                    <div className="lawyer-details">
                      <h3>{lawyer.fullName}</h3>
                      <p className="specialization">{lawyer.specialization}</p>
                      <div className="years-experience">
                        <span>Experience: </span>
                        <strong>{lawyer.yearsOfExperience} years</strong>
                      </div>
                      
                      <div className="rating-section">
                        <p className="rating-label">Current Rating:</p>
                        <div className="rating-content">
                          <span className="rating-value">
                            {(lawyer.rating && lawyer.rating > 0) ? 
                              parseFloat(lawyer.rating).toFixed(1) : 
                              'N/A'}
                          </span>
                          <div className="stars-display">
                        <span className="stars">
                              {lawyer.rating > 0 ? 
                                '★'.repeat(Math.round(lawyer.rating)) + 
                                '☆'.repeat(5 - Math.round(lawyer.rating)) : 
                                '☆☆☆☆☆'}
                        </span>
                            <span className="review-count">
                              ({justSubmittedReview && recentlyReviewed === lawyer._id ? 
                                <span className="updating">updating...</span> : 
                                (lawyer.ratingsCount || 
                                 lawyer.reviewCount || 
                                 reviewStats[lawyer._id]?.totalReviews || 
                                 0)} {(lawyer.ratingsCount === 1 || 
                                      lawyer.reviewCount === 1 || 
                                      reviewStats[lawyer._id]?.totalReviews === 1) ? 
                                      'review' : 'reviews'})
                            </span>
                      </div>
                    </div>
                  </div>
                      
                      {reviewStats[lawyer._id] && reviewStats[lawyer._id].totalReviews > 0 && (
                        <div className="common-rating-section">
                          <p className="common-rating-label">Most Common Rating:</p>
                          <div className="common-rating-value">
                            <span className="rating-badge">
                              {reviewStats[lawyer._id].mostCommonRating}★
                            </span>
                            <span className="common-rating-text">
                              chosen by {Math.round((reviewStats[lawyer._id].ratingDistribution[reviewStats[lawyer._id].mostCommonRating] / 
                                         reviewStats[lawyer._id].totalReviews) * 100)}% of clients
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="lawyer-profile-details">
                    {/* Show client's own review if it exists */}
                    {clientReviews[lawyer._id] && (
                      <div className="client-review-section">
                        <h4>Your Review</h4>
                        <div className="client-rating">
                          <span className="your-rating-stars">
                            {'★'.repeat(clientReviews[lawyer._id].rating)}
                            {'☆'.repeat(5 - clientReviews[lawyer._id].rating)}
                          </span>
                          <span className="your-rating-value">{clientReviews[lawyer._id].rating}/5</span>
                        </div>
                        <p className="client-review-text">"{clientReviews[lawyer._id].review}"</p>
                        <p className="review-date">
                          Reviewed on {new Date(clientReviews[lawyer._id].createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    
                    {/* Existing bio section */}
                    {lawyer.bio && !clientReviews[lawyer._id] && (
                      <div className="lawyer-bio">
                        <p>{lawyer.bio.length > 150 ? lawyer.bio.substring(0, 150) + '...' : lawyer.bio}</p>
                      </div>
                    )}
                    
                    <div className="lawyer-additional-info">
                      {lawyer.expertise && lawyer.expertise.length > 0 && (
                        <div className="expertise-tags">
                          <span className="info-label">Expertise:</span>
                          <div className="tags-container">
                            {lawyer.expertise.slice(0, 3).map((item, index) => (
                              <span key={index} className="expertise-tag">{item}</span>
                            ))}
                            {lawyer.expertise.length > 3 && <span className="more-tag">+{lawyer.expertise.length - 3} more</span>}
                          </div>
                        </div>
                      )}
                      
                      {lawyer.languagesSpoken && lawyer.languagesSpoken.length > 0 && (
                        <div className="languages">
                          <span className="info-label">Languages:</span>
                          <span>{lawyer.languagesSpoken.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="lawyer-action">
                    <Link 
                      to={`/client/review/${lawyer._id}`} 
                      className="review-button"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FontAwesomeIcon icon={faStar} className="me-2" />
                      {clientReviews[lawyer._id] ? 'Edit Your Review' : 'Write a Review'}
                    </Link>
                  </div>

                  <div className="refresh-rating-container">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        setJustSubmittedReview(true);
                        forceRefreshLawyerRating(lawyer._id).then(() => {
                          setTimeout(() => setJustSubmittedReview(false), 1500);
                        });
                      }}
                      className="refresh-rating-button"
                      title="Refresh rating"
                    >
                      <FontAwesomeIcon icon={faSync} />
                      <span>Refresh Rating</span>
                    </button>
                  </div>

                  <div className="debug-rating-panel">
                    <div className="debug-title" onClick={() => {
                      const el = document.querySelector(`#debug-${lawyer._id}`);
                      if (el) el.style.display = el.style.display === 'block' ? 'none' : 'block';
                    }}>
                      {/* Debug Info ▼ */}
                    </div>
                    <div id={`debug-${lawyer._id}`} className="debug-content" style={{display: 'none'}}>
                      <p><strong>Rating:</strong> {lawyer.rating || 'Not set'}</p>
                      <p><strong>ratingsCount:</strong> {lawyer.ratingsCount || 'Not set'}</p>
                      <p><strong>reviewCount:</strong> {lawyer.reviewCount || 'Not set'}</p>
                      <p><strong>Stats API count:</strong> {reviewStats[lawyer._id]?.totalReviews || 'Not fetched'}</p>
                      <button onClick={(e) => {
                        e.stopPropagation();
                        forceRefreshLawyerRating(lawyer._id);
                      }} className="debug-fix-button">
                        Force Fix Rating
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {selectedLawyer && (
            <motion.div
              className="modal-overlay"
              onClick={handleCloseModal}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="modal-content calling-card"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
              >
                <button className="close-button" onClick={handleCloseModal}>
                  ×
                </button>

                <div className="lawyer-details">
                  <div className="header-section">
                    <div className="profile-section">
                      {selectedLawyer.profilePicture ? (
                        <img
                          src={`http://localhost:5000/uploads/${selectedLawyer.profilePicture}`}
                          alt={`${selectedLawyer.fullName}'s profile`}
                          className="profile-picture"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/default-lawyer-avatar.png';
                          }}
                        />
                      ) : (
                        <div className="profile-picture no-profile-picture">
                          <FontAwesomeIcon icon={faUserTie} />
                        </div>
                      )}
                    </div>
                    <h2>{selectedLawyer.fullName}</h2>
                    <p className="aen">
                      <strong>AEN:</strong> {selectedLawyer.AEN}
                    </p>
                  </div>

                  <div className="info-grid">
                    <div className="info-item">
                      <strong>Specialization:</strong>
                      <span>{selectedLawyer.specialization}</span>
                    </div>
                    <div className="info-item">
                      <strong>Experience:</strong>
                      <span>{selectedLawyer.yearsOfExperience} years</span>
                    </div>
                    <div className="info-item">
                      <strong>Location:</strong>
                      <span>{selectedLawyer.location?.address || 'Location not specified'}</span>
                    </div>
                    <div className="info-item">
                      <strong>Email:</strong>
                      <span>{selectedLawyer.email}</span>
                    </div>
                  </div>

                  {/* Add detailed fees section */}
                  <div className="fees-section">
                    <h3>Fees Structure</h3>
                    <div className="fees-grid">
                      <div className="fee-item">
                        <strong>Consultation Fee:</strong>
                        <span>{selectedLawyer.consultationFees ? 
                          selectedLawyer.consultationFees.replace(/^₹/, '') : '1000'}</span>
                      </div>
                      <div className="fee-item">
                        <strong>Video Call Fee:</strong>
                        <span>{typeof selectedLawyer.videoCallFees === 'number' ? 
                          `₹${selectedLawyer.videoCallFees}` : 
                          (selectedLawyer.videoCallFees ? 
                            selectedLawyer.videoCallFees.replace(/^₹/, '') : '1000')}</span>
                      </div>
                      <div className="fee-item">
                        <strong>Case Details Fee:</strong>
                        <span>{selectedLawyer.caseDetailsFees ? 
                          selectedLawyer.caseDetailsFees.replace(/^₹/, '') : '500'}</span>
                      </div>
                      <div className="fee-item">
                        <strong>Case Handling Fee:</strong>
                        <span>{selectedLawyer.caseHandlingFees ? 
                          selectedLawyer.caseHandlingFees.replace(/^₹/, '') : 
                          (selectedLawyer.fees ? 
                            selectedLawyer.fees.replace(/^₹/, '') : 'Varies')}</span>
                      </div>
                    </div>
                  </div>

                  {selectedLawyer.bio && (
                    <div className="bio-section">
                      <h3>About</h3>
                      <p>{selectedLawyer.bio}</p>
                    </div>
                  )}

                  {selectedLawyer.expertise && selectedLawyer.expertise.length > 0 && (
                    <div className="expertise-section">
                      <h3>Areas of Expertise</h3>
                      <div className="expertise-tags">
                        {selectedLawyer.expertise.map((item, index) => (
                          <span key={index} className="expertise-tag">{item}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="modal-actions">
                    <Link 
                      to={`/client/review/${selectedLawyer._id}`} 
                      className="action-button review-button"
                    >
                      <FontAwesomeIcon icon={faStar} className="me-2" />
                      Write a Review
                    </Link>
                  </div>
                </div>

                {/* Add detailed rating statistics section */}
                {reviewStats[selectedLawyer._id] && reviewStats[selectedLawyer._id].totalReviews > 0 && (
                  <div className="ratings-stats-section">
                    <h3>Review Statistics</h3>
                    <div className="stats-grid">
                      <div className="stats-item">
                        <strong>Total Reviews:</strong>
                        <span>{reviewStats[selectedLawyer._id].totalReviews}</span>
                      </div>
                      <div className="stats-item">
                        <strong>Average Rating:</strong>
                        <span>{reviewStats[selectedLawyer._id].averageRating}★</span>
                      </div>
                      <div className="stats-item">
                        <strong>Most Common Rating:</strong>
                        <span>{reviewStats[selectedLawyer._id].mostCommonRating}★</span>
                      </div>
                    </div>
                    
                    {/* Add rating distribution visualization */}
                    <div className="rating-distribution">
                      <h4>Rating Distribution</h4>
                      <div className="rating-bars">
                        {[5, 4, 3, 2, 1].map(rating => {
                          const count = reviewStats[selectedLawyer._id].ratingDistribution[rating] || 0;
                          const percentage = (count / reviewStats[selectedLawyer._id].totalReviews) * 100;
                          
                          return (
                            <div key={rating} className="rating-bar-container">
                              <div className="rating-bar-label">{rating}★</div>
                              <div className="rating-bar-outer">
                                <div
                                  className="rating-bar-inner"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <div className="rating-bar-count">{count}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {clientReviews[selectedLawyer._id] && (
                  <div className="client-modal-review">
                    <h3>Your Review</h3>
                    <div className="client-modal-rating">
                      <div className="stars-large">
                        {'★'.repeat(clientReviews[selectedLawyer._id].rating)}
                        {'☆'.repeat(5 - clientReviews[selectedLawyer._id].rating)}
                      </div>
                      <div className="rating-details">
                        <span className="rating-large">{clientReviews[selectedLawyer._id].rating}</span>/5
                      </div>
                    </div>
                    <blockquote className="client-modal-review-text">
                      {clientReviews[selectedLawyer._id].review}
                    </blockquote>
                    <p className="modal-review-date">
                      You reviewed this lawyer on {new Date(clientReviews[selectedLawyer._id].createdAt).toLocaleDateString()}
                    </p>
                    <Link 
                      to={`/client/review/${selectedLawyer._id}`} 
                      className="edit-review-btn"
                    >
                      <FontAwesomeIcon icon={faStar} className="me-2" />
                      Edit Your Review
                    </Link>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
      
      <style jsx="true">{`
        .review-lawyers-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #f8f9fa;
        }
        
        .review-lawyers-content {
          flex: 1;
          padding: 2rem 0;
        }
        
        .review-lawyers-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }
        
        .review-lawyers-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }
        
        .review-lawyers-header h1 {
          color: #2c3e50;
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }
        
        .review-lawyers-header p {
          color: #6c757d;
          font-size: 1.1rem;
          margin-bottom: 1.5rem;
        }
        
        .back-button {
          background-color: #6c757d;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background-color 0.3s;
        }
        
        .back-button:hover {
          background-color: #5a6268;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 0;
        }
        
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top: 4px solid #3498db;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-container {
          text-align: center;
          padding: 2rem;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .error-message {
          color: #dc3545;
          margin-bottom: 1rem;
        }
        
        .retry-button {
          background-color: #6c757d;
          color: white;
          border: none;
          padding: 0.5rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .empty-state {
          text-align: center;
          padding: 3rem 2rem;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .empty-icon {
          font-size: 4rem;
          color: #6c757d;
          margin-bottom: 1rem;
        }
        
        .empty-state h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: #343a40;
        }
        
        .empty-state p {
          color: #6c757d;
          margin-bottom: 1.5rem;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .lawyers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }
        
        .lawyer-card {
          background-color: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s, box-shadow 0.3s;
          position: relative;
        }
        
        .lawyer-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
        }
        
        .lawyer-info {
          padding: 1.5rem;
          display: flex;
          gap: 1rem;
        }
        
        .lawyer-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #f0f0f0;
        }
        
        .lawyer-details {
          flex: 1;
        }
        
        .lawyer-details h3 {
          margin: 0 0 0.5rem;
          color: #2c3e50;
          font-size: 1.25rem;
        }
        
        .specialization {
          color: #555;
          margin-bottom: 0.75rem;
        }
        
        .years-experience {
          margin-bottom: 0.75rem;
        }
        
        .rating-section {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        
        .rating-label {
          margin: 0;
          color: #555;
          font-size: 0.9rem;
          font-weight: 500;
        }
        
        .rating-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .rating-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #2c3e50;
          line-height: 1;
        }
        
        .stars-display {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .stars {
          color: #ffc107;
          font-size: 1.2rem;
          letter-spacing: 2px;
        }
        
        .review-count {
          color: #6c757d;
          font-size: 0.8rem;
        }
        
        .lawyer-profile-details {
          padding: 0 1.5rem 1rem;
        }
        
        .lawyer-bio {
          margin-bottom: 1rem;
          color: #555;
          font-size: 0.9rem;
          line-height: 1.4;
        }
        
        .lawyer-additional-info {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .info-label {
          font-weight: 600;
          color: #4a6da7;
          margin-right: 0.5rem;
        }
        
        .years-experience {
          margin-bottom: 0.5rem;
          color: #555;
        }
        
        .expertise-tags {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        
        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        
        .expertise-tag {
          background-color: #edf2f7;
          color: #4a5568;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
        }
        
        .more-tag {
          color: #718096;
          font-size: 0.8rem;
        }
        
        .languages {
          color: #555;
          font-size: 0.9rem;
        }
        
        .lawyer-action {
          padding: 1rem 1.5rem;
          background-color: #f8f9fa;
          border-top: 1px solid #dee2e6;
        }
        
        .review-button {
          display: block;
          width: 100%;
          background-color: #4a6da7;
          color: white;
          text-align: center;
          padding: 0.75rem 0;
          border-radius: 4px;
          text-decoration: none;
          transition: background-color 0.3s;
        }
        
        .review-button:hover {
          background-color: #3a5a8f;
        }
        
        .review-lawyers-header h1 .fa-star,
        .lawyer-action .fa-star {
          color: #ffc107;
        }
        
        @media (max-width: 768px) {
          .review-lawyers-header h1 {
            font-size: 2rem;
          }
          
          .lawyers-grid {
            grid-template-columns: 1fr;
          }
        }
        
        /* Modal styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }
        
        .modal-content {
          background: white;
          border-radius: 15px;
          padding: 30px;
          max-width: 600px;
          width: 90%;
          position: relative;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .calling-card {
          background: white;
          border-radius: 20px;
          padding: 30px;
        }
        
        .close-button {
          position: absolute;
          top: 15px;
          right: 15px;
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 50%;
          background: #f8f9fa;
          color: #2c3e50;
          font-size: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .close-button:hover {
          background: #e9ecef;
          transform: rotate(90deg);
        }
        
        .header-section {
          text-align: center;
          margin-bottom: 25px;
        }
        
        .profile-section {
          margin-bottom: 15px;
        }
        
        .profile-picture {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          margin: 0 auto;
          display: block;
          object-fit: cover;
          border: 3px solid #f0f0f0;
        }
        
        .no-profile-picture {
          background-color: #e9ecef;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          color: #adb5bd;
        }
        
        .header-section h2 {
          margin: 10px 0 5px;
          color: #2c3e50;
          font-size: 1.8rem;
        }
        
        .aen {
          color: #6c757d;
          font-size: 0.9rem;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 25px;
        }
        
        .info-item {
          background: #f8f9fa;
          padding: 12px 15px;
          border-radius: 8px;
        }
        
        .info-item strong {
          display: block;
          color: #495057;
          font-size: 0.85rem;
          margin-bottom: 5px;
        }
        
        .info-item span {
          color: #212529;
          font-size: 1rem;
        }
        
        .stars-display {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .bio-section {
          margin-bottom: 20px;
        }
        
        .bio-section h3 {
          color: #343a40;
          font-size: 1.2rem;
          margin-bottom: 10px;
        }
        
        .bio-section p {
          color: #495057;
          line-height: 1.5;
        }
        
        .expertise-section {
          margin-bottom: 25px;
        }
        
        .expertise-section h3 {
          color: #343a40;
          font-size: 1.2rem;
          margin-bottom: 10px;
        }
        
        .expertise-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .expertise-tag {
          background-color: #e9ecef;
          color: #495057;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
        }
        
        .modal-actions {
          display: flex;
          justify-content: center;
          margin-top: 25px;
        }
        
        .action-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 25px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.3s ease;
          border: none;
        }
        
        .review-button {
          background-color: #4a6da7;
          color: white;
        }
        
        .review-button:hover {
          background-color: #3a5a8f;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        /* Responsive styles */
        @media (max-width: 768px) {
          .info-grid {
            grid-template-columns: 1fr;
          }
          
          .modal-content {
            width: 95%;
            padding: 20px;
          }
        }
        
        /* Make the lawyer card look clickable */
        .lawyer-card {
          cursor: pointer;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .lawyer-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }
        
        .debug-info {
          margin-top: 20px;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 4px;
          font-size: 0.8rem;
          color: #495057;
          text-align: left;
        }
        
        .fees-section {
          margin: 25px 0;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 10px;
        }
        
        .fees-section h3 {
          color: #343a40;
          font-size: 1.2rem;
          margin-bottom: 15px;
          border-bottom: 1px solid #dee2e6;
          padding-bottom: 8px;
        }
        
        .fees-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        
        .fee-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .fee-item strong {
          color: #495057;
          font-size: 0.9rem;
          font-weight: 500;
        }
        
        .fee-item span {
          color: #212529;
          font-size: 1.1rem;
          font-weight: 600;
        }
        
        .fee-item span:before {
          content: "₹";
          margin-right: 2px;
        }
        
        @media (max-width: 768px) {
          .fees-grid {
            grid-template-columns: 1fr;
          }
        }
        
        /* Make sure the review button is clearly clickable even within a clickable card */
        .review-button {
          position: relative;
          z-index: 2;  /* Ensure it's above the card for proper click handling */
        }
        
        .header-buttons {
          display: flex;
          gap: 15px;
          margin-top: 15px;
          justify-content: center;
        }
        
        .refresh-button {
          background-color: #4a6da7;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background-color 0.3s;
          display: flex;
          align-items: center;
        }
        
        .refresh-button:hover:not(:disabled) {
          background-color: #3a5a8f;
        }
        
        .refresh-button:disabled {
          background-color: #a0a0a0;
          cursor: not-allowed;
        }
        
        /* Make the rating more prominent */
        .rating-section {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        
        .rating-label {
          margin: 0;
          color: #555;
          font-size: 0.9rem;
          font-weight: 500;
        }
        
        .rating-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .rating-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #2c3e50;
          line-height: 1;
        }
        
        .stars-display {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .stars {
          color: #ffc107;
          font-size: 1.2rem;
          letter-spacing: 2px;
        }
        
        .review-count {
          color: #6c757d;
          font-size: 0.8rem;
        }
        
        .recently-reviewed-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background-color: #4CAF50;
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 0.8rem;
          animation: pulse 1.5s infinite;
          z-index: 1;
        }
        
        @keyframes pulse {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }

        /* Common Rating Styles */
        .common-rating-section {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        
        .common-rating-label {
          margin: 0;
          color: #555;
          font-size: 0.85rem;
          font-weight: 500;
        }
        
        .common-rating-value {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .rating-badge {
          background-color: #ffcc00;
          color: #333;
          font-weight: bold;
          font-size: 1rem;
          padding: 3px 8px;
          border-radius: 15px;
        }
        
        .common-rating-text {
          font-size: 0.85rem;
          color: #666;
        }

        .ratings-stats-section {
          margin: 25px 0;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 10px;
        }
        
        .ratings-stats-section h3 {
          color: #343a40;
          font-size: 1.2rem;
          margin-bottom: 15px;
          border-bottom: 1px solid #dee2e6;
          padding-bottom: 8px;
        }
        
        .ratings-stats-section h4 {
          color: #495057;
          font-size: 1rem;
          margin: 15px 0 10px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .stats-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
          background: white;
          padding: 10px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .stats-item strong {
          color: #495057;
          font-size: 0.9rem;
        }
        
        .stats-item span {
          color: #212529;
          font-size: 1.1rem;
          font-weight: 600;
        }
        
        .rating-distribution {
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .rating-bars {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .rating-bar-container {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 24px;
        }
        
        .rating-bar-label {
          width: 30px;
          text-align: right;
          color: #495057;
          font-weight: 500;
        }
        
        .rating-bar-outer {
          flex: 1;
          height: 12px;
          background-color: #e9ecef;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .rating-bar-inner {
          height: 100%;
          background-color: #ffc107;
          border-radius: 6px;
          transition: width 0.5s ease-in-out;
        }
        
        .rating-bar-count {
          width: 30px;
          text-align: left;
          color: #6c757d;
          font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .updating {
          animation: pulse 1s infinite alternate;
          color: #4a6da7;
          font-style: italic;
        }
        
        @keyframes pulse {
          from { opacity: 0.6; }
          to { opacity: 1; }
        }

        /* Client review styles */
        .client-review-section {
          margin-bottom: 15px;
          padding: 12px 15px;
          background-color: #f3f8ff;
          border-left: 4px solid #4a6da7;
          border-radius: 4px;
        }
        
        .client-review-section h4 {
          color: #4a6da7;
          font-size: 1rem;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
        }
        
        .client-rating {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .your-rating-stars {
          color: #ffc107;
          font-size: 1.2rem;
          letter-spacing: 2px;
        }
        
        .your-rating-value {
          font-weight: 600;
          color: #333;
        }
        
        .client-review-text {
          margin: 8px 0;
          font-style: italic;
          color: #555;
          line-height: 1.4;
        }
        
        .review-date {
          font-size: 0.8rem;
          color: #777;
          margin: 5px 0 0 0;
          text-align: right;
        }

        .client-modal-review {
          margin: 25px 0;
          padding: 20px;
          background-color: #f3f8ff;
          border-radius: 10px;
          border-left: 4px solid #4a6da7;
        }
        
        .client-modal-review h3 {
          color: #4a6da7;
          font-size: 1.2rem;
          margin-bottom: 15px;
          border-bottom: 1px solid #dee2e6;
          padding-bottom: 8px;
        }
        
        .client-modal-rating {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .stars-large {
          color: #ffc107;
          font-size: 1.5rem;
          letter-spacing: 3px;
        }
        
        .rating-details {
          display: flex;
          align-items: baseline;
          color: #495057;
        }
        
        .rating-large {
          font-size: 1.8rem;
          font-weight: 700;
          color: #333;
          margin-right: 2px;
        }
        
        .client-modal-review-text {
          font-style: italic;
          color: #555;
          background-color: white;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          line-height: 1.5;
          position: relative;
        }
        
        .client-modal-review-text::before {
          content: open-quote;
          font-size: 4em;
          position: absolute;
          left: -15px;
          top: -20px;
          color: #4a6da7;
          opacity: 0.2;
        }
        
        .modal-review-date {
          text-align: right;
          font-size: 0.9rem;
          color: #6c757d;
          margin: 10px 0;
        }
        
        .edit-review-btn {
          display: inline-block;
          background-color: #4a6da7;
          color: white;
          padding: 8px 20px;
          border-radius: 4px;
          text-decoration: none;
          margin-top: 10px;
          transition: background-color 0.3s;
        }
        
        .edit-review-btn:hover {
          background-color: #3a5a8f;
        }

        .refresh-rating-container {
          padding: 0 1.5rem 0.5rem;
          text-align: right;
        }
        
        .refresh-rating-button {
          background: none;
          border: none;
          color: #4a6da7;
          font-size: 0.8rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 3px 8px;
          border-radius: 4px;
          margin-left: auto;
          transition: background-color 0.2s;
        }
        
        .refresh-rating-button:hover {
          background-color: #f0f4f9;
        }

        .fix-button {
          background-color: #dc3545;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background-color 0.3s;
          display: flex;
          align-items: center;
        }
        
        .fix-button:hover:not(:disabled) {
          background-color: #c82333;
        }
        
        .fix-button:disabled {
          background-color: #a0a0a0;
          cursor: not-allowed;
        }

        .debug-rating-panel {
          margin-top: 15px;
          border-top: 1px dashed #ddd;
          padding-top: 10px;
          font-size: 0.8rem;
        }
        
        .debug-title {
          color: #777;
          cursor: pointer;
          user-select: none;
        }
        
        .debug-content {
          padding: 10px;
          background: #f9f9f9;
          margin-top: 5px;
          border-radius: 4px;
        }
        
        .debug-content p {
          margin: 3px 0;
        }
        
        .debug-fix-button {
          background: #dc3545;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 3px;
          margin-top: 8px;
          cursor: pointer;
        }

        .emergency-fix-button {
          background-color: #9c27b0;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background-color 0.3s;
          display: flex;
          align-items: center;
        }
        
        .emergency-fix-button:hover:not(:disabled) {
          background-color: #7b1fa2;
        }
        
        .emergency-fix-button:disabled {
          background-color: #a0a0a0;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default ReviewLawyersList; 