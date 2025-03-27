import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faTimes,
  faEdit,
  faTrash,
  faArrowLeft,
  faFilter,
  faSearch,
  faShield
} from "@fortawesome/free-solid-svg-icons";
import Navbar from "../../components/navbar/navbar-admin";
import Footer from "../../components/footer/footer-admin";

const ContentModeration = () => {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDetails, setShowDetails] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReviews();
  }, []);

  const loadSampleData = () => {
    const sampleReviews = [
      {
        _id: "sample1",
        clientID: "client1",
        lawyerID: "lawyer1",
        clientName: "John Doe",
        lawyerName: "Jane Smith, Esq.",
        rating: 4,
        review: "This lawyer was very professional and helped me win my case.",
        status: "pending",
        createdAt: new Date().toISOString()
      },
      {
        _id: "sample2",
        clientID: "client2",
        lawyerID: "lawyer1",
        clientName: "Alice Johnson",
        lawyerName: "Jane Smith, Esq.",
        rating: 5,
        review: "Excellent service! Highly recommended for family law matters.",
        status: "approved",
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        _id: "sample3",
        clientID: "client3",
        lawyerID: "lawyer2",
        clientName: "Bob Brown",
        lawyerName: "Mark Wilson, Esq.",
        rating: 2,
        review: "Not satisfied with the service. Took too long to respond.",
        status: "rejected",
        createdAt: new Date(Date.now() - 172800000).toISOString()
      }
    ];
    
    console.log("Loading sample review data");
    setReviews(sampleReviews);
    setFilteredReviews(sampleReviews);
    setLoading(false);
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        console.log("Attempting to fetch reviews from API...");
        const response = await axios.get("http://localhost:5000/api/reviews/admin/all", config);
        
        if (response.data && Array.isArray(response.data)) {
          console.log(`Received ${response.data.length} reviews from API`);
          
          // Log the first review to see client data
          if (response.data.length > 0) {
            console.log("Sample review data:", {
              clientID: response.data[0].clientID,
              clientName: response.data[0].clientName,
              review: response.data[0].review.substring(0, 30) + "..."
            });
          }
          
          setReviews(response.data);
          setFilteredReviews(response.data);
        } else {
          console.log("API returned non-array data, falling back to sample data");
          loadSampleData();
        }
      } catch (apiError) {
        console.error("API call failed, loading sample data instead", apiError);
        loadSampleData();
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Overall error in fetchReviews:", error);
      loadSampleData();
      setLoading(false);
    }
  };

  useEffect(() => {
    // Filter reviews based on search term and status filter
    const filtered = reviews.filter(review => {
      const matchesSearch = review.review.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           review.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           review.lawyerName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || review.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    setFilteredReviews(filtered);
  }, [searchTerm, statusFilter, reviews]);

  const handleApprove = async (reviewId) => {
    try {
      const token = sessionStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      await axios.put(`http://localhost:5000/api/reviews/admin/approve/${reviewId}`, {}, config);
      
      // Update local state
      setReviews(prevReviews => 
        prevReviews.map(review => 
          review._id === reviewId ? { ...review, status: 'approved' } : review
        )
      );
    } catch (error) {
      console.error("Error approving review:", error);
      alert("Failed to approve review. Please try again.");
    }
  };

  const handleReject = async (reviewId) => {
    try {
      const token = sessionStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      await axios.put(`http://localhost:5000/api/reviews/admin/reject/${reviewId}`, {}, config);
      
      // Update local state
      setReviews(prevReviews => 
        prevReviews.map(review => 
          review._id === reviewId ? { ...review, status: 'rejected' } : review
        )
      );
    } catch (error) {
      console.error("Error rejecting review:", error);
      alert("Failed to reject review. Please try again.");
    }
  };

  const handleDelete = async (reviewId) => {
    if (window.confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      try {
        const token = sessionStorage.getItem("token");
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
  
        await axios.delete(`http://localhost:5000/api/reviews/admin/${reviewId}`, config);
        
        // Update local state
        setReviews(prevReviews => prevReviews.filter(review => review._id !== reviewId));
      } catch (error) {
        console.error("Error deleting review:", error);
        alert("Failed to delete review. Please try again.");
      }
    }
  };

  const handleShowDetails = (reviewId) => {
    setShowDetails(showDetails === reviewId ? null : reviewId);
  };

  const renderStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return <span className="status-badge approved">Approved</span>;
      case 'rejected':
        return <span className="status-badge rejected">Rejected</span>;
      case 'pending':
        return null;
      default:
        return <span className="status-badge">Unknown</span>;
    }
  };

  return (
    <div className="content-moderation-page">
      <Navbar />
      <div className="content-moderation-container">
        <Helmet>
          <title>Content Moderation - Lex Net Admin</title>
        </Helmet>

        <div className="top-controls">
          <div className="back-button-wrapper">
            <button onClick={() => navigate('/AdminDashboard')} className="back-button">
              <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
              Back to Dashboard
            </button>
          </div>
          
          <div className="filters-wrapper">
            <div className="search-bar">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                placeholder="Search by client, lawyer, or review content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-dropdown">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Reviews</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <FontAwesomeIcon icon={faFilter} className="filter-icon" />
            </div>
          </div>
        </div>

        <div className="content-header">
          <h1>
            <FontAwesomeIcon icon={faShield} className="me-3" />
            Content Moderation
          </h1>
          <p>Review and moderate user content</p>
        </div>

        <div className="diagnostic-section">
          <h3>Diagnostics</h3>
          <div className="diagnostic-info">
            <p><strong>Total Reviews:</strong> {reviews.length}</p>
            <p><strong>Filtered Reviews:</strong> {filteredReviews.length}</p>
            <p><strong>Filter Status:</strong> {statusFilter}</p>
            <p><strong>Search Term:</strong> "{searchTerm}"</p>
          </div>
          
          <div className="diagnostic-actions">
            <button 
              onClick={() => {
                console.log("All reviews:", reviews);
                alert(`Reviews in state: ${reviews.length}`);
              }} 
              className="diagnostic-button"
            >
              Log Reviews to Console
            </button>
            
            <button 
              onClick={fetchReviews} 
              className="diagnostic-button primary"
            >
              Refresh Reviews
            </button>
          </div>
          
          <style jsx="true">{`
            .diagnostic-section {
              background-color: #f8d7da;
              border: 1px solid #f5c6cb;
              padding: 1rem;
              margin-bottom: 1.5rem;
              border-radius: 4px;
            }
            
            .diagnostic-section h3 {
              color: #721c24;
              margin-top: 0;
              margin-bottom: 1rem;
            }
            
            .diagnostic-info {
              margin-bottom: 1rem;
            }
            
            .diagnostic-info p {
              margin: 0.5rem 0;
            }
            
            .diagnostic-actions {
              display: flex;
              gap: 0.5rem;
            }
            
            .diagnostic-button {
              padding: 0.5rem 1rem;
              border: none;
              border-radius: 4px;
              background-color: #e2e3e5;
              color: #383d41;
              cursor: pointer;
            }
            
            .diagnostic-button.primary {
              background-color: #007bff;
              color: white;
            }
          `}</style>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading reviews...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button onClick={fetchReviews} className="retry-button">
              Try Again
            </button>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="empty-state">
            <FontAwesomeIcon icon={faSearch} className="empty-icon" />
            <h3>No Reviews Found</h3>
            <p>No reviews match your search criteria or there are no reviews to moderate.</p>
          </div>
        ) : (
          <div className="reviews-list">
            {filteredReviews.map(review => (
              <div key={review._id} className={`review-card ${review.status}`}>
                <div className="review-header">
                  <div className="review-meta">
                    <h3 className="client-name">
                      {review.clientName !== "Unknown Client" ? 
                        review.clientName : 
                        (review.clientID ? 
                          `Anonymous Client (ID: ${review.clientID.substring(0, 8)}...)` : 
                          "Unknown Client")}
                    </h3>
                    <div className="review-details">
                      <span className="lawyer-name">
                        reviewed <strong>
                          {review.lawyerName && !review.lawyerName.startsWith("Lawyer ID:") 
                            ? review.lawyerName 
                            : "Unknown Lawyer"}
                        </strong>
                      </span>
                      <span className="rating">
                        {'★'.repeat(review.rating)}
                        {'☆'.repeat(5 - review.rating)}
                      </span>
                    </div>
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="status-section">
                    {renderStatusBadge(review.status)}
                  </div>
                </div>
                
                <div className="review-content">
                  <p>{review.review}</p>
                </div>
                
                <div className="review-actions">
                  <button 
                    className="action-button info-button"
                    onClick={() => handleShowDetails(review._id)}
                  >
                    {showDetails === review._id ? "Hide Details" : "Show Details"}
                  </button>
                  
                  {false && (
                    <>
                      <button 
                        className="action-button approve-button"
                        onClick={() => handleApprove(review._id)}
                        disabled={review.status === 'approved'}
                      >
                        <FontAwesomeIcon icon={faCheck} />
                        Approve
                      </button>
                      
                      <button 
                        className="action-button reject-button"
                        onClick={() => handleReject(review._id)}
                        disabled={review.status === 'rejected'}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                        Reject
                      </button>
                    </>
                  )}
                  
                  <button 
                    className="action-button delete-button"
                    onClick={() => handleDelete(review._id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    Delete
                  </button>
                </div>
                
                {showDetails === review._id && (
                  <div className="review-details-panel">
                    <div className="details-grid">
                      <div className="detail-item">
                        <strong>Review ID:</strong>
                        <span>{review._id}</span>
                      </div>
                      <div className="detail-item">
                        <strong>Client:</strong>
                        <span>
                          {review.clientName && review.clientName !== "Unknown Client" 
                            ? review.clientName 
                            : "Anonymous Client"}
                          <br/>
                          <small className="text-muted">ID: {review.clientID}</small>
                        </span>
                      </div>
                      <div className="detail-item">
                        <strong>Lawyer:</strong>
                        <span>{review.lawyerName} <br/><small className="text-muted">({review.lawyerID})</small></span>
                      </div>
                      {/* Only show the status detail if it's not pending */}
                      {review.status !== 'pending' && (
                        <div className="detail-item">
                          <strong>Status:</strong>
                          <span className={`status-text ${review.status}`}>{review.status}</span>
                        </div>
                      )}
                      <div className="detail-item">
                        <strong>Rating:</strong>
                        <span className="detail-rating">
                          {review.rating} / 5
                          <span className="star-display">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                        </span>
                      </div>
                      <div className="detail-item">
                        <strong>Date Submitted:</strong>
                        <span>{new Date(review.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="review-full-text">
                      <strong>Full Review Text:</strong>
                      <p className="review-text-block">{review.review}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
      
      <style jsx="true">{`
        .content-moderation-page {
          background-color: #f8f9fa;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', 'Segoe UI', Roboto, sans-serif;
        }
        
        .content-moderation-container {
          flex: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
          position: relative;
        }
        
        .top-controls {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          width: 100%;
        }
        
        .back-button-wrapper {
          flex: 0 0 auto;
          margin-right: 40rem;
        }
        
        .filters-wrapper {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          flex: 1 1 auto;
        }
        
        .back-button {
          background-color: #4a5568;
          color: white;
          border: none;
          margin-right: 40rem;
          padding: 0.65rem 1.25rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          display: flex;
          align-items: left;
          gap: 0.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
        }
        
        .back-button:hover {
          background-color: #3d4757;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .search-bar {
          position: relative;
          width: 250px;
        }
        
        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #a0aec0;
          z-index: 1;
          pointer-events: none;
        }
        
        .search-bar input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .filter-dropdown {
          position: relative;
          width: 160px;
        }
        
        .filter-dropdown select {
          appearance: none;
          width: 100%;
          padding: 0.75rem 2.5rem 0.75rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
          background-color: white;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .filter-icon {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #a0aec0;
          pointer-events: none;
        }
        
        .content-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 2.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        
        .content-header h1 {
          color: #2d3748;
          font-size: 2.2rem;
          margin-bottom: 0.5rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }
        
        .content-header p {
          color: #718096;
          font-size: 1.1rem;
          font-weight: 400;
        }
        
        .reviews-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }
        
        .review-card {
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1);
          overflow: hidden;
          transition: transform 0.3s, box-shadow 0.3s;
          border-top: 5px solid #e2e8f0;
          display: flex;
          flex-direction: column;
        }
        
        .review-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 15px rgba(0,0,0,0.1);
        }
        
        .review-card.approved {
          border-top-color: #48bb78;
        }
        
        .review-card.rejected {
          border-top-color: #f56565;
        }
        
        .review-card.pending {
          border-top-color: #ecc94b;
        }
        
        .review-header {
          padding: 1.5rem 1.5rem 1rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        
        .review-meta {
          flex: 1;
        }
        
        .client-name {
          margin: 0 0 0.75rem;
          font-size: 1.25rem;
          color: #2d3748;
          font-weight: 600;
        }
        
        .review-details {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
        }
        
        .lawyer-name {
          color: #4a5568;
          font-size: 0.95rem;
          font-weight: 500;
        }
        
        .rating {
          color: #ecc94b;
          font-size: 1.1rem;
          letter-spacing: 2px;
        }
        
        .review-date {
          color: #718096;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        
        .status-section {
          margin-left: 1rem;
        }
        
        .status-badge {
          padding: 0.4rem 0.85rem;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .status-badge.approved {
          background-color: rgba(72, 187, 120, 0.15);
          color: #2f855a;
        }
        
        .status-badge.rejected {
          background-color: rgba(245, 101, 101, 0.15);
          color: #c53030;
        }
        
        .status-badge.pending {
          background-color: rgba(236, 201, 75, 0.15);
          color: #b7791f;
        }
        
        .review-content {
          padding: 0 1.5rem 1.5rem;
          color: #4a5568;
          font-size: 1rem;
          line-height: 1.6;
          flex: 1;
        }
        
        .review-content p {
          margin: 0;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        }
        
        .review-actions {
          display: flex;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background-color: #f7fafc;
          border-top: 1px solid #edf2f7;
          justify-content: flex-end;
        }
        
        .action-button {
          padding: 0.6rem 1.2rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }
        
        .info-button {
          background-color: #e2e8f0;
          color: #4a5568;
        }
        
        .info-button:hover:not(:disabled) {
          background-color: #cbd5e0;
        }
        
        .approve-button {
          background-color: #48bb78;
          color: white;
        }
        
        .approve-button:hover:not(:disabled) {
          background-color: #38a169;
        }
        
        .reject-button {
          background-color: #f56565;
          color: white;
        }
        
        .reject-button:hover:not(:disabled) {
          background-color: #e53e3e;
        }
        
        .delete-button {
          background-color: #4a5568;
          color: white;
        }
        
        .delete-button:hover:not(:disabled) {
          background-color: #2d3748;
        }
        
        .action-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .review-details-panel {
          padding: 1.5rem;
          background-color: #f8fafc;
          border-top: 1px solid #edf2f7;
          animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.25rem;
        }
        
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        
        .detail-item strong {
          color: #2d3748;
          font-size: 0.9rem;
          font-weight: 600;
        }
        
        .detail-item span {
          color: #4a5568;
          font-size: 0.95rem;
        }
        
        .status-text {
          text-transform: uppercase;
          font-weight: 600;
          font-size: 0.85rem;
          letter-spacing: 0.5px;
        }
        
        .status-text.approved {
          color: #2f855a;
        }
        
        .status-text.rejected {
          color: #c53030;
        }
        
        .status-text.pending {
          color: #b7791f;
        }
        
        .detail-rating {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .star-display {
          color: #ecc94b;
          letter-spacing: 2px;
        }
        
        .text-muted {
          color: #718096;
          font-size: 0.85rem;
        }
        
        .review-full-text {
          margin-top: 1.25rem;
          border-top: 1px solid #edf2f7;
          padding-top: 1.25rem;
        }
        
        .review-text-block {
          background-color: white;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          margin-top: 0.5rem;
          white-space: pre-wrap;
          line-height: 1.6;
        }
        
        /* Diagnostic section styling */
        .diagnostic-section {
          background-color: #ebf8ff;
          border: 1px solid #bee3f8;
          padding: 1.25rem;
          margin-bottom: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        
        .diagnostic-section h3 {
          color: #2c5282;
          margin-top: 0;
          margin-bottom: 1rem;
          font-size: 1.1rem;
          font-weight: 600;
        }
        
        .diagnostic-info {
          margin-bottom: 1.25rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        
        .diagnostic-info p {
          margin: 0.35rem 0;
          color: #4a5568;
          font-size: 0.95rem;
        }
        
        .diagnostic-info p strong {
          color: #2c5282;
          font-weight: 600;
        }
        
        .diagnostic-actions {
          display: flex;
          gap: 0.75rem;
        }
        
        .diagnostic-button {
          padding: 0.65rem 1.25rem;
          border: none;
          border-radius: 8px;
          background-color: #e2e8f0;
          color: #4a5568;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          font-size: 0.95rem;
        }
        
        .diagnostic-button:hover {
          background-color: #cbd5e0;
        }
        
        .diagnostic-button.primary {
          background-color: #4299e1;
          color: white;
        }
        
        .diagnostic-button.primary:hover {
          background-color: #3182ce;
        }
        
        /* Status indicators */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 0;
          text-align: center;
        }
        
        .spinner {
          border: 4px solid rgba(226, 232, 240, 0.6);
          border-radius: 50%;
          border-top: 4px solid #4299e1;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin-bottom: 1.25rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .loading-container p {
          color: #4a5568;
          font-size: 1.1rem;
          font-weight: 500;
        }
        
        .error-container {
          text-align: center;
          padding: 3rem 0;
          background-color: #fff5f5;
          border-radius: 8px;
          border: 1px solid #fed7d7;
        }
        
        .error-message {
          color: #c53030;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }
        
        .retry-button {
          background-color: #4a5568;
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .retry-button:hover {
          background-color: #2d3748;
        }
        
        .empty-state {
          text-align: center;
          padding: 4rem 0;
        }
        
        .empty-icon {
          font-size: 3.5rem;
          color: #a0aec0;
          margin-bottom: 1.25rem;
        }
        
        .empty-state h3 {
          color: #2d3748;
          font-size: 1.5rem;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }
        
        .empty-state p {
          color: #718096;
          max-width: 500px;
          margin: 0 auto;
          font-size: 1.05rem;
        }
        
        /* Media queries for responsiveness */
        @media (max-width: 768px) {
          .top-controls {
            flex-direction: column;
            gap: 1rem;
          }
          
          .filters-wrapper {
            flex-direction: column;
            width: 100%;
          }
          
          .search-bar, .filter-dropdown {
            width: 100%;
          }
          
          .back-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ContentModeration;
