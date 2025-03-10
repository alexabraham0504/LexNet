import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faDownload, faPrint } from "@fortawesome/free-solid-svg-icons";
import Navbar from "../../components/navbar/navbar-client";
import Footer from "../../components/footer/footer-client";
import html2pdf from 'html2pdf.js';

const PaymentReceipt = () => {
  const { receiptId } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchReceiptDetails = async () => {
      try {
        setIsLoading(true);
        const token = sessionStorage.getItem("token");
        
        if (!token) {
          throw new Error("Authentication token missing");
        }
        
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        const response = await axios.get(
          `http://localhost:5000/api/payments/receipt/${receiptId}`,
          config
        );
        
        setReceipt(response.data.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching receipt details:", error);
        setError("Failed to load receipt details. Please try again later.");
        setIsLoading(false);
      }
    };
    
    fetchReceiptDetails();
  }, [receiptId]);
  
  const handleDownloadPDF = () => {
    const element = document.getElementById('receipt-container');
    const opt = {
      margin: 1,
      filename: `receipt-${receipt.receiptNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  if (isLoading) {
    return (
      <div className="receipt-page">
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading receipt details...</p>
        </div>
        <Footer />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="receipt-page">
        <Navbar />
        <div className="error-container">
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="back-button">
            Go Back
          </button>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="receipt-page">
      <Navbar />
      <div className="receipt-page-container">
        <Helmet>
          <title>Payment Receipt #{receipt?.receiptNumber} - Lex Net</title>
        </Helmet>
        
        <div className="receipt-actions no-print">
          <Link to="/client/payment-receipts" className="back-link">
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Receipts
          </Link>
          <div className="action-buttons">
            <button onClick={handleDownloadPDF} className="download-button">
              <FontAwesomeIcon icon={faDownload} /> Download PDF
            </button>
            <button onClick={handlePrint} className="print-button">
              <FontAwesomeIcon icon={faPrint} /> Print
            </button>
          </div>
        </div>
        
        <div id="receipt-container" className="receipt-container">
          <div className="receipt-header">
            <div className="company-info">
              <h1>Lex Net</h1>
              <p>Legal Services Platform</p>
              <p>support@lexnet.com</p>
            </div>
            <div className="receipt-info">
              <h2>RECEIPT</h2>
              <p><strong>Receipt #:</strong> {receipt?.receiptNumber}</p>
              <p><strong>Date:</strong> {new Date(receipt?.date).toLocaleDateString()}</p>
              <p><strong>Payment ID:</strong> {receipt?.razorpayPaymentId || 'N/A'}</p>
            </div>
          </div>
          
          <div className="receipt-parties">
            <div className="client-info">
              <h3>Client</h3>
              <p>{receipt?.clientDetails.name}</p>
              <p>{receipt?.clientDetails.email}</p>
              <p>{receipt?.clientDetails.phone || 'N/A'}</p>
            </div>
            <div className="lawyer-info">
              <h3>Lawyer</h3>
              <p>{receipt?.lawyerDetails.name}</p>
              <p>{receipt?.lawyerDetails.specialization}</p>
              <p>{receipt?.lawyerDetails.email}</p>
              <p>{receipt?.lawyerDetails.phone || 'N/A'}</p>
            </div>
          </div>
          
          <div className="receipt-details">
            <h3>Payment Details</h3>
            <table className="payment-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Fee Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{receipt?.paymentDetails.description}</td>
                  <td>{receipt?.paymentDetails.feeType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</td>
                  <td>₹{receipt?.paymentDetails.amount}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="2"><strong>Total</strong></td>
                  <td><strong>₹{receipt?.paymentDetails.amount}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div className="appointment-details">
            <h3>Appointment Details</h3>
            <p><strong>Date:</strong> {new Date(receipt?.appointmentDetails.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {receipt?.appointmentDetails.time}</p>
            {receipt?.appointmentDetails.notes && (
              <p><strong>Notes:</strong> {receipt?.appointmentDetails.notes}</p>
            )}
          </div>
          
          <div className="receipt-footer">
            <p>Thank you for using Lex Net for your legal needs.</p>
            <p>This is a computer-generated receipt and does not require a signature.</p>
          </div>
        </div>
      </div>
      <Footer />
      
      <style jsx="true">{`
        .receipt-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .receipt-page-container {
          flex: 1;
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .receipt-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        
        .back-link {
          color: #555;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s;
        }
        
        .back-link:hover {
          color: #000;
        }
        
        .action-buttons {
          display: flex;
          gap: 1rem;
        }
        
        .download-button, .print-button {
          background-color: #3498db;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .download-button:hover, .print-button:hover {
          background-color: #2980b9;
        }
        
        .receipt-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 2rem;
        }
        
        .receipt-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eee;
        }
        
        .company-info h1 {
          font-size: 1.8rem;
          margin-bottom: 0.5rem;
          color: #333;
        }
        
        .receipt-info h2 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: #333;
        }
        
        .receipt-parties {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }
        
        .client-info, .lawyer-info {
          padding: 1rem;
          background-color: #f9f9f9;
          border-radius: 4px;
        }
        
        .client-info h3, .lawyer-info h3 {
          margin-bottom: 0.5rem;
          color: #333;
          font-size: 1.2rem;
        }
        
        .receipt-details, .appointment-details {
          margin-bottom: 2rem;
        }
        
        .receipt-details h3, .appointment-details h3 {
          margin-bottom: 1rem;
          color: #333;
          font-size: 1.2rem;
        }
        
        .payment-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .payment-table th, .payment-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        .payment-table th {
          background-color: #f5f5f5;
          font-weight: 600;
        }
        
        .payment-table tfoot td {
          font-weight: bold;
        }
        
        .receipt-footer {
          margin-top: 3rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;
          text-align: center;
          color: #777;
          font-size: 0.9rem;
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
          margin: 2rem auto;
          max-width: 600px;
        }
        
        .back-button {
          background-color: #3498db;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 1rem;
        }
        
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            background-color: white;
          }
          
          .receipt-container {
            box-shadow: none;
            padding: 0;
          }
          
          .receipt-page-container {
            padding: 0;
          }
        }
        
        @media (max-width: 768px) {
          .receipt-parties {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .receipt-header {
            flex-direction: column;
            gap: 1rem;
          }
          
          .receipt-actions {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .action-buttons {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentReceipt; 