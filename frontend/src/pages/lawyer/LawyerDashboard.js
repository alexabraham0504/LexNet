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
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import io from "socket.io-client";

// Ensure the URL matches your server's URL
const socket = io("http://localhost:5000", {
    transports: ['websocket'], // Use WebSocket transport
    withCredentials: true // Include credentials if needed
});

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
  const [meetingIds, setMeetingIds] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const roomName = queryParams.get("roomName");

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
          `http://localhost:5000/api/lawyers/user-details/${userEmail}`
        );
        console.log("API Response:", response.data);
        setLawyerData(response.data);
      } catch (error) {
        console.error("Error fetching lawyer data:", error);
        if (error.response) {
          console.log("Error response:", error.response.data);
          console.log("Error status:", error.response.status);
        }
      }
    };

    fetchLawyerData();
  }, []);

  useEffect(() => {
    const fetchMeetingIds = async () => {
      try {
        // Only fetch active meetings (less than 10 minutes old)
        const response = await axios.get(`http://localhost:5000/api/lawyers/meetingIds/${user._id}`);
        setMeetingIds(response.data.filter(meeting => {
          const meetingTime = new Date(meeting.createdAt).getTime();
          const currentTime = new Date().getTime();
          const timeDifference = currentTime - meetingTime;
          const minutesDifference = timeDifference / (1000 * 60);
          return minutesDifference <= 10;
        }));
      } catch (error) {
        console.error("Error fetching meeting IDs:", error);
      }
    };

    // Initial fetch
    fetchMeetingIds();

    // Set up interval to check and update meetings every minute
    const interval = setInterval(fetchMeetingIds, 60000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    socket.on("incomingCall", (data) => {
      // Check if the call is less than 10 minutes old
      const callTime = new Date(data.createdAt).getTime();
      const currentTime = new Date().getTime();
      const timeDifference = currentTime - callTime;
      const minutesDifference = timeDifference / (1000 * 60);

      if (minutesDifference <= 10) {
        setIncomingCall(data);
        console.log("Incoming call from:", data.clientName);
      }
    });

    socket.on("connect", () => {
        console.log("Socket.IO connected:", socket.id);
    });

    return () => {
      socket.off("incomingCall");
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (roomName) {
      console.log("Joining room:", roomName);
      navigate(`/lawyer/video-call?roomName=${roomName}`);
    }
  }, [roomName, navigate]);

  const handleAcceptCall = () => {
    console.log("Call accepted:", incomingCall);
    console.log("Room name to join:", incomingCall.roomName);
    navigate(`/lawyer/video-call?roomName=${incomingCall.roomName}`);
  };

  const handleRejectCall = () => {
    setIncomingCall(null);
    console.log("Call rejected");
  };

  const userName = sessionStorage.getItem("name") || "Lawyer";

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

          {/* Incoming Call Notification */}
          {incomingCall && (
            <div className="incoming-call-notification">
              <h4>Incoming Call from {incomingCall.clientName}</h4>
              <button onClick={handleAcceptCall}>Accept</button>
              <button onClick={handleRejectCall}>Reject</button>
            </div>
          )} */

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
                    <Link to="/lawyercasemanagement">
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
                    <Link to="/lawyer/video-call">
                      <button className="btn btn-primary">Start Video Call</button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="meetings-section container mt-4">
            <div className="card">
                <div className="card-header bg-primary text-white">
                    <h3 className="mb-0">
                        <FontAwesomeIcon icon={faVideo} className="me-2" />
                        Pending Video Consultations
                    </h3>
                </div>
                <div className="card-body">
                    {meetingIds.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Client Name</th>
                                        <th>Meeting ID</th>
                                        <th>Created At</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {meetingIds.map(meeting => (
                                        <tr key={meeting._id}>
                                            <td>{meeting.clientName}</td>
                                            <td>{meeting.roomName}</td>
                                            <td>{new Date(meeting.createdAt).toLocaleString()}</td>
                                            <td>
                                                <Link 
                                                    to={`/lawyer/video-call?roomName=${meeting.roomName}`}
                                                    className="btn btn-primary btn-sm"
                                                >
                                                    Join Meeting
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="mb-0">No pending video consultations</p>
                        </div>
                    )}
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
        .incoming-call-notification {
          background-color: #f8d7da;
          color: #721c24;
          padding: 15px;
          border: 1px solid #f5c6cb;
          border-radius: 5px;
          margin: 20px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      `}</style>
    </>
  );
};

export default LawyerDashboard;
