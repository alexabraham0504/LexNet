import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './FindLawyers.css';
import Navbar from '../../components/navbar/navbar-client';
import ClientSidebar from '../../components/sidebar/ClientSidebar';
import Footer from '../../components/footer/footer-admin';
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
  faMoneyBill,
  faUser,
  faCalendar,
  faVideo,
  faFileAlt,
  faComment
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Chat from "../../components/Chat";
import { useAuth } from "../../context/AuthContext";

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
  const [selectedLawyerDetails, setSelectedLawyerDetails] = useState(null);

  // IPC to Specialization mapping
  const IPC_SPECIALIZATION_MAP = {
    // Environmental Laws
    '268': 'Environmental Law',
    '269': 'Environmental Law',
    '277': 'Environmental Law',
    '278': 'Environmental Law',
    
    // Criminal Laws - Add more IPC sections related to criminal law
    '302': 'Criminal Law',
    '303': 'Criminal Law',
    '304': 'Criminal Law',
    '307': 'Criminal Law',
    '324': 'Criminal Law',
    '325': 'Criminal Law',
    '326': 'Criminal Law',
    '354': 'Criminal Law',
    '376': 'Criminal Law',
    '378': 'Criminal Law',
    '379': 'Criminal Law',
    '380': 'Criminal Law',
    '392': 'Criminal Law',
    '396': 'Criminal Law',
    '420': 'Criminal Law',
    '499': 'Criminal Law',
    '500': 'Criminal Law',
    
    // Property Laws
    '441': 'Real Estate Law',
    '447': 'Real Estate Law',
    '425': 'Property Law',
    
    // Civil Laws
    '406': 'Civil Law',
    '415': 'Civil Law',
    '418': 'Civil Law',
    
    // Family Laws
    '494': 'Family Law',
    '495': 'Family Law',
    '496': 'Family Law',
    '498A': 'Family Law'
  };

  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get specialization directly from IPC map or use case specialization
        const requiredSpecialization = ipcSection ? 
          IPC_SPECIALIZATION_MAP[ipcSection] : 
          caseSpecialization;

        console.log('Fetching lawyers with params:', {
          ipcSection,
          requiredSpecialization,
          caseSpecialization
        });

        const response = await axios.get('http://localhost:5000/api/lawyers/verified', {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });

        if (response.data) {
          let filteredLawyers = response.data;

          // Filter by specialization if specified
          if (requiredSpecialization) {
            filteredLawyers = filteredLawyers.filter(lawyer => {
              // Normalize both strings for comparison
              const lawyerSpec = (lawyer.specialization || '').trim().toLowerCase();
              const requiredSpec = requiredSpecialization.trim().toLowerCase();
              
              console.log('Comparing:', {
                lawyer: lawyer.fullName,
                lawyerSpec,
                requiredSpec,
                matches: lawyerSpec === requiredSpec
              });
              
              return lawyerSpec === requiredSpec;
            });
          }

          console.log(`Found ${filteredLawyers.length} matching lawyers`);
          setLawyers(filteredLawyers);

          // Update UI feedback
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

  const handleViewProfile = (lawyer) => {
    setSelectedLawyerDetails(lawyer);
  };

  const handleCloseDetails = () => {
    setSelectedLawyerDetails(null);
  };

  const handleChat = (lawyer) => {
    if (!user) {
      navigate("/login");
      return;
    }

    const chatRoomId = `chat_${user._id}_${lawyer.userid}`;
    
    const chatExists = activeChats.find(chat => chat.chatRoomId === chatRoomId);
    
    if (!chatExists) {
      setActiveChats(prevChats => [...prevChats, {
        chatRoomId,
        lawyerId: lawyer.userid,
        lawyerName: lawyer.fullName || lawyer.fullname,
        minimized: false
      }]);
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
                      <p>
                        <strong>Practicing Courts:</strong> {lawyer.practicingCourts?.join(', ') || 'Not specified'}
                      </p>
                      <p>
                        <strong>Languages:</strong> {lawyer.languagesSpoken?.join(', ') || 'English'}
                      </p>
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
                        onClick={() => handleViewProfile(lawyer)}
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
                    <h3>{selectedLawyer.fullName}</h3>
                    <p>AEN: {selectedLawyer.AEN}</p>
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

                  <div className="booking-card">
                    <h4>Consultation Options</h4>
                    <div className="booking-options">
                      <button 
                        className="booking-btn appointment"
                        onClick={() => navigate(`/lawyer-appointment/${selectedLawyer._id}`)}
                      >
                        <FontAwesomeIcon icon={faCalendar} />
                        <span>Book Appointment</span>
                        <span className="fee-label">
                          {selectedLawyer.consultationFees.replace('₹', '')}
                        </span>
                      </button>
                      
                      <button 
                        className="booking-btn video-call"
                        onClick={() => toast.info("Video call feature coming soon!")}
                      >
                        <FontAwesomeIcon icon={faVideo} />
                        <span>Video Consultation</span>
                        <span className="fee-label">
                          {(selectedLawyer.videoCallFees || selectedLawyer.consultationFees).replace('₹', '')}
                        </span>
                      </button>

                      <button 
                        className="booking-btn case-details"
                        onClick={() => navigate(`/send-case-details/${selectedLawyer._id}`)}
                      >
                        <FontAwesomeIcon icon={faFileAlt} />
                        <span>Send Case Details</span>
                        <span className="fee-label">
                          {(selectedLawyer.caseDetailsFees || selectedLawyer.consultationFees).replace('₹', '')}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button 
                      className="modal-btn secondary"
                      onClick={() => handleChat(selectedLawyer)}
                    >
                      <FontAwesomeIcon icon={faComment} />
                      Chat Now
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="chat-windows-container">
              {activeChats.map((chat, index) => (
                <div 
                  key={chat.chatRoomId}
                  className={`chat-modal ${chat.minimized ? 'minimized' : ''}`}
                  style={{ right: `${20 + index * 380}px` }}
                >
                  <div className="chat-header">
                    <span>{chat.lawyerName}</span>
                    <div className="chat-controls">
                      <button 
                        className="minimize-chat"
                        onClick={() => handleToggleMinimize(chat.chatRoomId)}
                      >
                        {chat.minimized ? '□' : '−'}
                      </button>
                      <button 
                        className="close-chat"
                        onClick={() => handleCloseChat(chat.chatRoomId)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  {!chat.minimized && (
                    <Chat
                      chatRoomId={chat.chatRoomId}
                      receiverId={chat.lawyerId}
                      receiverName={chat.lawyerName}
                      hideHeader={true}
                    />
                  )}
                </div>
              ))}
            </div>

            {selectedLawyerDetails && (
              <div className="lawyer-details-modal" onClick={handleCloseDetails}>
                <button className="lawyer-details-close" onClick={handleCloseDetails}>×</button>
                <div className="lawyer-details-content" onClick={e => e.stopPropagation()}>
                  <div className="lawyer-details-left">
                    <img
                      src={selectedLawyerDetails.profilePicture ? 
                        `http://localhost:5000/uploads/${selectedLawyerDetails.profilePicture}` : 
                        '/default-lawyer-avatar.png'
                      }
                      alt={selectedLawyerDetails.fullName}
                      className="lawyer-details-avatar"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default-lawyer-avatar.png';
                      }}
                    />
                    <h2 className="lawyer-details-name">{selectedLawyerDetails.fullName}</h2>
                    <p className="lawyer-details-specialization">{selectedLawyerDetails.specialization}</p>
                  </div>
                  
                  <div className="lawyer-details-right">
                    <div className="lawyer-details-section">
                      <h3><FontAwesomeIcon icon={faUser} /> Professional Information</h3>
                      <p><strong>Experience:</strong> {selectedLawyerDetails.yearsOfExperience} years</p>
                      <p><strong>AEN Number:</strong> {selectedLawyerDetails.AEN}</p>
                      <p><strong>Law Firm:</strong> {selectedLawyerDetails.lawFirm || 'Independent Practice'}</p>
                      <p><strong>Practicing Courts:</strong> {selectedLawyerDetails.practicingCourts?.join(', ')}</p>
                    </div>

                    <div className="lawyer-details-section">
                      <h3><FontAwesomeIcon icon={faMoneyBill} /> Fee Structure</h3>
                      <p><strong>Consultation:</strong> {selectedLawyerDetails.consultationFees}</p>
                      <p><strong>Video Call:</strong> {selectedLawyerDetails.videoCallFees}</p>
                      <p><strong>Case Handling:</strong> {selectedLawyerDetails.caseHandlingFees}</p>
                      <p><strong>Case Details:</strong> {selectedLawyerDetails.caseDetailsFees}</p>
                    </div>

                    <div className="lawyer-details-section">
                      <h3><FontAwesomeIcon icon={faLanguage} /> Languages</h3>
                      <div className="languages-list">
                        {selectedLawyerDetails.languagesSpoken?.map((language, index) => (
                          <span key={index} className="language-tag">{language}</span>
                        ))}
                      </div>
                    </div>

                    <div className="lawyer-details-section">
                      <h3><FontAwesomeIcon icon={faUser} /> About</h3>
                      <p>{selectedLawyerDetails.bio || 'No bio available'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Footer />
        </div>
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

  .modal-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 2rem;
  }

  .modal-btn {
    padding: 1rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
  }

  .modal-btn.primary {
    background: #4CAF50;
    color: white;
  }

  .modal-btn.secondary {
    background: #2196F3;
    color: white;
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

  .chat-windows-container {
    position: fixed;
    top: 0;
    right: 0;
    width: 400px;
    height: 100vh;
    overflow-y: auto;
    padding: 20px;
    z-index: 1000;
  }

  .chat-modal {
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    z-index: 1001;
  }

  .chat-header {
    background: #222;
    padding: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .chat-controls {
    display: flex;
    gap: 10px;
  }

  .minimize-chat {
    background: none;
    border: none;
    font-size: 18px;
    color: #fff;
    cursor: pointer;
  }

  .close-chat {
    background: none;
    border: none;
    font-size: 18px;
    color: #fff;
    cursor: pointer;
  }

  .chat-content {
    flex: 1;
    padding: 20px;
  }

  .lawyer-details-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .lawyer-details-content {
    background: white;
    width: 90%;
    height: 80%;
    border-radius: 15px;
    display: flex;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .lawyer-details-left {
    width: 30%;
    padding: 2rem;
    background: #f8f9fa;
    border-right: 1px solid #dee2e6;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .lawyer-details-right {
    width: 70%;
    padding: 2rem;
    overflow-y: auto;
  }

  .lawyer-details-avatar {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 1.5rem;
    border: 4px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .lawyer-details-name {
    font-size: 1.8rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    text-align: center;
  }

  .lawyer-details-specialization {
    color: #666;
    margin-bottom: 1rem;
    text-align: center;
  }

  .lawyer-details-section {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .lawyer-details-section h3 {
    font-size: 1.2rem;
    color: #333;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .lawyer-details-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #fff;
    cursor: pointer;
    z-index: 1001;
  }

  @media (max-width: 768px) {
    .lawyer-details-content {
      flex-direction: column;
      height: 90%;
    }

    .lawyer-details-left,
    .lawyer-details-right {
      width: 100%;
    }

    .lawyer-details-left {
      padding: 1rem;
    }

    .lawyer-details-avatar {
      width: 150px;
      height: 150px;
    }
  }

  .booking-card {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 1.5rem;
    margin: 1.5rem 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }

  .booking-card h4 {
    margin-bottom: 1rem;
    color: #333;
    font-size: 1.1rem;
  }

  .booking-options {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .booking-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
    color: white;
    position: relative;
  }

  .booking-btn svg {
    margin-right: 10px;
  }

  .booking-btn.appointment {
    background: #4CAF50;
  }

  .booking-btn.video-call {
    background: #2196F3;
  }

  .booking-btn.case-details {
    background: #FF9800;
  }

  .booking-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }

  .fee-label {
    font-size: 0.9rem;
    opacity: 0.9;
    margin-left: auto;
    padding-left: 1rem;
  }

  @media (max-width: 768px) {
    .booking-options {
      grid-template-columns: 1fr;
    }
    
    .booking-btn {
      width: 100%;
    }
  }
`}</style> 