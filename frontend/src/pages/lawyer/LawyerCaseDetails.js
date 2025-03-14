import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Navbar from '../../components/navbar/navbar-lawyer';
import Footer from '../../components/footer/footer-lawyer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileAlt, 
  faUser, 
  faClock, 
  faGavel, 
  faInfoCircle,
  faFileDownload
} from '@fortawesome/free-solid-svg-icons';

const LawyerCaseDetails = () => {
  const { caseId } = useParams();
  const [caseDetails, setCaseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Define helper functions within component scope
  const getCaseTypeBadge = (caseType) => {
    switch(caseType) {
      case 'criminal': return 'danger';
      case 'civil': return 'primary';
      case 'family': return 'success';
      case 'corporate': return 'info';
      default: return 'secondary';
    }
  };
  
  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return 'warning';
      case 'active': return 'success';
      case 'closed': return 'secondary';
      default: return 'info';
    }
  };

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get(`http://localhost:5000/api/cases/${caseId}`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          setCaseDetails(response.data.case);
        }
      } catch (error) {
        console.error('Error fetching case details:', error);
        setError('Failed to load case details');
        toast.error('Error loading case details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCaseDetails();
  }, [caseId]);
  
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mt-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
        <Footer />
      </>
    );
  }
  
  if (error || !caseDetails) {
    return (
      <>
        <Navbar />
        <div className="container mt-5">
          <div className="alert alert-danger">
            <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
            {error || 'Case not found'}
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/lawyerdashboard')}
          >
            Back to Dashboard
          </button>
        </div>
        <Footer />
      </>
    );
  }
  
  return (
    <>
      <Navbar />
      <div className="container mt-4 mb-5">
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white">
            <h4 className="mb-0">
              <FontAwesomeIcon icon={faFileAlt} className="me-2" />
              {caseDetails.title}
            </h4>
          </div>
          
          <div className="card-body">
            <div className="row mb-4">
              <div className="col-md-6">
                <h5>Case Information</h5>
                <table className="table table-striped">
                  <tbody>
                    <tr>
                      <th>Case Type</th>
                      <td>
                        <span className={`badge bg-${getCaseTypeBadge(caseDetails.caseType)}`}>
                          {caseDetails.caseType.charAt(0).toUpperCase() + caseDetails.caseType.slice(1)}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <th>Client</th>
                      <td>
                        <FontAwesomeIcon icon={faUser} className="me-2" />
                        {caseDetails.clientId?.name || caseDetails.clientId?.email || "Client"}
                      </td>
                    </tr>
                    <tr>
                      <th>Created</th>
                      <td>
                        <FontAwesomeIcon icon={faClock} className="me-2" />
                        {new Date(caseDetails.createdAt).toLocaleString()}
                      </td>
                    </tr>
                    {caseDetails.ipcSection && (
                      <tr>
                        <th>IPC Section</th>
                        <td>
                          <FontAwesomeIcon icon={faGavel} className="me-2" />
                          Section {caseDetails.ipcSection}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <th>Status</th>
                      <td>
                        <span className={`badge bg-${getStatusBadge(caseDetails.status)}`}>
                          {caseDetails.status || "New"}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="col-md-6">
                <h5>Case Description</h5>
                <div className="p-3 bg-light rounded">
                  {caseDetails.description}
                </div>
                
                {caseDetails.clientNotes && (
                  <div className="mt-3">
                    <h5>Client Notes</h5>
                    <div className="p-3 bg-light rounded">
                      {caseDetails.clientNotes}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Documents Section */}
            <h5 className="mt-4">Case Documents</h5>
            {caseDetails.documents && caseDetails.documents.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Document Name</th>
                      <th>Type</th>
                      <th>Uploaded</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caseDetails.documents.map((doc, index) => (
                      <tr key={index}>
                        <td>{doc.fileName}</td>
                        <td>{doc.fileType}</td>
                        <td>{doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : 'N/A'}</td>
                        <td>
                          <a 
                            href={`http://localhost:5000/${doc.filePath}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-primary"
                          >
                            <FontAwesomeIcon icon={faFileDownload} className="me-1" />
                            Download
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-info">No documents available</div>
            )}
            
            {/* Analysis Results Section */}
            {caseDetails.analysisResults && (
              <div className="mt-4">
                <h5>Case Analysis</h5>
                <div className="card">
                  <div className="card-body">
                    <pre className="analysis-json">
                      {JSON.stringify(caseDetails.analysisResults, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="card-footer bg-light">
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/lawyerdashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
      <Footer />
      
      <style jsx="true">{`
        .analysis-json {
          background-color: #f8f9fa;
          padding: 1rem;
          border-radius: 4px;
          max-height: 300px;
          overflow-y: auto;
          white-space: pre-wrap;
          font-size: 0.9rem;
        }
      `}</style>
    </>
  );
};

export default LawyerCaseDetails; 