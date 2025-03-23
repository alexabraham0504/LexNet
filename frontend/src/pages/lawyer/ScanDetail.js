import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileAlt, 
  faArrowLeft, 
  faTimesCircle,
  faCheckCircle,
  faExclamationTriangle,
  faPercentage,
  faExclamationCircle,
  faSearch,
  faLanguage,
  faTrash,
  faDownload,
  faCopy
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import Navbar from '../../components/navbar/navbar-lawyer';
import Footer from '../../components/footer/footer-lawyer';
import axios from 'axios';

const ScanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchScanDetails = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem('token');
        
        const response = await axios.get(`http://localhost:5000/api/document-scans/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          setScanData(response.data.scan);
        } else {
          throw new Error(response.data.message || 'Failed to fetch scan details');
        }
      } catch (error) {
        console.error('Error fetching scan details:', error);
        setError('Failed to load scan details. Please try again later.');
        toast.error('Error loading scan details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchScanDetails();
  }, [id]);
  
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this scan record?')) {
      return;
    }
    
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.delete(`http://localhost:5000/api/document-scans/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        toast.success('Document scan deleted successfully');
        navigate('/lawyer/document-history');
      } else {
        throw new Error(response.data.message || 'Failed to delete scan');
      }
    } catch (error) {
      console.error('Error deleting scan:', error);
      toast.error('Failed to delete document scan');
    }
  };
  
  const handleCopyToClipboard = () => {
    if (!scanData) return;
    
    // Create a formatted text representation of the scan results
    let textToCopy = `Document Scan Results\n`;
    textToCopy += `Filename: ${scanData.fileName}\n`;
    textToCopy += `Date: ${new Date(scanData.createdAt).toLocaleString()}\n`;
    textToCopy += `Forgery Probability: ${scanData.scanResult.forgeryScore.toFixed(2)}%\n`;
    textToCopy += `Language: ${scanData.scanResult.language || 'Unknown'}\n\n`;
    
    textToCopy += `Detailed Analysis:\n`;
    scanData.scanResult.details.forEach(detail => {
      textToCopy += `- ${detail.description}\n`;
      if (detail.subDetails) {
        detail.subDetails.forEach(subDetail => {
          textToCopy += `  • ${subDetail}\n`;
        });
      }
    });
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => toast.success('Scan results copied to clipboard'))
      .catch(() => toast.error('Failed to copy to clipboard'));
  };
  
  const getScoreColor = (score) => {
    if (score <= 10) return 'success';
    if (score <= 30) return 'warning';
    if (score <= 60) return 'orange';
    return 'danger';
  };
  
  const getScoreMessage = (score) => {
    if (score <= 10) return 'LIKELY AUTHENTIC DOCUMENT';
    if (score <= 30) return 'SUSPICIOUS DOCUMENT';
    if (score <= 60) return 'HIGH RISK OF FORGERY';
    return 'CRITICAL: LIKELY FORGED DOCUMENT';
  };
  
  const renderScanResult = () => {
    if (!scanData) return null;
    
    const { scanResult } = scanData;
    const forgeryScore = scanResult.forgeryScore;
    const scorePercentage = forgeryScore.toFixed(2);
    const scoreColor = getScoreColor(forgeryScore);
    
    return (
      <div className="scan-result-container">
        <div className={`scan-result-header bg-${scoreColor}`}>
          <FontAwesomeIcon 
            icon={scanResult.isForged ? faTimesCircle : faCheckCircle} 
            size="3x" 
            className="mb-3"
          />
          <h3>
            {getScoreMessage(forgeryScore)}
            <div className="small mt-2">
              {scorePercentage}% forgery probability detected
            </div>
          </h3>
          <div className="similarity-score">
            <FontAwesomeIcon icon={faPercentage} className="me-2" />
            Forgery Probability: 
            <strong className={`text-${scoreColor === 'orange' ? 'warning' : scoreColor}`}>
              {' '}{scorePercentage}%
            </strong>
          </div>
          <div className="forgery-meter-container mt-3">
            <div className="forgery-meter">
              <div 
                className="forgery-meter-pointer" 
                style={{ marginLeft: `${forgeryScore}%` }}
              />
            </div>
            <div className="d-flex justify-content-between small text-white-50">
              <span>Safe (0-10%)</span>
              <span>Suspicious (11-30%)</span>
              <span>High Risk (31-60%)</span>
              <span>Critical (61-100%)</span>
            </div>
          </div>
        </div>

        <div className={`alert alert-${scoreColor} mt-3`}>
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          <strong>Analysis Result:</strong>{' '}
          {forgeryScore <= 10 && 'This document appears to be authentic.'}
          {forgeryScore > 10 && forgeryScore <= 30 && 'This document shows some suspicious patterns that require attention.'}
          {forgeryScore > 30 && forgeryScore <= 60 && 'This document shows significant signs of potential forgery.'}
          {forgeryScore > 60 && 'This document shows critical indicators of forgery.'}
        </div>

        <div className="language-info alert alert-info mt-3">
          <FontAwesomeIcon icon={faLanguage} className="me-2" />
          <strong>Document Language:</strong> {scanResult.language || 'Unknown'}
        </div>

        <div className="scan-details mt-4">
          <h5>Forensic Analysis Details</h5>
          <div className="card">
            <div className="card-body">
              <ul className="comparison-list">
                {scanResult.details.map((detail, index) => (
                  <li key={index}>
                    <div className={detail.match ? 'text-danger' : ''}>
                      {detail.match && <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />}
                      <strong>{detail.description}</strong>
                      {detail.subDetails && (
                        <ul className="sub-details mt-2">
                          {detail.subDetails.map((subDetail, subIndex) => (
                            <li key={subIndex} className="text-muted">
                              {subDetail}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="document-content mt-4">
          <h5>Document Content</h5>
          <div className="card">
            <div className="card-body">
              <pre className="document-text">
                {scanData.originalFileContent}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4 mb-5">
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                Document Scan Details
              </h4>
              <Link 
                to="/lawyer/document-history"
                className="btn btn-light btn-sm"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="me-1" />
                Back to History
              </Link>
            </div>
          </div>
          
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading scan details...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger">
                <FontAwesomeIcon icon={faExclamationCircle} className="me-2" />
                {error}
              </div>
            ) : scanData ? (
              <>
                <div className="document-info mb-4">
                  <h5>{scanData.fileName}</h5>
                  <div className="text-muted mb-3">
                    Scanned on {new Date(scanData.createdAt).toLocaleString()}
                  </div>
                  
                  <div className="document-actions mb-4">
                    <button 
                      className="btn btn-outline-primary me-2"
                      onClick={handleCopyToClipboard}
                    >
                      <FontAwesomeIcon icon={faCopy} className="me-1" />
                      Copy Results
                    </button>
                    <button 
                      className="btn btn-outline-danger"
                      onClick={handleDelete}
                    >
                      <FontAwesomeIcon icon={faTrash} className="me-1" />
                      Delete Scan
                    </button>
                  </div>
                </div>
                
                {renderScanResult()}
              </>
            ) : (
              <div className="alert alert-warning">
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                Scan data not found
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />

      <style jsx>{`
        .scan-result-header {
          padding: 2rem;
          text-align: center;
          color: white;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
        }
        
        .forgery-meter-container {
          width: 100%;
          padding: 0 10px;
        }
        
        .forgery-meter {
          height: 10px;
          background: linear-gradient(90deg, #28a745 0%, #28a745 10%, #ffc107 10%, #ffc107 30%, #fd7e14 30%, #fd7e14 60%, #dc3545 60%, #dc3545 100%);
          border-radius: 5px;
          position: relative;
          margin-bottom: 5px;
        }
        
        .forgery-meter-pointer {
          position: absolute;
          top: -6px;
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 12px solid #212529;
          transform: translateX(-8px);
        }
        
        .comparison-list {
          list-style-type: none;
          padding-left: 0;
        }
        
        .comparison-list > li {
          margin-bottom: 1.5rem;
        }
        
        .sub-details {
          list-style-type: disc;
          padding-left: 2rem;
        }
        
        .document-text {
          max-height: 300px;
          overflow-y: auto;
          background-color: #f8f9fa;
          border-radius: 0.25rem;
          padding: 1rem;
          font-size: 0.9rem;
          white-space: pre-wrap;
          word-break: break-word;
        }
      `}</style>
    </>
  );
};

export default ScanDetail; 