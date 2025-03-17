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
  faInfoCircle
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
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
  const [assignments, setAssignments] = useState([]);

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
        const response = await axios.get(
          `https://lexnet-backend.onrender.com/api/lawyers/user-details/${userEmail}`
        );
        console.log("API Response:", response.data);
        setLawyerData(response.data);

        // Fetch pending meetings
        if (response.data._id) {
          fetchPendingMeetings(response.data._id);
        }

        // After setting lawyer data, fetch assignments
        if (response.data._id) {
          fetchAssignments();
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
      
      const newSocket = io("https://lexnet-backend.onrender.com", {
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
      const response = await axios.get(
        `https://lexnet-backend.onrender.com/api/meetings/pending/${lawyerId}`,
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

      const response = await axios.post(
        'https://lexnet-backend.onrender.com/api/meetings/accept',
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
      const response = await axios.post(
        'https://lexnet-backend.onrender.com/api/meetings/decline',
        {
          meetingId
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
        toast.success("Call declined");
      }
    } catch (error) {
      console.error("Error declining call:", error);
      toast.error("Failed to decline call");
    }
  };

  const userName = sessionStorage.getItem("name") || "Lawyer";

  useEffect(() => {
    const fetchAssignedCases = async () => {
      if (!lawyerData?._id) return;
      
      try {
        setLoadingCases(true);
        const token = sessionStorage.getItem('token');
        
        if (!token) {
          console.error('No authentication token found');
          toast.error('Please log in again');
          navigate('/login');
          return;
        }
        
        console.log('Fetching assigned cases for lawyer ID:', lawyerData._id);
        
        // Add a timeout to the request
        const response = await axios.get(
          `https://lexnet-backend.onrender.com/api/cases/assigned/${lawyerData._id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            timeout: 10000 // 10 second timeout
          }
        );
        
        console.log('Response from assigned cases endpoint:', response.data);
        
        if (response.data.success) {
          console.log('Assigned cases received:', response.data.cases);
          setAssignedCases(response.data.cases);
        } else {
          console.warn('No cases returned or unsuccessful response:', response.data);
          setAssignedCases([]);
        }
      } catch (error) {
        console.error('Error fetching assigned cases:', error);
        
        // More detailed error logging
        if (error.response) {
          console.error('Error response status:', error.response.status);
          console.error('Error response data:', error.response.data);
          
          if (error.response.status === 500) {
            toast.error('Server error. Please try again later or contact support.');
          } else if (error.response.status === 403) {
            toast.error('You do not have permission to view these cases');
          } else if (error.response.status === 401) {
            toast.error('Authentication failed. Please log in again');
            navigate('/login');
          } else {
            toast.error('Error loading assigned cases');
          }
        } else if (error.request) {
          console.error('No response received:', error.request);
          toast.error('No response from server. Please check your connection');
        } else {
          console.error('Error message:', error.message);
          toast.error('Error loading assigned cases');
        }
        
        setAssignedCases([]);
      } finally {
        setLoadingCases(false);
      }
    };
    
    fetchAssignedCases();
  }, [lawyerData]);

  const fetchAssignments = async () => {
    try {
      setLoadingCases(true);
      const token = sessionStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        toast.error('Please log in again');
        navigate('/login');
        return;
      }
      
      console.log('Auth token from session:', token.substring(0, 20) + '...');
      
      try {
        // First try to get assignments directly using lawyerData._id
        if (lawyerData?._id) {
          console.log('Using lawyerId directly:', lawyerData._id);
          
          const directResponse = await axios.get(
            `https://lexnet-backend.onrender.com/api/cases/assignments/lawyer/${lawyerData._id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              },
              timeout: 10000
            }
          );
          
          if (directResponse.data.success) {
            console.log('Assignments received directly:', directResponse.data.assignments);
            setAssignments(directResponse.data.assignments);
            setLoadingCases(false);
            return;
          }
        }
        
        // If direct approach fails, try the lawyer ID lookup endpoint
        console.log('Trying to get lawyer ID from API');
        const userIdResponse = await axios.get(
          `https://lexnet-backend.onrender.com/api/cases/get-lawyer-id`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (!userIdResponse.data.success) {
          console.error('Could not retrieve lawyer ID for authenticated user');
          toast.error('Error loading assignments: Profile not found');
          setLoadingCases(false);
          return;
        }
        
        const correctLawyerId = userIdResponse.data.lawyerId;
        console.log('Retrieved correct lawyer ID:', correctLawyerId);
        
        // Now use this ID to fetch assignments
        const response = await axios.get(
          `https://lexnet-backend.onrender.com/api/cases/assignments/lawyer/${correctLawyerId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            timeout: 10000
          }
        );
        
        console.log('Response from assignments endpoint:', response.data);
        
        if (response.data.success) {
          console.log('Assignments received:', response.data.assignments);
          setAssignments(response.data.assignments);
        } else {
          console.warn('No assignments returned or unsuccessful response:', response.data);
          setAssignments([]);
        }
      } catch (error) {
        console.error('Error fetching assignments:', error);
        
        // Fallback: Try to load assigned cases from the old endpoint if available
        if (lawyerData?._id) {
          try {
            console.log('Trying fallback to old cases endpoint');
            const fallbackResponse = await axios.get(
              `https://lexnet-backend.onrender.com/api/cases/lawyer/${lawyerData._id}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            );
            
            if (fallbackResponse.data.success && fallbackResponse.data.cases) {
              // Convert cases to assignment-like format
              const convertedAssignments = fallbackResponse.data.cases.map(caseItem => ({
                _id: caseItem._id + '-assignment',
                caseId: caseItem,
                status: 'pending',
                assignmentDate: caseItem.updatedAt || caseItem.createdAt,
                clientId: caseItem.clientId
              }));
              
              setAssignments(convertedAssignments);
              console.log('Using fallback cases:', convertedAssignments);
            } else {
              setAssignments([]);
            }
          } catch (fallbackError) {
            console.error('Fallback failed too:', fallbackError);
            toast.error('Failed to load your cases');
            setAssignments([]);
          }
        } else {
          toast.error('Failed to load case assignments');
          setAssignments([]);
        }
      }
    } finally {
      setLoadingCases(false);
    }
  };

  useEffect(() => {
    if (lawyerData?._id) {
      fetchAssignments();
    }
  }, [lawyerData]);

  const renderAssignments = () => {
    if (loadingCases) {
      return (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading your assigned cases...</p>
        </div>
      );
    }

    if (assignments.length === 0) {
      return (
        <div className="alert alert-info my-3">
          <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
          You don't have any assigned cases yet.
        </div>
      );
    }

    return (
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>Case Title</th>
              <th>Client</th>
              <th>Type</th>
              <th>Assigned On</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => {
              // Get case details from either the embedded caseDetails or the populated caseId
              const caseData = assignment.caseDetails || assignment.caseId || {};
              const caseTitle = caseData.title || 'Untitled Case';
              const caseType = caseData.caseType || 'Unknown';
              
              return (
                <tr key={assignment._id}>
                  <td>{caseTitle}</td>
                  <td>
                    {assignment.clientId?.name || assignment.clientId?.email || 'Unknown Client'}
                  </td>
                  <td>
                    <span className={`badge bg-${getCaseTypeBadge(caseType)}`}>
                      {caseType}
                    </span>
                  </td>
                  <td>{new Date(assignment.assignmentDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge bg-${
                      assignment.status === 'pending' ? 'warning' : 
                      assignment.status === 'accepted' ? 'success' : 
                      assignment.status === 'completed' ? 'info' : 'secondary'
                    }`}>
                      {assignment.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => navigate(`/lawyer/case/${assignment.caseId?._id || assignment.caseId}`)}
                    >
                      View Case
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Add these functions to the component
  const handleAcceptMeeting = (meetingId) => {
    // Assuming this is similar to the existing handleAcceptCall function
    const meeting = pendingMeetings.find(m => m._id === meetingId);
    if (meeting) {
      handleAcceptCall(meetingId, meeting.roomName, meeting.clientName);
    } else {
      toast.error('Meeting details not found');
    }
  };

  const handleRejectMeeting = (meetingId) => {
    // This can just call the existing handleDeclineCall function
    handleDeclineCall(meetingId);
  };

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

          {/* Case Assignments Section - Prominently displayed */}
          <div className="container mt-4">
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                  Your Case Assignments
                </h5>
              </div>
              <div className="card-body">
                <button 
                  className="btn btn-outline-primary mb-3"
                  onClick={fetchAssignments}
                >
                  <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                  Refresh Case Assignments
                </button>
                {renderAssignments()}
              </div>
            </div>
          </div>

          {/* Pending Meetings Section */}
          {pendingMeetings.length > 0 && (
            <div className="meetings-section container mt-4">
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                    Pending Meetings
                  </h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Client</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingMeetings.map((meeting) => (
                          <tr key={meeting._id}>
                            <td>{meeting.clientName}</td>
                            <td>
                              {new Date(meeting.scheduledAt || meeting.createdAt).toLocaleString()}
                            </td>
                            <td>
                              <span className="badge bg-warning">Pending</span>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleAcceptMeeting(meeting._id)}
                              >
                                Accept
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleRejectMeeting(meeting._id)}
                              >
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
                    <Link to="/lawyer/cases">
                      <button
                        className="btn btn-lg btn-outline-dark type-button p-4 w-100 fw-bold"
                        aria-label="View All Cases"
                      >
                        <span className="p-3">
                          <FontAwesomeIcon icon={faGavel} size="1x" />
                        </span>
                        My Cases
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
