import React, { useEffect, useState } from "react";
import axios from "axios";
import Footer from "../../components/footer/footer-client";
import Navbar from "../../components/navbar/navbar-client";
import { motion } from "framer-motion";
import { FaFilter } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import Chat from "../../components/Chat";
import { useAuth } from "../../context/AuthContext";
import ClientSidebar from "../../components/sidebar/ClientSidebar";
// import './LawyerSearch.css';

const LawyerSearch = () => {
  const [lawyers, setLawyers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    AEN: "",
    specialization: "",
    location: "",
    maxFees: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);
  const [selectedLawyerId, setSelectedLawyerId] = useState(null);
  const { user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [activeChats, setActiveChats] = useState([]);
  const MAX_ACTIVE_CHATS = 3;

  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(
          `http://localhost:5000/api/lawyers/verified${
            searchTerm ? `?search=${searchTerm}` : ""
          }`
        );
        console.log("Lawyers data:", response.data);
        setLawyers(response.data);
      } catch (err) {
        console.error("Error fetching lawyers:", err);
        setError("Failed to fetch lawyers. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchLawyers();
  }, [searchTerm]);

  useEffect(() => {
    console.log("LawyerSearch - current user:", user);
  }, [user]);

  useEffect(() => {
    console.log("Session Storage Data:", {
      token: sessionStorage.getItem("token"),
      userid: sessionStorage.getItem("userid"),
      name: sessionStorage.getItem("name"),
      email: sessionStorage.getItem("email"),
      role: sessionStorage.getItem("role"),
    });
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyFilters = () => {
    setShowFilterModal(false);
  };

  const resetFilters = () => {
    setFilters({
      name: "",
      AEN: "",
      specialization: "",
      location: "",
      maxFees: "",
    });
  };

  const filteredLawyers = lawyers.filter((lawyer) => {
    const searchTermMatch = searchTerm
      ? (lawyer.fullname || lawyer.fullName)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lawyer.AEN?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    const matchName =
      !filters.name ||
      (lawyer.fullname || lawyer.fullName)?.toLowerCase().includes(filters.name.toLowerCase());

    const matchAEN =
      !filters.AEN ||
      lawyer.AEN?.toLowerCase().includes(filters.AEN.toLowerCase());

    const matchSpecialization =
      !filters.specialization ||
      lawyer.specialization
        ?.toLowerCase()
        .includes(filters.specialization.toLowerCase());

    const matchLocation =
      !filters.location ||
      lawyer.location?.address?.toLowerCase().includes(filters.location.toLowerCase());

    const matchFees =
      !filters.maxFees || lawyer.fees <= parseInt(filters.maxFees);

    return (
      searchTermMatch &&
      matchName &&
      matchAEN &&
      matchSpecialization &&
      matchLocation &&
      matchFees
    );
  });

  const handleLawyerClick = (lawyer) => {
    setSelectedLawyer(lawyer);
  };

  const handleCloseModal = () => {
    setSelectedLawyer(null);
  };

  const handleChat = (lawyer) => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Make sure we have the correct lawyer ID
    const lawyerId =  lawyer.userid;
    if (!lawyerId) {
      console.error("No lawyer ID found:", lawyer);
      return;
    }

    console.log("Opening chat with lawyer:", {
      lawyerId,
      lawyerName: lawyer.fullname || lawyer.fullName,
      userId: user._id
    });

    const chatRoomId = `chat_${user._id}_${lawyerId}`;
    
    const chatExists = activeChats.find(chat => chat.chatRoomId === chatRoomId);
    
    if (!chatExists) {
      if (activeChats.length >= MAX_ACTIVE_CHATS) {
        setActiveChats(prevChats => [{
          chatRoomId,
          lawyerId,
          lawyerName: lawyer.fullname || lawyer.fullName,
          minimized: false
        }, ...prevChats.slice(0, MAX_ACTIVE_CHATS - 1)]);
      } else {
        setActiveChats(prevChats => [{
          chatRoomId,
          lawyerId,
          lawyerName: lawyer.fullname || lawyer.fullName,
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="page-container">
      <Navbar />
      <ClientSidebar onToggle={setIsSidebarCollapsed} />
      <div className={`main-content ${isSidebarCollapsed ? '' : 'sidebar-expanded'}`}>
        <div className="lawyer-search-container">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="page-title"
          >
            Find Your Legal Expert
          </motion.h1>

          <div className="search-controls">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Search by name, specialization, or location..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <button
                className="filter-button"
                onClick={() => setShowFilterModal(true)}
              >
                <FaFilter />
              </button>
            </div>
          </div>

          {filteredLawyers.length > 0 ? (
            <motion.div
              className="lawyer-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {filteredLawyers.map((lawyer, index) => (
                <motion.div
                  key={lawyer._id}
                  className="lawyer-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleLawyerClick(lawyer)}
                >
                  <div className="profile-section">
                    {lawyer.profilePicture ? (
                      <img
                        src={`http://localhost:5000/uploads/${lawyer.profilePicture}`}
                        alt={`${lawyer.fullname || lawyer.fullName}'s profile`}
                        className="profile-picture"
                      />
                    ) : (
                      <div className="no-profile-picture">No Image</div>
                    )}
                  </div>
                  <div className="info-section">
                    <h3>{lawyer.fullname || lawyer.fullName}</h3>
                    <p>
                      <strong>Specialization:</strong> {lawyer.specialization}
                    </p>
                    <p>
                      <strong>Location:</strong> {lawyer.location?.address || 'Location not specified'}
                    </p>
                    <p>
                      <strong>Email:</strong> {lawyer.email}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <p className="no-results">No lawyers found matching your search.</p>
          )}

          {selectedLawyer && (
            <motion.div
              className="modal-overlay"
              onClick={handleCloseModal}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="modal-content calling-card"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
              >
                <button className="close-button" onClick={handleCloseModal}>
                  ×
                </button>

                <div className="lawyer-details">
                  <div className="header-section">
                    <div className="profile-section">
                      {selectedLawyer.profilePicture ? (
                        <img
                          src={`http://localhost:5000/uploads/${selectedLawyer.profilePicture}`}
                          alt={`${selectedLawyer.fullname || selectedLawyer.fullName}'s profile`}
                          className="profile-picture"
                        />
                      ) : (
                        <div className="no-profile-picture">No Image</div>
                      )}
                    </div>
                    <h2>{selectedLawyer.fullname || selectedLawyer.fullName}</h2>
                    <p className="aen">
                      <strong>AEN:</strong> {selectedLawyer.AEN}
                    </p>
                  </div>

                  <div className="info-grid">
                    <div className="info-item">
                      <strong>Specialization:</strong>
                      <span>{selectedLawyer.specialization}</span>
                    </div>
                    <div className="info-item">
                      <strong>Location:</strong>
                      <span>{selectedLawyer.location?.address || 'Location not specified'}</span>
                    </div>
                    <div className="info-item">
                      <strong>Phone:</strong>
                      <span>{selectedLawyer.phone}</span>
                    </div>
                    <div className="info-item">
                      <strong>Email:</strong>
                      <span>{selectedLawyer.email}</span>
                    </div>
                    <div className="info-item">
                      <strong>Fees:</strong>
                      <span>
                        ₹{selectedLawyer.fees.toString().replace(/^₹/, "")}
                      </span>
                    </div>
                  </div>

                  {/* Commenting out the modal actions section
                  <div className="modal-actions">
                    <Link
                      to={`/lawyer-appointment/${selectedLawyer._id}`}
                      className="action-button appointment-button"
                    >
                      <i className="fas fa-calendar-check"></i>
                      Set Appointment
                    </Link>
                    <button
                      className="action-button chat-button"
                      onClick={() => handleChat(selectedLawyer)}
                    >
                      <i className="fas fa-comment"></i>
                      Chat Now
                    </button>
                  </div>
                  */}
                </div>
              </motion.div>
            </motion.div>
          )}

          {showFilterModal && (
            <motion.div
              className="filter-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilterModal(false)}
            >
              <motion.div
                className="filter-modal"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="filter-header">
                  <h2>Advanced Filters</h2>
                  <button
                    className="close-filter-modal"
                    onClick={() => setShowFilterModal(false)}
                  >
                    ×
                  </button>
                </div>

                <div className="filter-form">
                  <div className="filter-group">
                    <label>
                      <i className="fas fa-id-card"></i>
                      AEN Number
                    </label>
                    <input
                      type="text"
                      value={filters.AEN}
                      onChange={(e) => handleFilterChange("AEN", e.target.value)}
                      placeholder="Enter AEN number"
                    />
                  </div>

                  <div className="filter-group">
                    <label>
                      <i className="fas fa-briefcase"></i>
                      Specialization
                    </label>
                    <input
                      type="text"
                      value={filters.specialization}
                      onChange={(e) =>
                        handleFilterChange("specialization", e.target.value)
                      }
                      placeholder="Enter specialization"
                    />
                  </div>

                  <div className="filter-group">
                    <label>
                      <i className="fas fa-map-marker-alt"></i>
                      Location
                    </label>
                    <input
                      type="text"
                      value={filters.location}
                      onChange={(e) =>
                        handleFilterChange("location", e.target.value)
                      }
                      placeholder="Enter location"
                    />
                  </div>

                  <div className="filter-group">
                    <label>
                      <i className="fas fa-dollar-sign"></i>
                      Maximum Fees
                    </label>
                    <input
                      type="number"
                      value={filters.maxFees}
                      onChange={(e) =>
                        handleFilterChange("maxFees", e.target.value)
                      }
                      placeholder="Enter maximum fees"
                    />
                  </div>
                </div>

                <div className="filter-actions">
                  <button className="reset-button" onClick={resetFilters}>
                    <i className="fas fa-undo"></i>
                    Reset
                  </button>
                  <button className="apply-button" onClick={applyFilters}>
                    <i className="fas fa-check"></i>
                    Apply Filters
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

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

          <style jsx="true">{`
            .page-container {
              min-height: 100vh;
              position: relative;
              width: 100%;
              background: #f8f9fa;
            }

            .main-content {
              padding: 20px;
              width: 100%;
              margin-left: 0;
              transition: margin-left 0.3s ease;
            }

            .main-content.sidebar-expanded {
              margin-left: 280px;
            }

            .lawyer-search-container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 2rem;
            }

            @media (max-width: 768px) {
              .main-content.sidebar-expanded {
                margin-left: 240px;
              }

              .lawyer-search-container {
                padding: 1rem;
              }
            }

            @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap");

            .page-title {
              font-size: 2.5rem;
              color: #2c3e50;
              text-align: center;
              margin-bottom: 2rem;
              font-family: "Poppins", sans-serif;
            }

            .search-controls {
              max-width: 600px;
              margin: 0 auto 3rem;
            }

            .search-input-container {
              position: relative;
              width: 100%;
              display: flex;
              align-items: center;
            }

            .search-input-container input {
              width: 100%;
              padding: 15px 25px;
              padding-right: 60px;
              border: none;
              border-radius: 30px;
              font-size: 1.2rem;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
              transition: all 0.3s ease;
              font-family: "Poppins", sans-serif;
              color: #2c3e50;
              font-weight: 500;
            }

            .search-input-container input:focus {
              outline: none;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            }

            .filter-button {
              position: absolute;
              right: 10px;
              background: #000000;
              border: none;
              padding: 10px;
              cursor: pointer;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.3s ease;
              border-radius: 50%;
            }

            .filter-button:hover {
              background: #000000;
              transform: scale(1.1);
            }

            .lawyer-card {
              background: rgba(255, 255, 255, 0.9);
              border-radius: 20px;
              padding: 25px;
              box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
              backdrop-filter: blur(5px);
              border: 1px solid rgba(255, 255, 255, 0.2);
              width: 100%;
              cursor: pointer;
              transition: all 0.3s ease;
              display: flex;
              gap: 25px;
              align-items: center;
            }

            .profile-section {
              flex-shrink: 0;
            }

            .info-section {
              flex: 1;
              text-align: left;
            }

            .lawyer-list {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(600px, 1fr));
              gap: 2rem;
              padding: 20px;
            }

            .lawyer-card:hover {
              transform: translateY(-5px);
              box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
            }

            .profile-picture {
              width: 120px;
              height: 120px;
              border-radius: 50%;
              object-fit: cover;
              border: 4px solid #fff;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }

            .info-section h3 {
              font-family: "Poppins", sans-serif;
              font-size: 1.4rem;
              font-weight: 600;
              color: #2c3e50;
              margin: 15px 0;
            }

            .info-section p {
              font-family: "Poppins", sans-serif;
              font-size: 1rem;
              color: #546e7a;
              margin: 8px 0;
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
              backdrop-filter: blur(5px);
            }

            .modal-content {
              background: rgba(255, 255, 255, 0.95);
              padding: 30px;
              border-radius: 15px;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
              backdrop-filter: blur(10px);
              width: 90%;
              max-width: 500px;
              position: relative;
              border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .header-section {
              text-align: center;
              margin-bottom: 20px;
            }

            .header-section h2 {
              margin: 10px 0 5px;
              color: #2c3e50;
              font-size: 1.5rem;
            }

            .header-section .aen {
              color: #666;
              font-size: 0.9rem;
              margin: 0;
            }

            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-top: 20px;
            }

            .info-item {
              background: #f8f9fa;
              padding: 12px;
              border-radius: 8px;
            }

            .info-item strong {
              display: block;
              color: #2c3e50;
              font-size: 0.9rem;
              margin-bottom: 4px;
            }

            .info-item span {
              color: #546e7a;
              font-size: 0.95rem;
            }

            .close-button {
              position: absolute;
              top: 15px;
              right: 15px;
              width: 40px;
              height: 40px;
              border: none;
              border-radius: 50%;
              background: #f8f9fa;
              color: #2c3e50;
              font-size: 1.5rem;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.3s ease;
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }

            .close-button:hover {
              background: #e9ecef;
              transform: rotate(90deg);
            }

            .lawyer-details {
              text-align: center;
            }

            .lawyer-details h2 {
              color: #2c3e50;
              font-size: 1.5rem;
              margin-bottom: 12px;
              font-family: "Poppins", sans-serif;
            }

            .lawyer-details p {
              margin: 8px 0;
              font-size: 0.95rem;
              color: #546e7a;
              font-family: "Poppins", sans-serif;
            }

            .lawyer-details .profile-section {
              margin-bottom: 20px;
            }

            .lawyer-details .profile-picture {
              width: 100px;
              height: 100px;
              margin: 0 auto;
            }

            .certificates a {
              display: inline-block;
              padding: 6px 14px;
              margin: 4px;
              background: #007bff;
              color: white;
              border-radius: 20px;
              text-decoration: none;
              transition: all 0.3s ease;
              font-size: 0.9rem;
            }

            .certificates a:hover {
              background: #0056b3;
              transform: translateY(-2px);
            }

            .search-controls {
              display: flex;
              gap: 1rem;
              align-items: center;
              max-width: 600px;
              margin: 0 auto 3rem;
            }

            .filter-button {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              padding: 12px 24px;
              border: none;
              border-radius: 30px;
              background: #007bff;
              color: white;
              cursor: pointer;
              font-family: "Poppins", sans-serif;
              font-weight: 500;
              transition: all 0.3s ease;
            }

            .filter-modal-overlay {
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
              backdrop-filter: blur(5px);
            }

            .filter-modal {
              background: white;
              padding: 2rem;
              border-radius: 20px;
              width: 90%;
              max-width: 500px;
              position: relative;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
            }

            .filter-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 2rem;
              padding-bottom: 1rem;
              border-bottom: 2px solid #f0f0f0;
            }

            .filter-header h2 {
              color: #2c3e50;
              font-size: 1.5rem;
              font-weight: 600;
              margin: 0;
            }

            .filter-form {
              display: grid;
              gap: 1.5rem;
            }

            .filter-group {
              display: flex;
              flex-direction: column;
              gap: 0.5rem;
            }

            .filter-group label {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              font-weight: 500;
              color: #2c3e50;
              font-size: 0.9rem;
            }

            .filter-group label i {
              color: #007bff;
              width: 20px;
            }

            .filter-group input {
              padding: 12px 15px;
              border: 2px solid #e0e0e0;
              border-radius: 12px;
              font-family: "Poppins", sans-serif;
              font-size: 0.95rem;
              transition: all 0.3s ease;
              background: #f8f9fa;
            }

            .filter-group input:focus {
              outline: none;
              border-color: #007bff;
              background: white;
              box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
            }

            .filter-actions {
              display: flex;
              gap: 1rem;
              margin-top: 2rem;
              padding-top: 1.5rem;
              border-top: 2px solid #f0f0f0;
            }

            .reset-button,
            .apply-button {
              flex: 1;
              padding: 12px 20px;
              border: none;
              border-radius: 12px;
              cursor: pointer;
              font-family: "Poppins", sans-serif;
              font-weight: 500;
              font-size: 0.95rem;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.5rem;
              transition: all 0.3s ease;
            }

            .reset-button {
              background: #f8f9fa;
              color: #2c3e50;
              border: 2px solid #e0e0e0;
            }

            .reset-button:hover {
              background: #e9ecef;
              border-color: #dee2e6;
            }

            .apply-button {
              background: #007bff;
              color: white;
            }

            .apply-button:hover {
              background: #0056b3;
              transform: translateY(-2px);
            }

            .close-filter-modal {
              background: #f8f9fa;
              border: none;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              font-size: 1.5rem;
              color: #2c3e50;
              transition: all 0.3s ease;
            }

            .close-filter-modal:hover {
              background: #e9ecef;
              transform: rotate(90deg);
            }

            .appointment-button {
              padding: 12px 30px;
              background: #000000;
              color: white;
              border: none;
              border-radius: 25px;
              font-family: "Poppins", sans-serif;
              font-weight: 500;
              font-size: 1rem;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .appointment-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 8px rgba(0, 0, 0, 0.2);
            }

            .appointment-button:active {
              transform: translateY(0);
            }

            .card-actions {
              display: flex;
              justify-content: center;
              margin-top: 15px;
            }

            .view-profile-button {
              padding: 12px 24px;
              background: #f8f9fa;
              color: #2c3e50;
              border: 2px solid #e0e0e0;
              border-radius: 25px;
              font-family: "Poppins", sans-serif;
              font-weight: 500;
              font-size: 1rem;
              cursor: pointer;
              transition: all 0.3s ease;
            }

            .view-profile-button:hover {
              background: #e9ecef;
              transform: translateY(-2px);
            }

            .calling-card {
              background: white;
              border-radius: 20px;
              padding: 30px;
            }

            .contact-info,
            .professional-info {
              margin: 15px 0;
              padding: 12px;
              border-radius: 8px;
              background: #f8f9fa;
            }

            .contact-info p,
            .professional-info p {
              margin: 8px 0;
            }

            .modal-actions {
              display: flex;
              justify-content: center;
              gap: 20px;
              margin-top: 30px;
            }

            .action-button {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.3s ease;
              text-decoration: none;
              border: none;
            }

            .appointment-button {
              background-color: #4caf50;
              color: white;
            }

            .chat-button {
              background-color: #2196f3;
              color: white;
            }

            .action-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }

            .action-button:active {
              transform: translateY(0);
            }

            .action-button i {
              font-size: 18px;
            }

            .modal-content.calling-card {
              background: white;
              border-radius: 15px;
              padding: 30px;
              max-width: 600px;
              width: 90%;
              position: relative;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            }

            .header-section {
              text-align: center;
              margin-bottom: 25px;
            }

            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }

            .info-item {
              display: flex;
              flex-direction: column;
              gap: 5px;
            }

            .info-item strong {
              color: #666;
              font-size: 14px;
            }

            .info-item span {
              color: #333;
              font-size: 16px;
            }

            @media (max-width: 768px) {
              .page-title {
                font-size: 2rem;
              }

              .lawyer-list {
                grid-template-columns: 1fr;
              }

              .lawyer-card {
                max-width: 100%;
              }

              .modal-content {
                width: 90%;
                padding: 20px;
              }

              .lawyer-details h2 {
                font-size: 1.4rem;
              }

              .lawyer-details p {
                font-size: 0.95rem;
              }

              .search-bar input {
                font-size: 1.1rem;
                padding: 12px 20px;
              }

              .search-bar input::placeholder {
                font-size: 1rem;
              }

              .filter-modal {
                width: 95%;
                padding: 1.5rem;
              }

              .filter-group input {
                padding: 10px 12px;
              }

              .filter-actions {
                flex-direction: column;
              }

              .modal-actions {
                flex-direction: column;
                gap: 15px;
              }

              .action-button {
                width: 100%;
                justify-content: center;
              }

              .info-grid {
                grid-template-columns: 1fr;
              }
            }

            .chat-windows-container {
              position: fixed;
              bottom: 0;
              right: 0;
              display: flex;
              flex-direction: row-reverse;
              gap: 20px;
              padding: 20px;
              z-index: 1000;
            }

            .chat-modal {
              position: fixed;
              bottom: 20px;
              width: 350px;
              height: 500px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              display: flex;
              flex-direction: column;
              overflow: hidden;
              transition: all 0.3s ease;
            }

            .chat-modal.minimized {
              height: 50px;
            }

            .chat-header {
              background: #1a237e;
              color: white;
              padding: 10px 15px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              cursor: pointer;
            }

            .chat-controls {
              display: flex;
              gap: 10px;
            }

            .minimize-chat,
            .close-chat {
              background: none;
              border: none;
              color: white;
              cursor: pointer;
              font-size: 18px;
              padding: 0 5px;
              transition: color 0.3s ease;
            }

            .minimize-chat:hover,
            .close-chat:hover {
              color: #ddd;
            }

            /* Responsive adjustments */
            @media (max-width: 768px) {
              .chat-windows-container {
                flex-direction: column;
                width: 100%;
              }

              .chat-modal {
                width: 100%;
                right: 0 !important;
                bottom: 0;
                border-radius: 0;
              }

              .chat-modal:not(:last-child) {
                display: none;
              }
            }
          `}</style>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LawyerSearch;
