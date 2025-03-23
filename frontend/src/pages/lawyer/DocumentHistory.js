import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api.config';
import { toast } from 'react-toastify';
import Navbar from '../../components/navbar/navbar-lawyer';
import Footer from '../../components/footer/footer-lawyer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileAlt, 
  faSearch, 
  faTrash, 
  faEye,
  faTimesCircle,
  faCheckCircle,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

const DocumentHistory = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocumentScans = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/document-scans/all');
        
        if (response.data.success) {
          setScans(response.data.scans);
        } else {
          throw new Error(response.data.message || 'Failed to fetch document scans');
        }
      } catch (error) {
        console.error('Error fetching document scans:', error);
        setError('Failed to load document history. Please try again later.');
        toast.error('Error loading document history');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocumentScans();
  }, []);
  
  const handleDelete = async (scanId) => {
    if (!window.confirm('Are you sure you want to delete this scan record?')) {
      return;
    }
    
    try {
      const response = await api.delete(`/api/document-scans/${scanId}`);
      
      if (response.data.success) {
        setScans(scans.filter(scan => scan._id !== scanId));
        toast.success('Document scan deleted successfully');
      } else {
        throw new Error(response.data.message || 'Failed to delete scan');
      }
    } catch (error) {
      console.error('Error deleting scan:', error);
      toast.error('Failed to delete document scan');
    }
  };
  
  const getRiskLevelBadge = (forgeryScore) => {
    if (forgeryScore <= 10) return 'success';
    if (forgeryScore <= 30) return 'warning';
    if (forgeryScore <= 60) return 'orange';
    return 'danger';
  };
  
  return (
    <>
      <Navbar />
      <div className="container mt-4 mb-5">
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white">
            <h4 className="mb-0">
              <FontAwesomeIcon icon={faFileAlt} className="me-2" />
              Document Scan History
            </h4>
          </div>
          
          <div className="card-body">
            <div className="mb-4">
              <p className="text-muted">
                View your past document scans and their results.
              </p>
              <Link to="/lawyer/scan-document" className="btn btn-primary">
                <FontAwesomeIcon icon={faSearch} className="me-2" />
                New Document Scan
              </Link>
            </div>
            
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading document history...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger">
                <FontAwesomeIcon icon={faTimesCircle} className="me-2" />
                {error}
              </div>
            ) : scans.length === 0 ? (
              <div className="text-center py-5">
                <FontAwesomeIcon icon={faFileAlt} size="3x" className="text-muted mb-3" />
                <h5>No document scans found</h5>
                <p className="text-muted">Upload and analyze documents to see them here.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Date</th>
                      <th>Result</th>
                      <th>Language</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scans.map(scan => (
                      <tr key={scan._id}>
                        <td>
                          <FontAwesomeIcon icon={faFileAlt} className="me-2 text-muted" />
                          {scan.fileName}
                          <div className="small text-muted">
                            {(scan.fileSize / 1024).toFixed(2)} KB
                          </div>
                        </td>
                        <td>
                          {new Date(scan.createdAt).toLocaleDateString()}
                          <div className="small text-muted">
                            {new Date(scan.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td>
                          <span className={`badge bg-${getRiskLevelBadge(scan.scanResult.forgeryScore)}`}>
                            {scan.scanResult.forgeryScore <= 10 && (
                              <><FontAwesomeIcon icon={faCheckCircle} className="me-1" /> Authentic</>
                            )}
                            {scan.scanResult.forgeryScore > 10 && scan.scanResult.forgeryScore <= 30 && (
                              <><FontAwesomeIcon icon={faExclamationTriangle} className="me-1" /> Suspicious</>
                            )}
                            {scan.scanResult.forgeryScore > 30 && scan.scanResult.forgeryScore <= 60 && (
                              <><FontAwesomeIcon icon={faExclamationTriangle} className="me-1" /> High Risk</>
                            )}
                            {scan.scanResult.forgeryScore > 60 && (
                              <><FontAwesomeIcon icon={faTimesCircle} className="me-1" /> Forged</>
                            )}
                          </span>
                          <div className="small mt-1">
                            Score: {scan.scanResult.forgeryScore.toFixed(2)}%
                          </div>
                        </td>
                        <td>{scan.scanResult.language || 'Unknown'}</td>
                        <td>
                          <div className="btn-group">
                            <Link 
                              to={`/lawyer/scan-detail/${scan._id}`} 
                              className="btn btn-sm btn-outline-primary"
                            >
                              <FontAwesomeIcon icon={faEye} className="me-1" />
                              View
                            </Link>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(scan._id)}
                            >
                              <FontAwesomeIcon icon={faTrash} className="me-1" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default DocumentHistory; 