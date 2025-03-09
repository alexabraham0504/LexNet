import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar/navbar-client';
import './VideoCall.css';

const VideoCall = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [callStatus, setCallStatus] = useState('connecting');
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [deviceError, setDeviceError] = useState(null);
  const [jitsiWindow, setJitsiWindow] = useState(null);

  // Get meeting details from location state
  useEffect(() => {
    if (location.state) {
      setMeetingDetails(location.state);
      setCallStatus('connecting');
      
      // If autoJoin is true, open Jitsi with auto-filled name
      if (location.state.autoJoin) {
        // Get the user's name from various possible sources
        let displayName;
        
        if (location.state.isLawyer) {
          // For lawyer, use the name from location state or user context
          displayName = location.state.lawyerName || 
                        user?.fullName || 
                        user?.name || 
                        sessionStorage.getItem('userName') || 
                        localStorage.getItem('userName') || 
                        'Lawyer';
        } else {
          // For client, use the name from location state or user context
          displayName = location.state.clientName || 
                        user?.fullName || 
                        user?.name || 
                        sessionStorage.getItem('userName') || 
                        localStorage.getItem('userName') || 
                        'Client';
        }
        
        // Encode the display name for URL
        const encodedDisplayName = encodeURIComponent(displayName);
        
        const roomName = location.state.roomName;
        
        // Create URL with properly encoded name
        const videoServiceUrl = `https://meet.jit.si/${roomName}#userInfo.displayName="${encodedDisplayName}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true`;
        
        console.log("Opening video call with name:", displayName);
        console.log("Video call URL:", videoServiceUrl);
        
        // Open in new window with specific features to avoid browser restrictions
        const videoWindow = window.open(videoServiceUrl, '_blank', 'width=1200,height=800,noopener,noreferrer');
        setJitsiWindow(videoWindow);
        
        if (videoWindow) {
          // Set up a listener for when the window closes
          const checkWindowClosed = setInterval(() => {
            if (videoWindow.closed) {
              clearInterval(checkWindowClosed);
              setCallStatus('ended');
              toast.info('Video call window was closed');
            }
          }, 1000);
          
          setCallStatus('joined');
          toast.success('Video call opened in a new window');
        } else {
          toast.error('Failed to open video call. Please check if popup blockers are enabled.');
          setCallStatus('error');
        }
      } else {
        // Open Jitsi in a new window
        openJitsiDirectly();
      }
    } else {
      // If no state is passed, try to fetch meeting details
      axios.get(`http://localhost:5000/api/meetings/room/${roomId}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      })
      .then(response => {
        if (response.data.success) {
          setMeetingDetails(response.data.meeting);
          setCallStatus(response.data.meeting.status);
          // Open Jitsi in a new window
          openJitsiDirectly();
        } else {
          toast.error('Failed to retrieve meeting details');
          setCallStatus('error');
        }
      })
      .catch(error => {
        console.error('Error fetching meeting details:', error);
        toast.error('Error retrieving meeting information');
        setCallStatus('error');
      });
    }
    
    // Cleanup function
    return () => {
      if (jitsiWindow && !jitsiWindow.closed) {
        jitsiWindow.close();
      }
    };
  }, [roomId, location.state, user]);

  // Open Jitsi directly in a new window with no security restrictions
  const openJitsiDirectly = () => {
    try {
      const isLawyer = location.state?.isLawyer || false;
      
      // Get the user's name from various possible sources
      let displayName;
      
      if (isLawyer) {
        // For lawyer, use the name from location state or user context
        displayName = location.state?.lawyerName || 
                      user?.fullName || 
                      user?.name || 
                      sessionStorage.getItem('userName') || 
                      localStorage.getItem('userName') || 
                      'Lawyer';
      } else {
        // For client, use the name from location state or user context
        displayName = location.state?.clientName || 
                      user?.fullName || 
                      user?.name || 
                      sessionStorage.getItem('userName') || 
                      localStorage.getItem('userName') || 
                      'Client';
      }
      
      // Encode the display name for URL
      const encodedDisplayName = encodeURIComponent(displayName);
      
      // Use roomId or roomName from location state
      const roomIdentifier = location.state?.roomName || roomId;
      
      console.log("Opening video call with name:", displayName);
      
      // Create URL with properly encoded name
      const directJoinUrl = `https://meet.jit.si/${roomIdentifier}#userInfo.displayName="${encodedDisplayName}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true`;
      
      // Open in a new window with specific features
      const newWindow = window.open(directJoinUrl, 'jitsiMeeting', 'width=1200,height=800,noopener,noreferrer');
      setJitsiWindow(newWindow);
      
      if (newWindow) {
        // Set up a listener for when the window closes
        const checkWindowClosed = setInterval(() => {
          if (newWindow.closed) {
            clearInterval(checkWindowClosed);
            setCallStatus('ended');
            toast.info('Video call window was closed');
          }
        }, 1000);
        
        setCallStatus('joined');
        toast.success('Video call opened in a new window');
      } else {
        toast.error('Failed to open video call. Please check if popup blockers are enabled.');
        setCallStatus('error');
      }
    } catch (error) {
      console.error('Error opening Jitsi window:', error);
      toast.error('Failed to open video call: ' + error.message);
      setCallStatus('error');
    }
  };

  // Fallback method to join directly via URL
  const joinViaDirectLink = () => {
    try {
      // Use roomId or roomName from location state
      const roomIdentifier = location.state?.roomName || roomId;
      
      // Simplified direct URL without complex parameters
      const directUrl = `https://meet.jit.si/${roomIdentifier}`;
      
      // Open in a new tab
      window.open(directUrl, '_blank', 'noopener,noreferrer');
      toast.info('Opened Jitsi directly in a new tab');
    } catch (error) {
      console.error('Error opening direct link:', error);
      toast.error('Failed to open direct link: ' + error.message);
    }
  };

  const handleEndCall = () => {
    if (jitsiWindow && !jitsiWindow.closed) {
      jitsiWindow.close();
    }
    
    // Update meeting status to completed
    if (meetingDetails?.meetingId) {
      axios.post(
        'http://localhost:5000/api/meetings/complete',
        { meetingId: meetingDetails.meetingId },
        {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        }
      ).catch(error => {
        console.error('Error completing meeting:', error);
      });
    }
    
    setCallStatus('ended');
    navigate(-1);
  };

  if (!user) {
    return (
      <div className="video-call-container">
        <div className="error-message">
          <h2>Authentication Required</h2>
          <p>Please log in to join the video call.</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-call-page">
      <Navbar />
      <div className="video-call-container">
        {callStatus === 'error' ? (
          <div className="error-message">
            <h2>Error Joining Call</h2>
            <p>There was a problem connecting to the video call.</p>
            <div className="button-group">
              <button 
                className="btn-primary"
                onClick={openJitsiDirectly}
              >
                Try Again
              </button>
              <button 
                className="btn-secondary"
                onClick={joinViaDirectLink}
              >
                Join Directly
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate(-1)}
              >
                Go Back
              </button>
            </div>
          </div>
        ) : callStatus === 'ended' ? (
          <div className="call-ended-message">
            <h2>Call Ended</h2>
            <p>The video call has ended.</p>
            <button 
              className="btn-primary"
              onClick={() => navigate(-1)}
            >
              Go Back
            </button>
          </div>
        ) : (
          <>
            <div className="call-header">
              <h2>Video Call with {meetingDetails?.lawyerName || 'Lawyer'}</h2>
              <div className="call-controls">
                <span className="call-status">
                  {callStatus === 'connecting' ? 'Connecting...' : 
                   callStatus === 'joined' ? 'Connected (in new window)' : callStatus}
                </span>
                <button 
                  className="end-call-btn"
                  onClick={handleEndCall}
                >
                  End Call
                </button>
              </div>
            </div>
            <div className="call-active-container">
              <div className="call-info">
                <h3>Video Call is Active</h3>
                <p>Your video call is currently running in a separate window.</p>
                <p>If you closed the window accidentally, you can rejoin the call by clicking the button below.</p>
                <div className="button-group">
                  <button 
                    className="btn-primary"
                    onClick={openJitsiDirectly}
                  >
                    Rejoin Call
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={joinViaDirectLink}
                  >
                    Join Directly
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={handleEndCall}
                  >
                    End Call
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoCall; 