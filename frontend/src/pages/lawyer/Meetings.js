import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faVideo, 
  faPhoneSlash, 
  faBell 
} from '@fortawesome/free-solid-svg-icons';
import api from '../../config/api.config';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/navbar/navbar-lawyer';
import Footer from '../../components/footer/footer-lawyer';

const Meetings = () => {
  const [pendingMeetings, setPendingMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lawyerData, setLawyerData] = useState(null);

  useEffect(() => {
    const fetchLawyerData = async () => {
      try {
        const userEmail = localStorage.getItem("userEmail") || 
                         sessionStorage.getItem("email") || 
                         sessionStorage.getItem("userEmail");
        
        if (userEmail) {
          const response = await api.get(`/api/lawyers/user-details/${userEmail}`);
          setLawyerData(response.data);
          
          if (response.data._id) {
            fetchPendingMeetings(response.data._id);
          }
        }
      } catch (error) {
        console.error("Error fetching lawyer data:", error);
        toast.error("Failed to load lawyer data");
      }
    };

    fetchLawyerData();
  }, []);

  const fetchPendingMeetings = async (lawyerId) => {
    try {
      setLoading(true);
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
      toast.error("Failed to load pending meetings");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptCall = async (meetingId, roomName, clientName) => {
    try {
      const response = await api.post(
        '/api/meetings/accept',
        {
          meetingId,
          lawyerId: lawyerData._id
        }
      );

      if (response.data.success) {
        // Remove from pending meetings
        setPendingMeetings(prev => prev.filter(meeting => meeting._id !== meetingId));
        
        // Open video call in new window
        const lawyerName = encodeURIComponent(lawyerData.fullName || 'Lawyer');
        const encodedRoomName = encodeURIComponent(roomName);
        const videoServiceUrl = `https://meet.jit.si/${encodedRoomName}#userInfo.displayName="${lawyerName}"`;
        window.open(videoServiceUrl, '_blank');
        
        toast.success('Meeting accepted successfully');
      }
    } catch (error) {
      console.error("Error accepting meeting:", error);
      toast.error("Failed to accept meeting");
    }
  };

  const handleDeclineCall = async (meetingId) => {
    try {
      const response = await api.post(
        '/api/meetings/decline',
        { meetingId }
      );

      if (response.data.success) {
        setPendingMeetings(prev => prev.filter(meeting => meeting._id !== meetingId));
        toast.success('Meeting declined successfully');
      }
    } catch (error) {
      console.error("Error declining meeting:", error);
      toast.error("Failed to decline meeting");
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <div className="flex-grow-1">
        <div className="container mt-4">
          <div className="card">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faBell} className="me-2" />
                Pending Video Call Requests
              </h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : pendingMeetings.length > 0 ? (
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
              ) : (
                <div className="text-center py-4">
                  <p className="mb-0 text-muted">No pending video call requests</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Meetings;