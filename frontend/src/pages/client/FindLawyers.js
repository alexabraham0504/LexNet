import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './FindLawyers.css';
import Navbar from '../../components/navbar/navbar-client';
import ClientSidebar from '../../components/sidebar/ClientSidebar';
import Footer from '../../components/footer/footer-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserCircle,
  faStar,
  faFilter,
  faSearch,
  faGavel,
  faUserTie,
  faBalanceScale,
  faClock,
  faLanguage,
  faMoneyBill
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import Chat from "../../components/Chat";

const FindLawyers = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { ipcSection, specialization: caseSpecialization } = location.state || {};
  const [searchTerm, setSearchTerm] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [filters, setFilters] = useState({
    experience: 'all',
    rating: 'all',
    fees: 'all',
    specialization: 'all'
  });
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const { user } = useAuth();
  const [activeChats, setActiveChats] = useState([]);
  const MAX_ACTIVE_CHATS = 3;

  // IPC to Specialization mapping
  const IPC_SPECIALIZATION_MAP = {
    // Environmental Laws
    '268': 'Environmental Law',
    '269': 'Environmental Law',
    '277': 'Environmental Law',
    '278': 'Environmental Law',
    
    // Criminal Laws
    '302': 'Criminal Law',
    '307': 'Criminal Law',
    '378': 'Criminal Law',
    '379': 'Criminal Law',
    
    // Property Laws
    '441': 'Real Estate Law',
    '447': 'Real Estate Law',
    '425': 'Property Law',
    
    // Civil Laws
    '420': 'Civil Law',
    '406': 'Civil Law',
    
    // Family Laws
    '494': 'Family Law',
    '498A': 'Family Law'
  };

  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Determine the required specialization based on IPC section
        const requiredSpecialization = ipcSection ? IPC_SPECIALIZATION_MAP[ipcSection] : caseSpecialization;

        console.log('Fetching lawyers for:', {
          ipcSection,
          requiredSpecialization
        });

        // Fetch all verified lawyers
        const response = await axios.get('http://localhost:5000/api/lawyers/verified', {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });

        if (response.data) {
          // Filter lawyers based on specialization
          const filteredLawyers = response.data.filter(lawyer => 
            lawyer.specialization === requiredSpecialization
          );

          setLawyers(filteredLawyers);

          if (filteredLawyers.length === 0) {
            toast.info(`No lawyers found specializing in ${requiredSpecialization}`);
          } else {
            toast.success(`Found ${filteredLawyers.length} lawyers specializing in ${requiredSpecialization}`);
          }
        }

      } catch (error) {
        console.error('Error fetching lawyers:', error);
        setError('Failed to fetch lawyers. Please try again.');
        toast.error('Error loading lawyers');
      } finally {
        setLoading(false);
      }
    };

    fetchLawyers();
  }, [ipcSection, caseSpecialization]);

  const filteredLawyers = lawyers.filter(lawyer => {
    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        lawyer.fullName?.toLowerCase().includes(searchLower) ||
        lawyer.expertise?.some(exp => exp.toLowerCase().includes(searchLower)) ||
        lawyer.specialization?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Experience filter
    if (filters.experience !== 'all') {
      const years = parseInt(lawyer.yearsOfExperience || '0');
      if (filters.experience === '0-5' && years > 5) return false;
      if (filters.experience === '5-10' && (years < 5 || years > 10)) return false;
      if (filters.experience === '10+' && years < 10) return false;
    }

    // Rating filter
    if (filters.rating !== 'all') {
      const rating = parseFloat(lawyer.rating || '0');
      if (filters.rating === '4+' && rating < 4) return false;
      if (filters.rating === '3+' && rating < 3) return false;
    }

    // Fees filter
    if (filters.fees !== 'all') {
      const fees = parseInt(lawyer.consultationFees || '0');
      if (filters.fees === '0-1000' && fees > 1000) return false;
      if (filters.fees === '1000-5000' && (fees < 1000 || fees > 5000)) return false;
      if (filters.fees === '5000+' && fees < 5000) return false;
    }

    // Specialization filter
    if (filters.specialization !== 'all') {
      return lawyer.specialization === filters.specialization;
    }

    return true;
  });

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Update the navigation buttons
  const handleBookAppointment = (lawyer) => {
    setSelectedLawyer(lawyer);
  };

  const handleViewProfile = (lawyerId) => {
    navigate(`/client/lawyer-profile/${lawyerId}`);
  };

  const handleChat = (lawyer) => {
    if (!user) {
      navigate("/login");
      return;
    }

    const lawyerId = lawyer._id;
    if (!lawyerId) {
      console.error("No lawyer ID found:", lawyer);
      return;
    }

    console.log("Opening chat with lawyer:", {
      lawyerId,
      lawyerName: lawyer.fullName,
      userId: user._id
    });

    const chatRoomId = `chat_${user._id}_${lawyerId}`;
    
    const chatExists = activeChats.find(chat => chat.chatRoomId === chatRoomId);
    
    if (!chatExists) {
      if (activeChats.length >= MAX_ACTIVE_CHATS) {
        setActiveChats(prevChats => [{
          chatRoomId,
          lawyerId,
          lawyerName: lawyer.fullName,
          minimized: false
        }, ...prevChats.slice(0, MAX_ACTIVE_CHATS - 1)]);
      } else {
        setActiveChats(prevChats => [{
          chatRoomId,
          lawyerId,
          lawyerName: lawyer.fullName,
          minimized: false
        }, ...prevChats]);
      }
    } else {
      setActiveChats(prevChats => {
        const otherChats = prevChats.filter(chat => chat.chatRoomId !== chatRoomId);
        return [{
          ...chatExists,
          minimized: false
        }, ...otherChats];
      });
    }
  };

  const handleCloseChat = (chatRoomId) => {
    setActiveChats(prevChats => prevChats.filter(chat => chat.chatRoomId !== chatRoomId));
  };

  const handleToggleMinimize = (chatRoomId) => {
    setActiveChats(prevChats => prevChats.map(chat => 
      chat.chatRoomId === chatRoomId 
        ? { ...chat, minimized: !chat.minimized }
        : chat
    ));
  };

  const handleVideoCall = (lawyer) => {
    if (!user) {
      navigate("/login");
      return;
    }

    const lawyerId = lawyer._id;
    if (!lawyerId) {
      console.error("No lawyer ID found:", lawyer);
      return;
    }

    // Create a unique room name using timestamp and IDs
    const timestamp = new Date().getTime();
    const roomName = `meeting_${user._id}_${lawyerId}_${timestamp}`;

    // Show loading toast
    const loadingToastId = toast.loading("Initiating video call...");

    // Get token from sessionStorage
    const token = sessionStorage.getItem('token');
    
    if (!token) {
      toast.dismiss(loadingToastId);
      toast.error('Authentication error. Please log in again.');
      navigate('/login');
      return;
    }

    // Send meeting request to the lawyer
    axios.post('http://localhost:5000/api/meetings/create', {
      lawyerId: lawyerId,
      roomName: roomName,
      clientName: user.fullName || user.name || sessionStorage.getItem('userName') || localStorage.getItem('userName') || 'Client',
      clientId: user._id,
      lawyerName: lawyer.fullName,
      status: 'pending'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      toast.dismiss(loadingToastId);
      if (response.data.success) {
        toast.success('Video call request sent to lawyer');
        
        // Create URL with encoded parameters for external video service
        const clientName = encodeURIComponent(
          user.fullName || 
          user.name || 
          sessionStorage.getItem('userName') || 
          localStorage.getItem('userName') || 
          'Client'
        );
        const encodedRoomName = encodeURIComponent(roomName);
        
        // Simplified URL with essential parameters for better compatibility
        const videoServiceUrl = `https://meet.jit.si/${encodedRoomName}#userInfo.displayName="${clientName}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true`;
        
        // Open in new window with specific features
        const videoWindow = window.open(videoServiceUrl, '_blank', 'width=1200,height=800,noopener,noreferrer');
        
        // If window was blocked, show message and navigate to video call page as fallback
        if (!videoWindow || videoWindow.closed || typeof videoWindow.closed === 'undefined') {
          toast.error('Please allow pop-ups to open the video call');
          
          // Navigate to the video call page as fallback
          navigate(`/video-call/${roomName}`, {
            state: {
              roomName: roomName,
              lawyerName: lawyer.fullName,
              lawyerId: lawyerId,
              meetingId: response.data.meeting._id,
              clientName: clientName,
              autoJoin: true
            }
          });
        }
      } else {
        toast.error('Failed to initiate video call');
      }
    })
    .catch(error => {
      toast.dismiss(loadingToastId);
      console.error('Error initiating video call:', error);
      
      if (error.response && error.response.status === 401) {
        toast.error('Authentication error. Please log in again.');
        sessionStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error('Error initiating video call. Please try again.');
      }
    });
  };

  const handleSendCaseDetails = (lawyer) => {
    // Implement send case details functionality
    console.log("Sending case details to:", lawyer.fullName);
    // You can navigate to a case details form or open a modal
    navigate(`/send-case-details/${lawyer._id}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-content">
        <ClientSidebar />
        <div className="main-content">
          <div className="find-lawyers-page">
            <motion.div 
              className="search-filters-container"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="search-bar">
                <FontAwesomeIcon icon={faSearch} />
                <input
                  type="text"
                  placeholder="Search lawyers by name or expertise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="filters">
                <div className="filter-group">
                  <label className="filter-label">Experience</label>
                  <select
                    value={filters.experience}
                    onChange={(e) => handleFilterChange('experience', e.target.value)}
                  >
                    <option value="all">All Experience</option>
                    <option value="0-5">0-5 years</option>
                    <option value="5-10">5-10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Rating</label>
                  <select
                    value={filters.rating}
                    onChange={(e) => handleFilterChange('rating', e.target.value)}
                  >
                    <option value="all">All Ratings</option>
                    <option value="4+">4+ Stars</option>
                    <option value="3+">3+ Stars</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Consultation Fees</label>
                  <select
                    value={filters.fees}
                    onChange={(e) => handleFilterChange('fees', e.target.value)}
                  >
                    <option value="all">All Fees</option>
                    <option value="0-1000">₹0-1000</option>
                    <option value="1000-5000">₹1000-5000</option>
                    <option value="5000+">₹5000+</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Specialization</label>
                  <select
                    value={filters.specialization}
                    onChange={(e) => handleFilterChange('specialization', e.target.value)}
                  >
                    <option value="all">All Specializations</option>
                    <option value="Criminal Law">Criminal Law</option>
                    <option value="Civil Law">Civil Law</option>
                    <option value="Family Law">Family Law</option>
                    <option value="Corporate Law">Corporate Law</option>
                    <option value="Environmental Law">Environmental Law</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {specialization && (
              <motion.div 
                className="specialization-banner"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <FontAwesomeIcon icon={faGavel} size="2x" />
                <h2>Lawyers Specializing in {IPC_SPECIALIZATION_MAP[ipcSection] || caseSpecialization}</h2>
              </motion.div>
            )}

            {loading ? (
              <motion.div 
                className="loading-container"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="spinner"></div>
                <p>Finding specialized lawyers for your case...</p>
              </motion.div>
            ) : error ? (
              <motion.div 
                className="error-message"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <p>{error}</p>
                <button 
                  className="btn btn-primary mt-3"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </button>
              </motion.div>
            ) : (
              <motion.div 
                className="lawyers-grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredLawyers.map((lawyer, index) => (
                  <motion.div 
                    key={lawyer._id} 
                    className="lawyer-card"
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="lawyer-header">
                      <img 
                        src={lawyer.profilePicture ? 
                          `http://localhost:5000/uploads/${lawyer.profilePicture}` : 
                          '/default-lawyer-avatar.png'
                        } 
                        alt={lawyer.fullName} 
                        className="lawyer-avatar"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/default-lawyer-avatar.png';
                        }}
                      />
                      <div className="lawyer-basic-info">
                        <h3>{lawyer.fullName}</h3>
                        <p className="specialization">{lawyer.specialization}</p>
                        <div className="rating">
                          {[...Array(5)].map((_, index) => (
                            <FontAwesomeIcon 
                              key={index}
                              icon={faStar} 
                              className={index < (lawyer.rating || 0) ? 'star-filled' : 'star-empty'}
                            />
                          ))}
                          <span>({lawyer.ratingsCount || 0})</span>
                        </div>
                      </div>
                    </div>

                    <div className="lawyer-details">
                      <p><strong>Experience:</strong> {lawyer.yearsOfExperience || 0} years</p>
                      <p><strong>Expertise:</strong> {lawyer.expertise?.join(', ') || 'General Practice'}</p>
                      <p><strong>Languages:</strong> {lawyer.languages?.join(', ') || 'English'}</p>
                    </div>

                    <div className="lawyer-actions">
                      <button 
                        className="btn-book"
                        onClick={() => handleBookAppointment(lawyer)}
                      >
                        Book Consultation
                      </button>
                      <button 
                        className="btn-profile"
                        onClick={() => handleViewProfile(lawyer._id)}
                      >
                        View Profile
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {selectedLawyer && (
              <div className="modal-overlay" onClick={() => setSelectedLawyer(null)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <button className="modal-close" onClick={() => setSelectedLawyer(null)}>×</button>
                  
                  <div className="modal-header">
                    <img 
                      src={selectedLawyer.profilePicture ? 
                        `http://localhost:5000/uploads/${selectedLawyer.profilePicture}` : 
                        '/default-lawyer-avatar.png'
                      }
                      alt={selectedLawyer.fullName}
                      className="lawyer-avatar"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default-lawyer-avatar.png';
                      }}
                    />
                    <div className="lawyer-header-info">
                      <h2>{selectedLawyer.fullName}</h2>
                      <h3>AEN: {selectedLawyer.AEN}</h3>
                    </div>
                  </div>

                  <div className="lawyer-info-grid">
                    <div className="info-section">
                      <div className="info-label">Specialization</div>
                      <div className="info-value">{selectedLawyer.specialization}</div>
                    </div>

                    <div className="info-section">
                      <div className="info-label">Location</div>
                      <div className="info-value">{selectedLawyer.location?.address || 'Not specified'}</div>
                    </div>

                    <div className="info-section">
                      <div className="info-label">Phone</div>
                      <div className="info-value">{selectedLawyer.phone}</div>
                    </div>

                    <div className="info-section">
                      <div className="info-label">Email</div>
                      <div className="info-value">{selectedLawyer.email}</div>
                    </div>
                  </div>

                  <div className="action-buttons-container">
                    <div className="top-actions-row">
                      <Link 
                        to={`/lawyer-appointment/${selectedLawyer._id}`}
                        className="modal-btn appointment"
                      >
                        <i className="fas fa-calendar"></i>
                        Set Appointment
                        <span className="fee-label">{selectedLawyer.consultationFees || "₹100"}</span>
                      </Link>
                      <button 
                        className="modal-btn video"
                        onClick={() => {
                          handleVideoCall(selectedLawyer);
                          setSelectedLawyer(null);
                        }}
                      >
                        <i className="fas fa-video"></i>
                        Video Call
                        <span className="fee-label">{selectedLawyer.videoCallFees || "₹100"}</span>
                      </button>
                      <button 
                        className="modal-btn case"
                        onClick={() => {
                          handleSendCaseDetails(selectedLawyer);
                          setSelectedLawyer(null);
                        }}
                      >
                        <i className="fas fa-file-alt"></i>
                        Send Case Details
                        <span className="fee-label">{selectedLawyer.caseHandlingFees || "₹122"}</span>
                      </button>
                    </div>
                    <div className="bottom-actions-row">
                      <button 
                        className="modal-btn chat"
                        onClick={() => {
                          handleChat(selectedLawyer);
                          setSelectedLawyer(null);
                        }}
                      >
                        <i className="fas fa-comment"></i>
                        Chat Now
                        <span className="fee-label">Free</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Footer />
        </div>
      </div>
      <div className="chat-windows-container">
        {activeChats.map((chat, index) => (
          <div 
            key={chat.chatRoomId}
            className={`chat-modal ${chat.minimized ? 'minimized' : ''}`}
            style={{ 
              right: `${20 + (index * 370)}px`,
              zIndex: 1000 - index
            }}
          >
            <div className="chat-header">
              <span>{chat.lawyerName}</span>
              <div className="chat-controls">
                <button 
                  className="minimize-chat"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleMinimize(chat.chatRoomId);
                  }}
                >
                  {chat.minimized ? '□' : '−'}
                </button>
                <button 
                  className="close-chat"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseChat(chat.chatRoomId);
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            {!chat.minimized && (
              <Chat
                key={chat.chatRoomId}
                chatRoomId={chat.chatRoomId}
                receiverId={chat.lawyerId}
                receiverName={chat.lawyerName}
                hideHeader={true}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FindLawyers; 

<style jsx="true">{`
  .stats-wrapper {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    padding: 1rem 0;
    border-top: 1px solid #eee;
  }

  .stats-container {
    display: flex;
    justify-content: space-between;
    width: 300px;
    margin-right: 1rem;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    flex: 1;
    text-align: center;
  }

  .stat-item:first-child {
    text-align: left;
  }

  .stat-item.center {
    text-align: center;
  }

  .stat-item.right {
    text-align: right;
  }

  .stat-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #666;
  }

  /* Align the content within each stat-item */
  .stat-item:first-child .stat-value,
  .stat-item:first-child .stat-label {
    margin-left: 1rem;
  }

  .stat-item.center .stat-value,
  .stat-item.center .stat-label {
    margin-left: auto;
    margin-right: auto;
  }

  .stat-item.right .stat-value,
  .stat-item.right .stat-label {
    margin-right: 1rem;
  }

  @media (max-width: 768px) {
    .stats-container {
      width: 250px;
      margin-right: 0.5rem;
    }

    .stat-item:first-child .stat-value,
    .stat-item:first-child .stat-label {
      margin-left: 0.5rem;
    }

    .stat-item.right .stat-value,
    .stat-item.right .stat-label {
      margin-right: 0.5rem;
    }
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 20px;
    padding: 2rem;
    width: 90%;
    max-width: 500px;
    position: relative;
    animation: modalSlideIn 0.3s ease-out;
  }

  .modal-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .modal-close {
    position: absolute;
    right: 20px;
    top: 20px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
  }

  .lawyer-info-grid {
    display: grid;
    gap: 1.5rem;
  }

  .info-section {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 10px;
  }

  .info-label {
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }

  .info-value {
    color: #333;
    font-weight: 500;
  }

  .action-buttons-container {
    margin-top: 2rem;
    padding: 0 1.5rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .top-actions-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.8rem;
    width: 100%;
  }

  .bottom-actions-row {
    width: 100%;
  }

  .bottom-actions-row .modal-btn {
    max-width: 100%;
  }

  .modal-btn {
    padding: 1rem 0.5rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    transition: all 0.3s ease;
    width: 100%;
    color: white;
    text-align: center;
    text-decoration: none;
    font-size: 0.9rem;
  }

  .modal-btn i {
    font-size: 1.2rem;
    margin-bottom: 0.3rem;
  }

  .fee-label {
    display: block;
    width: 100%;
    text-align: center;
    font-size: 0.8rem;
    margin-top: 0.3rem;
    font-weight: 500;
  }

  .modal-btn.appointment {
    background: #4CAF50;
  }

  .modal-btn.video {
    background: #9C27B0;
  }

  .modal-btn.case {
    background: #FF9800;
  }

  .modal-btn.chat {
    background: #2196F3;
  }

  .modal-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }

  @keyframes modalSlideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .top-actions-row {
      grid-template-columns: repeat(3, 1fr);
      gap: 0.8rem;
    }
  }

  @media (max-width: 480px) {
    .top-actions-row {
      grid-template-columns: 1fr;
      gap: 0.6rem;
    }
    
    .modal-btn {
      padding: 0.8rem 0.4rem;
    }
  }
`}</style> 