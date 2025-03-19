import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import Navbar from "../../components/navbar/navbar-lawyer";
import Footer from "../../components/footer/footer-lawyer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileAlt,
  faUserCog,
  faMessage,
  faGavel,
  faCalendarAlt,
  faVideo,
  faPhoneSlash,
  faBell,
  faHandshake,
  faSearch
} from "@fortawesome/free-solid-svg-icons";
import api from '../../config/api.config';
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import io from "socket.io-client";

const styles = {
  bannerImage: {
    width: '100%',
    height: '300px', // Adjust height as needed
    objectFit: 'cover',
    marginBottom: '2rem'
  },
  // ... other styles
};

const LawyerDashboard = () => {
  const [lawyerData, setLawyerData] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [incomingCalls, setIncomingCalls] = useState([]);
  const [pendingMeetings, setPendingMeetings] = useState([]);
  const [socket, setSocket] = useState(null);
  const [assignedCases, setAssignedCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);

  // Define the getCaseTypeBadge function within component scope
  const getCaseTypeBadge = (caseType) => {
    switch(caseType) {
      case 'criminal': return 'danger';
      case 'civil': return 'primary';
      case 'family': return 'success';
      case 'corporate': return 'info';
      default: return 'secondary';
    }
  };

  useEffect(() => {
    const fetchLawyerData = async () => {
      try {
        // Add debugging logs
        console.log("localStorage email:", localStorage.getItem("userEmail"));
        console.log("sessionStorage email:", sessionStorage.getItem("email"));
        console.log(
          "sessionStorage userEmail:",
          sessionStorage.getItem("userEmail")
        );

        // Try all possible storage locations
        const userEmail =
          localStorage.getItem("userEmail") ||
          sessionStorage.getItem("email") ||
          sessionStorage.getItem("userEmail");

        console.log("Final userEmail value:", userEmail);

        if (!userEmail) {
          console.error("User email not found in any storage location");
          return;
        }

        // First get lawyer details using email
        const response = await api.get(
          `/api/lawyers/user-details/${userEmail}`
        );
        console.log("API Response:", response.data);
        setLawyerData(response.data);

        // Fetch pending meetings
        if (response.data._id) {
          fetchPendingMeetings(response.data._id);
        }
      } catch (error) {
        console.error("Error fetching lawyer data:", error);
        if (error.response) {
          console.log("Error response:", error.response.data);
          console.log("Error status:", error.response.status);
        }
      }
    };

    fetchLawyerData();

    // Initialize socket connection
    if (user?._id) {
      const token = sessionStorage.getItem("token");
      
      if (!token) {
        console.error("No authentication token found");
        toast.error("Authentication error. Please log in again.");
        navigate('/login');
        return;
      }
      
      const newSocket = io("http://localhost:5000", {
        auth: {
          token: `Bearer ${token}` // Ensure proper token format
        },
        query: {
          userId: user._id,
          role: 'lawyer'
        }
      });

      setSocket(newSocket);

      // Join personal room
      newSocket.emit("join_room", user._id);

      // Listen for incoming calls
      newSocket.on("incomingCall", (callData) => {
        console.log("Incoming call received:", callData);
        toast.success(`Incoming call from ${callData.clientName}`);
        
        // Add to incoming calls list
        setIncomingCalls(prev => {
          // Avoid duplicates
          if (prev.some(call => call.meetingId === callData.meetingId)) {
            return prev;
          }
          return [...prev, callData];
        });
      });

      // Handle connection errors
      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        toast.error("Connection error. Please refresh the page.");
      });

      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    }
  }, [user]);

  // Fetch pending meetings
  const fetchPendingMeetings = async (lawyerId) => {
    try {
      const response = await api.get(
        `/api/meetings/pending/${lawyerId}`,
        {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setPendingMeetings(response.data.meetings);
      }
    } catch (error) {
      console.error("Error fetching pending meetings:", error);
    }
  };

  // Handle accepting a call
  const handleAcceptCall = async (meetingId, roomName, clientName) => {
    try {
      // First check if camera and microphone are available
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        // If successful, stop the tracks to release the devices
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('Device permission error:', error);
        let errorMessage = 'Could not access camera or microphone';
        
        if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMessage = 'Camera or microphone is already in use by another application. Please close other video applications and try again.';
        } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage = 'Permission to use camera and microphone was denied. Please allow access in your browser settings.';
        }
        
        toast.error(errorMessage);
        return; // Don't proceed with accepting the call
      }

      const response = await api.post(
        '/api/meetings/accept',
        {
          meetingId,
          lawyerId: lawyerData._id
        },
        {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        // Remove from incoming calls
        setIncomingCalls(prev => prev.filter(call => call.meetingId !== meetingId));
        
        // Encode lawyer name for URL
        const lawyerName = encodeURIComponent(
          lawyerData.fullName || 
          lawyerData.name || 
          user?.fullName || 
          user?.name || 
          sessionStorage.getItem('userName') || 
          localStorage.getItem('userName') || 
          'Lawyer'
        );
        const encodedRoomName = encodeURIComponent(roomName);
        
        // Open the video call directly in a new window with auto-filled name
        const videoServiceUrl = `https://meet.jit.si/${encodedRoomName}#userInfo.displayName="${lawyerName}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true`;
        
        // Open in new window
        const videoWindow = window.open(videoServiceUrl, '_blank', 'width=1200,height=800');
        
        // If window was blocked, show message and navigate to video call page as fallback
        if (!videoWindow || videoWindow.closed || typeof videoWindow.closed === 'undefined') {
          toast.error('Please allow pop-ups to open the video call');
          
          // Navigate to the video call page as fallback
          navigate(`/video-call/${roomName}`, {
            state: {
              roomName: roomName,
              meetingId: meetingId,
              isLawyer: true,
              lawyerName: lawyerName,
              clientName: clientName,
              autoJoin: true
            }
          });
        }
      }
    } catch (error) {
      console.error("Error accepting call:", error);
      toast.error("Failed to accept call");
    }
  };

  // Handle declining a call
  const handleDeclineCall = async (meetingId) => {
    try {
      const response = await api.post(
        '/api/meetings/decline',
        {
          meetingId
        }
      );

      if (response.data.success) {
        // Remove from incoming calls
        setIncomingCalls(prev => prev.filter(call => call.meetingId !== meetingId));
        toast.success("Call declined");
      }
    } catch (error) {
      console.error("Error declining call:", error);
      toast.error("Failed to decline call");
    }
  };

  const userName = sessionStorage.getItem("name") || "Lawyer";

  const fetchAssignedCases = async () => {
    if (!lawyerData?._id) return;
    
    try {
      setLoadingCases(true);
      console.log('Fetching assigned cases for lawyer:', lawyerData._id);
      
      // Use the api client instead of axios directly
      const response = await api.get(
        `/api/cases/assignments/lawyer/${lawyerData._id}`
      );
      
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        setAssignedCases(response.data.assignments.map(assignment => ({
          ...assignment.caseId,
          clientId: assignment.clientId,
          assignmentId: assignment._id,
          assignmentStatus: assignment.status,
          clientNotes: assignment.clientNotes
        })));
      }
    } catch (error) {
      console.error('Error fetching assigned cases:', error);
      
      // Fallback to the older endpoint if the new one fails
      try {
        console.log('Trying fallback endpoint for assigned cases');
        const fallbackResponse = await api.get(
          `/api/cases/assigned/${lawyerData._id}`
        );
        
        if (fallbackResponse.data.success) {
          setAssignedCases(fallbackResponse.data.cases);
        }
      } catch (fallbackError) {
        console.error('Fallback endpoint also failed:', fallbackError);
        toast.error('Failed to load assigned cases');
      }
    } finally {
      setLoadingCases(false);
    }
  };

  useEffect(() => {
    fetchAssignedCases();
  }, [lawyerData]);

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <div className="lawyer-dashboard-page">
          <Helmet>
            <title>Lawyer Dashboard - Lex Net</title>
            <meta
              name="description"
              content="Dashboard for managing cases and appointments for lawyers on Lex Net."
            />
          </Helmet>

          {lawyerData?.deactivationMessage && (
            <div
              className={`status-alert ${
                !lawyerData.visibleToClients ? "deactivated" : "activated"
              }`}
            >
              <div className="alert-content">
                <h3>
                  Account Status:{" "}
                  {lawyerData.visibleToClients ? "Activated" : "Deactivated"}
                </h3>
                <p>{lawyerData.deactivationMessage}</p>
              </div>
            </div>
          )}

          {/* Incoming Call Notifications */}
          {incomingCalls.length > 0 && (
            <div className="incoming-calls-container">
              {incomingCalls.map((call) => (
                <div key={call.meetingId} className="incoming-call-notification">
                  <div className="call-info">
                    <FontAwesomeIcon icon={faVideo} className="call-icon" />
                    <span>Incoming call from {call.clientName}</span>
                  </div>
                  <div className="call-actions">
                    <button 
                      className="accept-call-btn"
                      onClick={() => handleAcceptCall(call.meetingId, call.roomName, call.clientName)}
                    >
                      <FontAwesomeIcon icon={faVideo} /> Accept
                    </button>
                    <button 
                      className="decline-call-btn"
                      onClick={() => handleDeclineCall(call.meetingId)}
                    >
                      <FontAwesomeIcon icon={faPhoneSlash} /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pending Meetings Section */}
          {pendingMeetings.length > 0 && (
            <div className="meetings-section container mt-4">
              <div className="card">
                <div className="card-header bg-light">
                  <h5 className="mb-0">
                    <FontAwesomeIcon icon={faBell} className="me-2" />
                    Pending Video Call Requests
                  </h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Client</th>
                          <th>Requested At</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingMeetings.map(meeting => (
                          <tr key={meeting._id}>
                            <td>{meeting.clientName}</td>
                            <td>{new Date(meeting.createdAt).toLocaleString()}</td>
                            <td>
                              <span className="badge bg-warning">Pending</span>
                            </td>
                            <td>
                              <button 
                                className="btn btn-sm btn-primary me-2"
                                onClick={() => handleAcceptCall(meeting._id, meeting.roomName, meeting.clientName)}
                              >
                                <FontAwesomeIcon icon={faVideo} className="me-1" />
                                Join
                              </button>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDeclineCall(meeting._id)}
                              >
                                <FontAwesomeIcon icon={faPhoneSlash} className="me-1" />
                                Decline
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Assigned Cases Section */}
          {/* <div className="container mt-5">
            <div className="row">
              <div className="col-12">
                <div className="card shadow-sm">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">
                      <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                      Recent Case Assignments
                    </h5>
                  </div>
                  <div className="card-body">
                    {loadingCases ? (
                      <div className="text-center py-3">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : assignedCases.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Case Title</th>
                              <th>Client</th>
                              <th>Case Type</th>
                              <th>Status</th>
                              <th>Assigned</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {assignedCases.map(caseItem => (
                              <tr key={caseItem._id || caseItem.assignmentId || Math.random()}>
                                <td>{caseItem.title || 'Untitled Case'}</td>
                                <td>{caseItem.clientId?.name || "Client"}</td>
                                <td>
                                  <span className={`badge bg-${getCaseTypeBadge(caseItem.caseType || 'general')}`}>
                                    {(caseItem.caseType || 'General')?.charAt(0).toUpperCase() + (caseItem.caseType || 'General')?.slice(1)}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge bg-${
                                    caseItem.assignmentStatus === 'pending' ? 'warning' :
                                    caseItem.assignmentStatus === 'accepted' ? 'success' :
                                    caseItem.status === 'active' ? 'success' :
                                    caseItem.status === 'pending' ? 'warning' :
                                    'secondary'
                                  }`}>
                                    {(caseItem.assignmentStatus || caseItem.status || 'Pending')?.charAt(0).toUpperCase() + 
                                     (caseItem.assignmentStatus || caseItem.status || 'Pending')?.slice(1)}
                                  </span>
                                </td>
                                <td>{new Date(caseItem.updatedAt || caseItem.createdAt || Date.now()).toLocaleDateString()}</td>
                                <td>
                                  <Link 
                                    to={`/lawyer/case/${caseItem._id}`} 
                                    className="btn btn-sm btn-primary"
                                  >
                                    View Details
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="mb-0 text-muted">No case assignments yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div> */}

          {/* HERO SECTION */}
          <div className="container-fluid">
            <div className="row">
              <div className="hero-section">
                <div className="hero-overlay"></div>
                <div className="text-container d-flex flex-column justify-content-start align-items-start pt-6 slide">
                  <div className="text-1 fs-2 pb-3">Welcome, {userName}!</div>
                  <div className="text-2 fs-4">
                    Manage your cases and appointments efficiently
                  </div>
                </div>
                {/* Horizontal Buttons */}
                <div className="horizontal-btn d-none d-md-flex justify-content-center align-items-end w-100 h-100">
                  <div className="col flex-grow-1">
                    <Link to="/lawyer/casehub">
                      <button
                        className="btn btn-lg btn-outline-dark type-button p-4 w-100 fw-bold"
                        aria-label="Case Details"
                      >
                        <span className="p-3">
                          <FontAwesomeIcon icon={faFileAlt} size="1x" />
                        </span>
                        Case Hub
                      </button>
                    </Link>
                  </div>
                  <div className="col flex-grow-1">
                    <Link to="/lawyeravailability">
                      <button
                        className="btn btn-lg btn-outline-dark type-button p-4 w-100 fw-bold"
                        aria-label="Manage Availability"
                      >
                        <span className="p-3">
                          <FontAwesomeIcon icon={faCalendarAlt} size="1x" />
                        </span>
                        Availability
                      </button>
                    </Link>
                  </div>
                  <div className="col flex-grow-1">
                    <Link to="/lawyer/meetings">
                      <button
                        className="btn btn-lg btn-outline-dark type-button p-4 w-100 fw-bold"
                        aria-label="Meetings"
                      >
                        <span className="p-3">
                          <FontAwesomeIcon icon={faHandshake} size="1x" />
                        </span>
                        Meetings
                      </button>
                    </Link>
                  </div>
                  <div className="col flex-grow-1">
                    <Link to="/message">
                      <button
                        className="btn btn-lg btn-outline-dark type-button p-4 w-100 fw-bold"
                        aria-label="Messages"
                      >
                        <span className="p-3">
                          <FontAwesomeIcon icon={faMessage} size="1x" />
                        </span>
                        Messages
                      </button>
                    </Link>
                  </div>
                  <div className="col flex-grow-1">
                    <Link to="/ipc-sections">
                      <button
                        className="btn btn-lg btn-outline-dark type-button p-4 w-100 fw-bold"
                        aria-label="IPC Sections"
                      >
                        <span className="p-3">
                          <FontAwesomeIcon icon={faGavel} size="1x" />
                        </span>
                        IPC Sections
                      </button>
                    </Link>
                  </div>
                  <div className="col flex-grow-1">
                    <Link to="/lawyer/scan-document">
                      <button
                        className="btn btn-lg btn-outline-dark type-button p-4 w-100 fw-bold"
                        aria-label="Document Scanner"
                      >
                        <span className="p-3">
                          <FontAwesomeIcon icon={faSearch} size="1x" />
                        </span>
                        Document Scanner
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Footer />
        </div>
      </div>

      <style jsx="true">{`
        .lawyer-dashboard-page {
          font-size: 0.9rem;
          max-width: 100%;
        }
        .hero-section {
          background-image: url("https://static.vecteezy.com/system/resources/previews/027/105/968/large_2x/legal-law-and-justice-concept-open-law-book-with-a-wooden-judges-gavel-in-a-courtroom-or-law-enforcement-office-free-photo.jpg");
          height: 600px;
          background-size: cover;
          background-position: center;
          position: relative;
          display: flex;
          filter: brightness(1.2);
        }
        .hero-overlay {
          background-color: rgba(0, 0, 0, 0.4);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .text-container {
          position: relative;
          z-index: 1;
          margin-top: 8rem;
          margin-left: 3rem;
        }
        .text-1,
        .text-2 {
          color: #fff;
          font-family: "Marmelad", sans-serif;
          letter-spacing: 0.1rem;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
          font-weight: bold;
        }
        .text-2 {
          line-height: 2rem;
        }
        .slide {
          opacity: 0;
          transform: translateX(-100%);
          animation: slideLeft 1s forwards;
        }
        @keyframes slideLeft {
          from {
            opacity: 0;
            transform: translateX(-100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @media (max-width: 768px) {
          .text-container {
            margin-left: 1rem;
          }
        }
        .status-alert {
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          animation: slideIn 0.3s ease-out;
        }

        .deactivated {
          background-color: #fff3f3;
          border: 1px solid #ffcdd2;
        }

        .activated {
          background-color: #f1f8e9;
          border: 1px solid #c5e1a5;
        }

        .alert-content {
          text-align: center;
        }

        .alert-content h3 {
          margin-bottom: 10px;
          font-size: 1.2rem;
        }

        .deactivated h3 {
          color: #d32f2f;
        }

        .activated h3 {
          color: #2e7d32;
        }

        .alert-content p {
          color: #666;
          margin: 0;
          font-size: 1rem;
          line-height: 1.5;
        }

        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        img[alt="Law and Justice Concept"] {
          display: none;
        }

        .meetings-section {
            margin-bottom: 2rem;
        }
        .meetings-section .card {
            border: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .meetings-section .card-header {
            border-bottom: none;
        }
        .meetings-section .table th {
            border-top: none;
            font-weight: 600;
        }
        .meetings-section .btn-primary {
            padding: 0.25rem 1rem;
        }
        
        .incoming-calls-container {
          margin: 20px;
        }
        
        .incoming-call-notification {
          background-color: #f8d7da;
          color: #721c24;
          padding: 15px;
          border: 1px solid #f5c6cb;
          border-radius: 5px;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(220, 53, 69, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
          }
        }
        
        .call-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .call-icon {
          font-size: 1.2rem;
        }
        
        .call-actions {
          display: flex;
          gap: 10px;
        }
        
        .accept-call-btn {
          background-color: #28a745;
          color: white;
          border: none;
          padding: 5px 15px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .decline-call-btn {
          background-color: #dc3545;
          color: white;
          border: none;
          padding: 5px 15px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .accept-call-btn:hover {
          background-color: #218838;
        }
        
        .decline-call-btn:hover {
          background-color: #c82333;
        }
      `}</style>
    </>
  );
};

export default LawyerDashboard;
