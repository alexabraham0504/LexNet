import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Navbar from '../../components/navbar/navbar-client';
import Footer from '../../components/footer/footer-client';
import ClientSidebar from '../../components/sidebar/ClientSidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, 
  faSpinner, 
  faExclamationCircle, 
  faSearch,
  faUserTie,
  faGavel,
  faFileAlt,
  faInfoCircle,
  faFilePdf,
  faImage,
  faFile,
  faUserCircle,
  faStar,
  faBriefcase,
  faMoneyBill,
  faCheck,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api.config';
import './SendCaseDetails.css';

const SendCaseDetails = () => {
  const [cases, setCases] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedLawyerId, setSelectedLawyerId] = useState('');
  const [caseNotes, setCaseNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCase, setSendingCase] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Add state for confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  // Add state for success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchUserCases();
    fetchLawyers();
  }, [user, navigate]);

  const fetchUserCases = async () => {
    try {
      setLoading(true);
      console.log('Fetching user cases...');
      
      const token = sessionStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        toast.error('Authentication token missing. Please log in again.');
        navigate('/login');
        return;
      }
      
      // Try multiple endpoints to find the one that works
      let casesData = [];
      let success = false;
      
      // First attempt - /api/cases/client/:userId
      try {
        console.log('Trying endpoint 1: /api/cases/client/:userId');
        const userId = sessionStorage.getItem('userid') || user?._id;
        if (userId) {
          const response = await api.get(`/api/cases/client/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          console.log('Endpoint 1 response:', response.data);
          
          if (response.data.success && response.data.cases) {
            casesData = response.data.cases.filter(c => !c.isDeleted);
            success = true;
            console.log('Endpoint 1 successful, found cases:', casesData.length);
          }
        }
      } catch (error) {
        console.log('Endpoint 1 failed:', error.message);
      }
      
      // Second attempt - /api/cases/list
      if (!success) {
        try {
          console.log('Trying endpoint 2: /api/cases/list');
          const response = await api.get('/api/cases/list', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          console.log('Endpoint 2 response:', response.data);
          
          if (response.data.cases) {
            casesData = response.data.cases.filter(c => !c.isDeleted);
            success = true;
            console.log('Endpoint 2 successful, found cases:', casesData.length);
          }
        } catch (error) {
          console.log('Endpoint 2 failed:', error.message);
        }
      }
      
      // Third attempt - direct /api/cases
      if (!success) {
        try {
          console.log('Trying endpoint 3: /api/cases');
          const response = await api.get('/api/cases', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          console.log('Endpoint 3 response:', response.data);
          
          if (Array.isArray(response.data)) {
            casesData = response.data.filter(c => !c.isDeleted);
            success = true;
            console.log('Endpoint 3 successful, found cases:', casesData.length);
          } else if (response.data.cases) {
            casesData = response.data.cases.filter(c => !c.isDeleted);
            success = true;
            console.log('Endpoint 3 successful, found cases:', casesData.length);
          }
        } catch (error) {
          console.log('Endpoint 3 failed:', error.message);
        }
      }
      
      if (success) {
        console.log('Setting cases data:', casesData);
        setCases(casesData);
        
        if (casesData.length === 0) {
          toast.info('You don\'t have any active cases. Please create a case first.');
        }
      } else {
        console.error('All endpoints failed');
        toast.error('Failed to load your cases. Please try again later.');
        setCases([]);
      }
    } catch (error) {
      console.error('Error in fetchUserCases:', error);
      toast.error('Error loading cases');
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLawyers = async () => {
    try {
      const response = await api.get('/api/lawyers/verified');
      setLawyers(response.data);
    } catch (error) {
      console.error('Error fetching lawyers:', error);
      toast.error('Error loading lawyers');
    }
  };

  const filterLawyersBySpecialization = (specialization) => {
    if (!specialization) return;
    
    try {
      setLoading(true);
      
      // Filter the existing lawyers array based on specialization
      const filteredLawyers = lawyers.filter(lawyer => 
        lawyer.specialization === specialization
      );
      
      if (filteredLawyers.length > 0) {
        setLawyers(filteredLawyers);
        toast.success(`Found ${filteredLawyers.length} lawyers specializing in ${specialization}`);
      } else {
        toast.info(`No lawyers found specializing in ${specialization}. Showing all lawyers.`);
      }
    } catch (error) {
      console.error('Error filtering lawyers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update the handleCaseSelect function
  const handleCaseSelect = async (e) => {
    const caseId = e.target.value;
    console.log('Selected case ID:', caseId);
    setSelectedCaseId(caseId);
    
    if (!caseId) {
      console.log('No case selected, resetting lawyers');
      fetchLawyers();
      return;
    }
    
    try {
      setLoading(true);
      
      // Find the selected case
      const selectedCase = cases.find(c => c._id === caseId);
      console.log('Selected case object:', selectedCase);
      
      if (!selectedCase) {
        console.error('Selected case not found in cases array');
        console.log('Available cases:', cases);
        toast.error('Error: Selected case not found');
        return;
      }
      
      // Fetch all lawyers first to reset
      await fetchLawyers();
      
      // Get case details to determine specialization
      let specialization = null;
      
      // Check for IPC sections in the case
      if (selectedCase.ipcSection) {
        console.log('Case has IPC section:', selectedCase.ipcSection);
        
        // Use the IPC to specialization mapping
        const IPC_SPECIALIZATION_MAP = {
          '268': 'Environmental Law',
          '269': 'Environmental Law',
          '277': 'Environmental Law',
          '278': 'Environmental Law',
          '302': 'Criminal Law',
          '307': 'Criminal Law',
          '378': 'Criminal Law',
          '379': 'Criminal Law',
          '380': 'Criminal Law',
          '420': 'Criminal Law',
          '425': 'Property Law',
          '426': 'Property Law',
          '427': 'Property Law',
          '441': 'Real Estate Law',
          '447': 'Real Estate Law',
          '406': 'Civil Law',
          '494': 'Family Law',
          '498A': 'Family Law'
        };
        
        specialization = IPC_SPECIALIZATION_MAP[selectedCase.ipcSection];
        console.log('Specialization from IPC:', specialization);
      }
      
      // If we have a specialization, filter lawyers
      if (specialization) {
        console.log('Filtering lawyers by specialization:', specialization);
        
        // Filter lawyers by specialization
        const specializedLawyers = lawyers.filter(lawyer => 
          lawyer.specialization === specialization
        );
        
        console.log('Found specialized lawyers:', specializedLawyers.length);
        
        if (specializedLawyers.length > 0) {
          setLawyers(specializedLawyers);
          toast.success(`Found ${specializedLawyers.length} lawyers specializing in ${specialization}`);
        } else {
          toast.info(`No lawyers found specializing in ${specialization}. Showing all lawyers.`);
        }
      }
      
      // Force a re-render by updating a state variable
      setError(null);
    } catch (error) {
      console.error('Error processing case selection:', error);
      toast.error('Error loading case details');
    } finally {
      setLoading(false);
    }
  };

  // Update the form submission handler
  const handleSendCase = async (e) => {
    e.preventDefault();
    
    // Validate inputs before showing confirmation modal
    if (!selectedCaseId) {
      toast.error('Please select a case');
      return;
    }
    
    if (!selectedLawyerId) {
      toast.error('Please select a lawyer');
      return;
    }

    // Show confirmation modal only after clicking the send button
    setShowConfirmModal(true);
  };

  const handleConfirmSend = async () => {
    try {
      setSendingCase(true);
      
      // Get the selected case details
      const selectedCase = cases.find(c => c._id === selectedCaseId);
      if (!selectedCase) {
        throw new Error('Selected case not found');
      }
      
      // Create assignment payload
      const assignmentData = {
        caseId: selectedCaseId,
        lawyerId: selectedLawyerId,
        clientId: user._id,
        clientNotes: caseNotes,
        caseDetails: {
          title: selectedCase.title,
          description: selectedCase.description,
          ipcSection: selectedCase.ipcSection,
          caseType: selectedCase.caseType || 'general',
          status: selectedCase.status || 'pending'
        }
      };
      
      const response = await api.post('/api/cases/send-to-lawyer', assignmentData);
      
      if (response.data.success) {
        // Close confirmation modal and show success modal
        setShowConfirmModal(false);
        setShowSuccessModal(true);
        
        // Clear form
        setSelectedCaseId('');
        setSelectedLawyerId('');
        setCaseNotes('');
      }
    } catch (error) {
      console.error('Error sending case:', error);
      toast.error(error.response?.data?.message || 'Failed to send case details');
    } finally {
      setSendingCase(false);
    }
  };

  // Function to handle closing success modal
  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    // Refresh the cases list
    fetchUserCases();
  };

  // Add this function to get specialization for IPC section
  const getSpecializationForIPC = (section) => {
    const IPC_SPECIALIZATION_MAP = {
      '268': 'Environmental Law',
      '269': 'Environmental Law',
      '277': 'Environmental Law',
      '278': 'Environmental Law',
      '302': 'Criminal Law',
      '307': 'Criminal Law',
      '378': 'Criminal Law',
      '379': 'Criminal Law',
      '380': 'Criminal Law',
      '420': 'Criminal Law',
      '425': 'Property Law',
      '426': 'Property Law',
      '427': 'Property Law',
      '441': 'Real Estate Law',
      '447': 'Real Estate Law',
      '406': 'Civil Law',
      '494': 'Family Law',
      '498A': 'Family Law'
    };
    
    return IPC_SPECIALIZATION_MAP[section] || null;
  };

  // Simplify the renderCaseDetails function
  const renderCaseDetails = () => {
    console.log('Rendering case details, selectedCaseId:', selectedCaseId);
    console.log('Available cases:', cases);
    
    if (!selectedCaseId) {
      console.log('No case selected');
      return null;
    }
    
    const selectedCase = cases.find(c => c._id === selectedCaseId);
    console.log('Found selected case:', selectedCase);
    
    if (!selectedCase) {
      console.log('Selected case not found in cases array');
      return (
        <div className="alert alert-warning mt-3">
          <FontAwesomeIcon icon={faExclamationCircle} className="me-2" />
          Case details not found. Please select another case.
        </div>
      );
    }
    
    return (
      <div className="selected-case-details mt-4 mb-4">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h3>Case Details</h3>
          </div>
          <div className="card-body">
            <h4>{selectedCase.title}</h4>
            <p className="text-muted">
              <small>Created: {new Date(selectedCase.createdAt).toLocaleDateString()}</small>
            </p>
            
            <div className="case-description mb-3">
              <h5>Description</h5>
              <p>{selectedCase.description}</p>
            </div>
            
            {selectedCase.ipcSection && (
              <div className="ipc-section mb-3">
                <h5>IPC Section</h5>
                <div className="badge bg-info p-2 mb-2">Section {selectedCase.ipcSection}</div>
                {selectedCase.ipcDescription && (
                  <p>{selectedCase.ipcDescription}</p>
                )}
              </div>
            )}
            
            {selectedCase.documents && selectedCase.documents.length > 0 && (
              <div className="documents mb-3">
                <h5>Documents</h5>
                <ul className="list-group">
                  {selectedCase.documents.map((doc, index) => (
                    <li key={index} className="list-group-item">
                      {doc.fileName}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Update the renderSpecializedLawyers function to remove consultation fees
  const renderSpecializedLawyers = () => {
    if (!selectedCaseId) return null;
    
    const selectedCase = cases.find(c => c._id === selectedCaseId);
    if (!selectedCase) return null;
    
    // Determine specialization
    let specialization = null;
    
    // Check for IPC section
    if (selectedCase.ipcSection) {
      specialization = getSpecializationForIPC(selectedCase.ipcSection);
    }
    
    // If no specialization from IPC, check crime type
    if (!specialization && selectedCase.analysisResults?.crimeIdentified) {
      const crimeType = selectedCase.analysisResults.crimeIdentified;
      specialization = 
        crimeType.toLowerCase().includes('theft') ? 'Criminal Law' :
        crimeType.toLowerCase().includes('murder') ? 'Criminal Law' :
        crimeType.toLowerCase().includes('environment') ? 'Environmental Law' :
        crimeType.toLowerCase().includes('property') ? 'Property Law' :
        crimeType.toLowerCase().includes('family') ? 'Family Law' : null;
    }
    
    if (!specialization) return null;
    
    const specializedLawyers = lawyers.filter(lawyer => lawyer.specialization === specialization);
    
    if (specializedLawyers.length === 0) {
      return (
        <div className="specialized-lawyers mt-4 mb-4">
          <div className="alert alert-warning">
            <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
            No lawyers found specializing in {specialization}. Please select from the list below.
          </div>
        </div>
      );
    }
    
    return (
      <div className="specialized-lawyers mt-4 mb-4">
        <div className="section-header">
          <h3>
            <FontAwesomeIcon icon={faUserTie} className="me-2" />
            Based on your case analysis, we recommend lawyers specializing in {specialization}
          </h3>
        </div>
        
        <div className="lawyer-cards-container specialized">
          {specializedLawyers.map(lawyer => {
            // Determine the correct profile picture URL
            let profilePicUrl = '/default-lawyer-avatar.png';
            if (lawyer.profilePicture) {
              if (lawyer.profilePicture.startsWith('http')) {
                profilePicUrl = lawyer.profilePicture;
              } else {
                profilePicUrl = `http://localhost:5000/uploads/${lawyer.profilePicture}`;
              }
            }
            
            // Get fee information from various possible properties
            const caseHandlingFee = lawyer.caseHandlingFee || lawyer.caseHandlingFees || '5000';
            
            return (
              <div 
                key={lawyer._id} 
                className={`lawyer-card compact ${selectedLawyerId === lawyer._id ? 'selected' : ''}`}
                onClick={() => setSelectedLawyerId(lawyer._id)}
              >
                <div className="lawyer-card-header">
                  <div className="lawyer-avatar">
                    <img 
                      src={profilePicUrl}
                      alt={lawyer.fullName || lawyer.fullname} 
                      className="lawyer-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default-lawyer-avatar.png';
                      }}
                    />
                  </div>
                  <h4 className="lawyer-name">{lawyer.fullName || lawyer.fullname}</h4>
                </div>
                
                <div className="lawyer-card-body">
                  <div className="lawyer-detail">
                    <FontAwesomeIcon icon={faGavel} className="lawyer-detail-icon" />
                    <span>{lawyer.specialization}</span>
                  </div>
                  
                  <div className="lawyer-detail">
                    <FontAwesomeIcon icon={faBriefcase} className="lawyer-detail-icon" />
                    <span>Experience: {lawyer.experience || lawyer.yearsOfExperience || '3'} years</span>
                  </div>
                  
                  <div className="lawyer-fees">
                    <div className="fee-item">
                      <span className="fee-label">Case Fee:</span>
                      <span className="fee-amount">{caseHandlingFee}</span>
                    </div>
                  </div>
                  
                  {lawyer.rating && (
                    <div className="lawyer-detail">
                      <FontAwesomeIcon icon={faStar} className="lawyer-detail-icon text-warning" />
                      <span>Rating: {lawyer.rating}/5</span>
                    </div>
                  )}
                </div>
                
                <div className="lawyer-card-footer">
                  {selectedLawyerId === lawyer._id ? (
                    <button className="btn btn-success">
                      <FontAwesomeIcon icon={faCheck} className="me-2" /> Selected
                    </button>
                  ) : (
                    <button className="btn btn-primary">
                      Select
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Update the renderLawyerCards function to remove consultation fees
  const renderLawyerCards = () => {
    if (lawyers.length === 0) {
      return (
        <div className="alert alert-info">
          <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
          No lawyers available at the moment.
        </div>
      );
    }

    const filteredLawyers = searchTerm 
      ? lawyers.filter(lawyer => 
          (lawyer.fullName || lawyer.fullname || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (lawyer.specialization || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      : lawyers;

    return (
      <div className="lawyer-cards-container">
        {filteredLawyers.map(lawyer => {
          let profilePicUrl = '/default-lawyer-avatar.png';
          if (lawyer.profilePicture) {
            if (lawyer.profilePicture.startsWith('http')) {
              profilePicUrl = lawyer.profilePicture;
            } else {
              profilePicUrl = `http://localhost:5000/uploads/${lawyer.profilePicture}`;
            }
          }
          
          const caseHandlingFee = lawyer.caseHandlingFee || lawyer.caseHandlingFees || '5000';
          
          return (
            <div 
              key={lawyer._id} 
              className={`lawyer-card ${selectedLawyerId === lawyer._id ? 'selected' : ''}`}
              onClick={() => setSelectedLawyerId(lawyer._id)}
            >
              <div className="lawyer-card-header">
                <div className="lawyer-avatar">
                  <img 
                    src={profilePicUrl}
                    alt={lawyer.fullName || lawyer.fullname} 
                    className="lawyer-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/default-lawyer-avatar.png';
                    }}
                  />
                </div>
                <h4 className="lawyer-name">{lawyer.fullName || lawyer.fullname}</h4>
              </div>
              
              <div className="lawyer-card-body">
                <div className="lawyer-detail">
                  <FontAwesomeIcon icon={faGavel} className="lawyer-detail-icon" />
                  <span>{lawyer.specialization}</span>
                </div>
                
                <div className="lawyer-detail">
                  <FontAwesomeIcon icon={faBriefcase} className="lawyer-detail-icon" />
                  <span>Experience: {lawyer.experience || lawyer.yearsOfExperience || '3'} years</span>
                </div>
                
                <div className="lawyer-fees">
                  <div className="fee-item">
                    <span className="fee-label">Case Fee:</span>
                    <span className="fee-amount">{caseHandlingFee}</span>
                  </div>
                </div>
                
                {lawyer.rating && (
                  <div className="lawyer-detail">
                    <FontAwesomeIcon icon={faStar} className="lawyer-detail-icon text-warning" />
                    <span>Rating: {lawyer.rating}/5</span>
                  </div>
                )}
              </div>
              
              <div className="lawyer-card-footer">
                {selectedLawyerId === lawyer._id ? (
                  <button className="btn btn-success">
                    <FontAwesomeIcon icon={faCheck} className="me-2" /> Selected
                  </button>
                ) : (
                  <button className="btn btn-primary">
                    Select
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-content">
        <ClientSidebar />
        <div className="main-content">
          <div className="send-case-container">
            <div className="page-header">
              <h1>
                <FontAwesomeIcon icon={faPaperPlane} className="icon-space" />
                Send Case Details to Lawyer
              </h1>
              <p>Share your case information with a lawyer for consultation</p>
            </div>
            
            {error && (
              <div className="alert alert-danger">
                <FontAwesomeIcon icon={faExclamationCircle} className="icon-space" />
                {error}
              </div>
            )}
            
            <div className="form-section">
              <div className="card">
                <div className="card-header">
                  <h2>
                    <FontAwesomeIcon icon={faFileAlt} className="icon-space" />
                    Case Details
                  </h2>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSendCase}>
                    <div className="form-group">
                      <label htmlFor="case-select">Select a Case</label>
                      <select 
                        id="case-select"
                        className="form-control"
                        value={selectedCaseId}
                        onChange={handleCaseSelect}
                        required
                      >
                        <option value="">-- Select a case --</option>
                        {cases.length > 0 ? (
                          cases.map(caseItem => (
                          <option key={caseItem._id} value={caseItem._id}>
                            {caseItem.title}
                          </option>
                          ))
                        ) : (
                          <option value="" disabled>No cases available</option>
                        )}
                      </select>
                      {cases.length === 0 && !loading && (
                        <div className="no-cases-message mt-2">
                          <FontAwesomeIcon icon={faExclamationCircle} className="text-warning mr-2" />
                          You don't have any active cases. <Link to="/client/create-case">Create a case</Link> first.
                        </div>
                      )}
                    </div>
                    
                    {renderCaseDetails()}
                    
                    {renderSpecializedLawyers()}
                    
                    <div className="form-group mt-4">
                      <label htmlFor="lawyer-search">Select a Lawyer</label>
                      <div className="search-box">
                        <FontAwesomeIcon icon={faSearch} className="search-icon" />
                        <input
                          type="text"
                          id="lawyer-search"
                          placeholder="Search lawyers by name or specialization"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="form-control"
                        />
                      </div>
                      
                      {renderLawyerCards()}
                      
                      {selectedLawyerId && (
                        <div className="selected-lawyer-info mt-2">
                          <FontAwesomeIcon icon={faCheck} className="text-success me-2" />
                          Lawyer selected
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="case-notes">Additional Notes (Optional)</label>
                      <textarea
                        id="case-notes"
                        className="form-control"
                        rows="5"
                        value={caseNotes}
                        onChange={(e) => setCaseNotes(e.target.value)}
                        placeholder="Add any additional information you want to share with the lawyer..."
                      ></textarea>
                    </div>
                    
                    <div className="form-actions">
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={sendingCase || !selectedCaseId || !selectedLawyerId}
                      >
                        {sendingCase ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} spin className="icon-space" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faPaperPlane} className="icon-space" />
                            Send Case Details
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal show">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Send Case Details</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowConfirmModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to send these case details to the selected lawyer?</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleConfirmSend}
                  disabled={sendingCase}
                >
                  {sendingCase ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Sending...
                    </>
                  ) : (
                    'Yes, Send'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal show">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                  Success
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white"
                  onClick={handleCloseSuccess}
                ></button>
              </div>
              <div className="modal-body">
                <div className="text-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-success mb-3" size="3x" />
                  <h4>Case Details Sent Successfully!</h4>
                  <p>The lawyer will be notified about your case.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={handleCloseSuccess}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendCaseDetails; 