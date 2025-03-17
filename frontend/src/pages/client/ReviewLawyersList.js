import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faArrowLeft, faSearch, faUserTie } from "@fortawesome/free-solid-svg-icons";
import Navbar from "../../components/navbar/navbar-client";
import Footer from "../../components/footer/footer-client";

const ReviewLawyersList = () => {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const clientID = sessionStorage.getItem("userid");

  useEffect(() => {
    const fetchLawyers = async () => {
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

        // First, fetch cases to get lawyers the client has worked with
        const casesResponse = await axios.get(
          "https://lexnet-backend.onrender.com/api/cases/list",
          config
        );
        
        // Extract unique lawyer IDs from cases
        const lawyerIds = new Set();
        if (casesResponse.data && casesResponse.data.cases) {
          casesResponse.data.cases.forEach(caseItem => {
            if (caseItem.lawyerId) {
              lawyerIds.add(caseItem.lawyerId);
            }
          });
        }
        
        // If there are no lawyers found in cases, show a message
        if (lawyerIds.size === 0) {
          setLawyers([]);
          setLoading(false);
          return;
        }
        
        // Fetch details for each lawyer
        const lawyersPromises = Array.from(lawyerIds).map(id => 
          axios.get(`https://lexnet-backend.onrender.com/api/lawyers/${id}`, config)
        );
        
        const lawyersResponses = await Promise.all(lawyersPromises);
        const lawyersData = lawyersResponses.map(response => response.data);
        
        setLawyers(lawyersData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching lawyers:", error);
        setError("Failed to load lawyers. Please try again.");
        setLoading(false);
      }
    };

    fetchLawyers();
  }, [navigate, clientID]);

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
            
            <button 
              onClick={() => navigate('/clientdashboard')}
              className="back-button"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
              Back to Dashboard
            </button>
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
              <button 
                onClick={() => navigate('/client/lawyer-search')}
                className="find-lawyer-button"
              >
                Find a Lawyer
              </button>
            </div>
          ) : (
            <div className="lawyers-grid">
              {lawyers.map(lawyer => (
                <div key={lawyer._id} className="lawyer-card">
                  <div className="lawyer-info">
                    <img 
                      src={lawyer.profilePicture ? 
                        `https://lexnet-backend.onrender.com/uploads/${lawyer.profilePicture}` : 
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
                      <div className="rating-display">
                        <span>Current Rating: </span>
                        <span className="rating-value">{lawyer.rating ? lawyer.rating.toFixed(1) : 'N/A'}</span>
                        <span className="stars">
                          {'★'.repeat(Math.round(lawyer.rating || 0))}
                          {'☆'.repeat(5 - Math.round(lawyer.rating || 0))}
                        </span>
                        <span>({lawyer.ratingsCount || 0} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <div className="lawyer-action">
                    <Link 
                      to={`/client/review/${lawyer._id}`} 
                      className="review-button"
                    >
                      <FontAwesomeIcon icon={faStar} className="me-2" />
                      Write a Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
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
        
        .find-lawyer-button {
          background-color: #4a6da7;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .find-lawyer-button:hover {
          background-color: #3a5a8f;
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
        
        .rating-display {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .rating-value {
          font-weight: bold;
          margin: 0 0.25rem;
        }
        
        .stars {
          letter-spacing: 2px;
          color: #ffc107;
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
      `}</style>
    </div>
  );
};

export default ReviewLawyersList; 