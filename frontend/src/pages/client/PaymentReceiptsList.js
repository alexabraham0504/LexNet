import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faReceipt, faDownload, faEye, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import Navbar from "../../components/navbar/navbar-client";
import Footer from "../../components/footer/footer-client";
import ClientSidebar from "../../components/sidebar/ClientSidebar";

const PaymentReceiptsList = () => {
  const [receipts, setReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setIsLoading(true);
        const token = sessionStorage.getItem("token");
        const email = sessionStorage.getItem("email");
        
        if (!token || !email) {
          throw new Error("Authentication information missing");
        }
        
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        const response = await axios.get(
          `https://lexnet-backend.onrender.com/api/payments/receipts/client/${email}`,
          config
        );
        
        setReceipts(response.data.data.receipts || []);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching receipts:", error);
        setError("Failed to load payment receipts. Please try again later.");
        setIsLoading(false);
      }
    };
    
    fetchReceipts();
  }, []);
  
  const handleViewReceipt = (receiptId) => {
    navigate(`/client/payment-receipt/${receiptId}`);
  };

  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };
  
  return (
    <div className="receipts-page">
      <Navbar />
      <ClientSidebar onToggle={handleSidebarToggle} />
      
      <Link to="/clientdashboard" className="back-button-fixed">
        <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
      </Link>
      
      <div className={`receipts-container ${!sidebarCollapsed ? 'sidebar-expanded' : ''}`}>
        <Helmet>
          <title>Payment Receipts - Lex Net</title>
        </Helmet>
        
        <div className="receipts-header">
          <h1>Your Payment Receipts</h1>
          <p>View and download receipts for all your payments</p>
        </div>
        
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your receipts...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="retry-button">
              Try Again
            </button>
          </div>
        ) : receipts.length === 0 ? (
          <div className="no-receipts">
            <FontAwesomeIcon icon={faReceipt} className="no-receipts-icon" />
            <h2>No Payment Receipts Found</h2>
            <p>You haven't made any payments yet. When you book appointments with lawyers, your payment receipts will appear here.</p>
            <Link to="/client/lawyer-search" className="find-lawyer-button">
              Find a Lawyer
            </Link>
          </div>
        ) : (
          <div className="receipts-list">
            <div className="receipts-table-header">
              <div className="receipt-cell">Receipt #</div>
              <div className="receipt-cell">Date</div>
              <div className="receipt-cell">Lawyer</div>
              <div className="receipt-cell">Amount</div>
              <div className="receipt-cell">Actions</div>
            </div>
            
            {receipts.map((receipt) => (
              <div key={receipt.receiptId} className="receipt-row">
                <div className="receipt-cell">{receipt.receiptNumber}</div>
                <div className="receipt-cell">{new Date(receipt.date).toLocaleDateString()}</div>
                <div className="receipt-cell">{receipt.lawyerName}</div>
                <div className="receipt-cell">₹{receipt.amount}</div>
                <div className="receipt-cell actions">
                  <button 
                    onClick={() => handleViewReceipt(receipt.receiptId)}
                    className="view-button"
                  >
                    <FontAwesomeIcon icon={faEye} /> View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
      
      <style jsx="true">{`
        .receipts-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        
        .receipts-container {
          flex: 1;
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
          transition: margin-left 0.3s ease;
          margin-top: 20px;
        }
        
        .sidebar-expanded {
          margin-left: 280px;
        }
        
        .back-button-fixed {
          position: fixed;
          top: 120px;
          left: 20px;
          z-index: 100;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #555;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s, background-color 0.3s;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          background-color: #f5f5f5;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .back-button-fixed:hover {
          color: #000;
          background-color: #e9e9e9;
        }
        
        .receipts-header {
          margin-bottom: 2rem;
          text-align: center;
        }
        
        .receipts-header h1 {
          font-size: 2.5rem;
          color: #333;
          margin-bottom: 0.5rem;
        }
        
        .receipts-header p {
          color: #666;
          font-size: 1.1rem;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
        }
        
        .loading-spinner {
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
          padding: 3rem;
          background-color: #fff3f3;
          border-radius: 8px;
          border: 1px solid #ffcccb;
        }
        
        .retry-button {
          background-color: #3498db;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 1rem;
        }
        
        .no-receipts {
          text-align: center;
          padding: 3rem;
          background-color: #f9f9f9;
          border-radius: 8px;
          border: 1px solid #eee;
        }
        
        .no-receipts-icon {
          font-size: 4rem;
          color: #ccc;
          margin-bottom: 1rem;
        }
        
        .find-lawyer-button {
          display: inline-block;
          background-color: #3498db;
          color: white;
          text-decoration: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          margin-top: 1rem;
          transition: background-color 0.3s;
        }
        
        .find-lawyer-button:hover {
          background-color: #2980b9;
        }
        
        .receipts-list {
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          width: 100%;
          border: 1px solid #f0f0f0;
          margin-top: 2rem;
        }
        
        .receipts-table-header {
          display: grid;
          grid-template-columns: 1.5fr 1fr 2fr 1fr 1fr;
          gap: 1.5rem;
          background: linear-gradient(to right, #f8f9fa, #f1f3f5);
          font-weight: 600;
          padding: 1.5rem 2rem;
          border-bottom: 2px solid #eaeaea;
          color: #495057;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          font-size: 0.9rem;
        }
        
        .receipt-row {
          display: grid;
          grid-template-columns: 1.5fr 1fr 2fr 1fr 1fr;
          gap: 1.5rem;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #f0f0f0;
          transition: all 0.3s ease;
          align-items: center;
        }
        
        .receipt-row:last-child {
          border-bottom: none;
        }
        
        .receipt-row:hover {
          background-color: #f8f9fa;
          transform: translateY(-2px);
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        
        .receipt-cell {
          display: flex;
          align-items: center;
          font-size: 1.05rem;
          color: #343a40;
        }
        
        .receipt-cell:first-child {
          font-weight: 500;
          color: #3498db;
        }
        
        .actions {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }
        
        .view-button {
          background: linear-gradient(to right, #3498db, #2980b9);
          color: white;
          border: none;
          padding: 0.7rem 1.4rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .view-button:hover {
          background: linear-gradient(to right, #2980b9, #2573a7);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .view-button:active {
          transform: translateY(0);
        }
        
        @media (max-width: 768px) {
          .sidebar-expanded {
            margin-left: 240px;
          }
          
          .back-button-fixed {
            left: 10px;
            top: 110px;
          }
          
          .receipts-table-header, .receipt-row {
            grid-template-columns: 1.5fr 1fr 1fr;
            gap: 0.5rem;
          }
          
          .receipts-table-header div:nth-child(3),
          .receipt-row div:nth-child(3) {
            display: none;
          }
          
          .receipts-container {
            padding: 1rem;
            max-width: 100%;
          }
        }
        
        @media (max-width: 480px) {
          .receipts-table-header, .receipt-row {
            grid-template-columns: 1.5fr 1fr;
            gap: 0.5rem;
            padding: 1rem 0.5rem;
          }
          
          .receipts-table-header div:nth-child(2),
          .receipt-row div:nth-child(2) {
            display: none;
          }
          
          .receipt-cell {
            font-size: 0.9rem;
          }
          
          .view-button {
            padding: 0.4rem 0.8rem;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentReceiptsList; 