import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api.config'; // Import the api client
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
  faEnvelope,
  faCalendarCheck,
  faSearch
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
        
        // First try to get case from assignments
        try {
          const assignmentResponse = await api.get(`/api/cases/assignments/case/${caseId}`);
          
          if (assignmentResponse.data.success) {
            const assignmentData = assignmentResponse.data.assignment;
            console.log('Assignment data:', assignmentData);
            
            setCaseDetails({
              ...assignmentData.caseId,
              clientId: {
                name: assignmentData.clientName,
                email: assignmentData.clientEmail
              },
              assignmentStatus: assignmentData.status,
              assignmentDate: assignmentData.assignmentDate,
              clientNotes: assignmentData.clientNotes,
              assignmentId: assignmentData._id,
              lawyerId: assignmentData.lawyerId
            });
            return;
          }
        } catch (assignmentError) {
          console.log('Assignment not found, trying case details endpoint');
        }

        // Fallback to direct case details
        const caseResponse = await api.get(`/api/cases/details/${caseId}`);
        if (caseResponse.data.success) {
          setCaseDetails(caseResponse.data.case);
        }
      } catch (error) {
        console.error('Error fetching case details:', error);
        setError(error.response?.data?.message || 'Failed to load case details');
        toast.error('Error loading case details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCaseDetails();
  }, [caseId]);
  
  // Update the Documents Section with proper download handling
  const handleDocumentDownload = async (doc) => {
    try {
      console.log('Attempting to download document:', doc);
      
      // First try the document ID route
      try {
        const response = await api.get(`/api/cases/document/${doc._id}`, {
          responseType: 'blob'
        });
        
        // If successful, process the download
        const blob = new Blob([response.data], { 
          type: response.headers['content-type'] || doc.fileType || 'application/octet-stream' 
        });
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', doc.fileName || 'document');
        document.body.appendChild(link);
        link.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        
        toast.success('Document download started');
        return; // Exit if successful
      } catch (idError) {
        console.log('ID-based download failed, trying filename-based download');
      }
      
      // If ID-based download fails, try the filename route
      const response = await api.get(`/api/cases/file/${doc.fileName}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || doc.fileType || 'application/octet-stream' 
      });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.fileName || 'document');
      document.body.appendChild(link);
      link.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success('Document download started');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document. Please try again.');
    }
  };
  
  const handleScanDocument = (doc) => {
    try {
      // Navigate to the scan page with document information
      navigate('/lawyer/scan-document', { 
        state: { 
          documentId: doc._id,
          documentName: doc.fileName,
          caseId: caseId,
          caseTitle: caseDetails.title
        } 
      });
    } catch (error) {
      console.error('Error navigating to scan page:', error);
      toast.error('Failed to open document scanner. Please try again.');
    }
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
                        <strong>{caseDetails.clientId?.name || "N/A"}</strong>
                        {caseDetails.clientId?.email && (
                          <div className="text-muted small">
                            <FontAwesomeIcon icon={faEnvelope} className="me-1" />
                            {caseDetails.clientId.email}
                          </div>
                        )}
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
                    {caseDetails.assignmentStatus && (
                      <tr>
                        <th>Assignment Status</th>
                        <td>
                          <span className={`badge bg-${getStatusBadge(caseDetails.assignmentStatus)}`}>
                            {caseDetails.assignmentStatus.charAt(0).toUpperCase() + 
                             caseDetails.assignmentStatus.slice(1)}
                          </span>
                        </td>
                      </tr>
                    )}
                    {caseDetails.assignmentDate && (
                      <tr>
                        <th>Assigned Date</th>
                        <td>
                          <FontAwesomeIcon icon={faCalendarCheck} className="me-2" />
                          {new Date(caseDetails.assignmentDate).toLocaleDateString()}
                          <div className="text-muted small">
                            {new Date(caseDetails.assignmentDate).toLocaleTimeString()}
                          </div>
                        </td>
                      </tr>
                    )}
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
                      <tr key={doc._id || index}>
                        <td>{doc.fileName}</td>
                        <td>{doc.fileType}</td>
                        <td>{new Date(doc.uploadDate || doc.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="btn-group">
                            <button 
                              onClick={() => handleDocumentDownload(doc)}
                              className="btn btn-sm btn-primary"
                            >
                              <FontAwesomeIcon icon={faFileDownload} className="me-1" />
                              Download
                            </button>
                            <button 
                              onClick={() => handleScanDocument(doc)}
                              className="btn btn-sm btn-info ms-1"
                            >
                              <FontAwesomeIcon icon={faSearch} className="me-1" />
                              Scan Now
                            </button>
                          </div>
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