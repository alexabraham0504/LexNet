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
  faFileDownload,
  faCommentAlt
} from '@fortawesome/free-solid-svg-icons';

const LawyerCaseDetails = () => {
  const { caseId } = useParams();
  const [caseDetails, setCaseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignmentDetails, setAssignmentDetails] = useState(null);
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
        
        const token = sessionStorage.getItem('token');
        if (!token) {
          setError('Authentication token missing. Please log in again.');
          toast.error('Please log in again');
          navigate('/login');
          return;
        }
        
        // First, get the correct lawyer ID that matches the authenticated user
        const userIdResponse = await axios.get(
          `https://lexnet-backend.onrender.com/api/cases/get-lawyer-id`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (!userIdResponse.data.success) {
          setError('Could not retrieve your lawyer profile');
          toast.error('Error loading case: Profile not found');
          return;
        }
        
        const correctLawyerId = userIdResponse.data.lawyerId;
        console.log('Retrieved correct lawyer ID:', correctLawyerId);
        
        // Now use this ID to fetch the case details
        console.log(`Fetching case details for case ${caseId} with lawyer ID ${correctLawyerId}`);
        const response = await axios.get(
          `https://lexnet-backend.onrender.com/api/cases/lawyer/${correctLawyerId}/${caseId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data.success) {
          console.log("Case details received:", response.data.case);
          setCaseDetails(response.data.case);
          
          // If there's assignment information, save it too
          if (response.data.assignment) {
            setAssignmentDetails(response.data.assignment);
          }
        } else {
          setError(response.data.message || 'Failed to load case details');
        }
      } catch (error) {
        console.error('Error fetching case details:', error);
        const errorMessage = error.response?.data?.message || 'Failed to load case details';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (caseId) {
      fetchCaseDetails();
    }
  }, [caseId, navigate]);
  
  const handleEmergencyDownload = (e, doc) => {
    e.preventDefault();
    
    // Show loading toast
    const loadingToast = toast.loading('Downloading document...');
    
    // Use the emergency download route
    const emergencyUrl = `https://lexnet-backend.onrender.com/api/cases/emergency-download/${caseId}/${doc._id}`;
    console.log('Using emergency download URL:', emergencyUrl);
    
    axios({
      url: emergencyUrl,
      method: 'GET',
      responseType: 'blob',
    })
    .then((response) => {
      toast.dismiss(loadingToast);
      
      // Determine file type from Content-Type header or document metadata
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      
      // Get base filename from document or use default
      let baseFilename = doc.filename || doc.originalname || 'document';
      baseFilename = baseFilename.replace(/[^a-zA-Z0-9_.-]/g, '_');
      
      // Remove any existing extension
      baseFilename = baseFilename.replace(/\.[^/.]+$/, "");
      
      // Add appropriate extension based on content type
      let filename = baseFilename;
      if (contentType.includes('pdf')) {
        filename += '.pdf';
      } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
        filename += '.jpg';
      } else if (contentType.includes('png')) {
        filename += '.png';
      } else {
        // Try to get extension from original filename
        const originalExt = (doc.filename || '').split('.').pop();
        if (originalExt && originalExt.length < 5) {
          filename += '.' + originalExt;
        }
      }
      
      // Create blob with the correct content type
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Append to html page
      document.body.appendChild(link);
      
      // Start download
      link.click();
      
      // Clean up and remove the link
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success(`Document downloaded successfully as ${filename}`);
    })
    .catch((error) => {
      console.error('Emergency download error:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to download document. Please try again.');
    });
  };
  
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
              <div className="table-responsive mt-4">
                <h5>
                  <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                  Case Documents
                </h5>
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Filename</th>
                      <th>Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caseDetails.documents.map((doc, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{doc.filename || 'Unnamed Document'}</td>
                        <td>{doc.documentType || 'Unknown'}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={(e) => handleEmergencyDownload(e, doc)}
                          >
                            <FontAwesomeIcon icon={faFileDownload} className="me-1" />
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-info mt-4">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                No documents available for this case.
              </div>
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
            
            {/* Add this section to display client notes */}
            {caseDetails.clientNotes && (
              <div className="mt-4">
                <h5>
                  <FontAwesomeIcon icon={faCommentAlt} className="me-2" />
                  Client Notes
                </h5>
                <div className="card">
                  <div className="card-body">
                    <p className="mb-0">{caseDetails.clientNotes}</p>
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