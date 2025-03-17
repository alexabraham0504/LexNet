import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar/navbar-client';
import Footer from '../../components/footer/footer-client';
import ClientSidebar from '../../components/sidebar/ClientSidebar';
import './VideoCall.css';
import { loadScript } from '../../utils/razorpay';
// Material UI imports
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Divider,
  Container
} from '@mui/material';
import {
  VideocamOutlined,
  PaymentOutlined,
  CheckCircleOutline,
  ErrorOutline,
  ArrowBack
} from '@mui/icons-material';

const VideoCall = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [callStatus, setCallStatus] = useState('pending');
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [deviceError, setDeviceError] = useState(null);
  const [jitsiWindow, setJitsiWindow] = useState(null);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  // Function to fetch meeting details and open video call
  const fetchMeetingDetails = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await axios.get(
        `https://lexnet-backend.onrender.com/api/meetings/room/${roomId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setMeetingDetails(response.data.meeting);
        setCallStatus('connecting');
        // Open the video call window
        openSimplifiedJitsi();
      } else {
        toast.error('Failed to retrieve meeting details');
        setCallStatus('error');
      }
    } catch (error) {
      console.error('Error fetching meeting details:', error);
      toast.error('Error retrieving meeting information');
      setCallStatus('error');
    }
  };

  // Function to open Jitsi window
  const openSimplifiedJitsi = () => {
    try {
      const domain = 'meet.jit.si';
      
      // Create URL with parameters
      const clientName = encodeURIComponent(user?.fullName || user?.name || 'Client');
      const encodedRoomId = encodeURIComponent(roomId);
      
      // Create a more compatible URL format with required parameters
      const url = `https://${domain}/${encodedRoomId}#` + 
        `userInfo.displayName="${clientName}"&` +
        `config.prejoinPageEnabled=false&` +
        `config.startWithAudioMuted=false&` +
        `config.startWithVideoMuted=false&` +
        `config.disableDeepLinking=true&` +
        `config.disableInitialGUM=false&` +
        `config.enableWelcomePage=false&` +
        `config.enableClosePage=false&` +
        `interfaceConfig.MOBILE_APP_PROMO=false&` +
        `interfaceConfig.SHOW_JITSI_WATERMARK=false&` +
        `interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false`;

      // First try to open in new window with all required features
      let newWindow = window.open(
        url,
        '_blank',
        'width=1200,height=800,menubar=no,toolbar=no,location=yes,status=no,resizable=yes'
      );
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // If pop-up blocked, show alternative options
        setCallStatus('blocked');
        
        // Update the UI to show direct link option
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" color="warning.main" gutterBottom>
              Pop-up Blocked
            </Typography>
            <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 1, mb: 2 }}>
              <Typography paragraph>
                Choose one of these options to join the video call:
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Option 1: Enable pop-ups
                </Typography>
                <ol style={{ textAlign: 'left', mb: 2 }}>
                  <li>Click the pop-up blocked icon in your browser's address bar</li>
                  <li>Allow pop-ups for this site</li>
                  <li>Click the "Try Again" button below</li>
                </ol>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Option 2: Open directly
                </Typography>
                <Typography paragraph>
                  Click the button below to open the video call in a new tab:
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<VideocamOutlined />}
                  sx={{ mb: 2 }}
                  onClick={() => {
                    setCallStatus('joined');
                    toast.success('Opening video call in new tab');
                  }}
                >
                  Open in New Tab
                </Button>
              </Box>
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                const win = window.open(url, '_blank', 'width=1200,height=800');
                if (win) {
                  setJitsiWindow(win);
                  setCallStatus('joined');
                }
              }}
              startIcon={<VideocamOutlined />}
              sx={{ mt: 2, mr: 2 }}
            >
              Try Again
            </Button>
          </Box>
        );
      }

      // If window opened successfully
      setJitsiWindow(newWindow);
      setCallStatus('joined');
      
      // Monitor window close
      const checkWindow = setInterval(() => {
        if (newWindow.closed) {
          clearInterval(checkWindow);
          setCallStatus('ended');
          toast.info('Video call ended');
        }
      }, 1000);

    } catch (error) {
      console.error('Error opening video call:', error);
      setCallStatus('error');
      toast.error('Failed to start video call');
    }
  };

  // Initialize by checking payment status
  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          throw new Error("Authentication required");
        }
        
        const response = await axios.get(
          `https://lexnet-backend.onrender.com/api/payments/status/video-call/${roomId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data.success && response.data.isPaid) {
          setIsPaymentComplete(true);
          fetchMeetingDetails();
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    };

    checkPaymentStatus();
  }, [roomId]);

  const initiateVideoCallPayment = async () => {
    try {
      setIsPaymentLoading(true);
      setPaymentError(null);

      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error("Authentication required");
      }

      // Load Razorpay script
      const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      if (!res) {
        throw new Error("Razorpay SDK failed to load");
      }

      // Create order
      const orderResponse = await axios.post(
        "https://lexnet-backend.onrender.com/api/payments/create-video-call-order",
        {
          roomId,
          clientId: user._id,
          clientEmail: user.email
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || "Failed to create payment order");
      }

      const { order, amount } = orderResponse.data;

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "Lex Net Legal Services",
        description: `Video Call Consultation (₹${amount})`,
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyResponse = await axios.post(
              "https://lexnet-backend.onrender.com/api/payments/verify-video-call",
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                roomId
              },
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            );

            if (verifyResponse.data.success) {
              setIsPaymentComplete(true);
              toast.success("Payment successful! Starting video call...");
              fetchMeetingDetails();
            }
          } catch (error) {
            setPaymentError("Payment verification failed");
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: user?.fullName || user?.name,
          email: user?.email,
          contact: user?.phone
        },
        theme: {
          color: "#1a237e"
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      setPaymentError(error.message);
      toast.error(error.message);
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleBack = () => {
    // Show confirmation if in a call
    if (isPaymentComplete && callStatus === 'joined') {
      if (window.confirm('Are you sure you want to leave the video call?')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  // Show payment screen if payment is not complete
  if (!isPaymentComplete) {
    return (
      <div className="app-container">
        <Navbar />
        <div className="main-content">
          <ClientSidebar />
          <Container className="content-wrapper">
            <Box sx={{ mb: 3, ml: 2 }}>
              <Button
                startIcon={<ArrowBack />}
                onClick={handleBack}
                sx={{
                  color: '#1a237e',
                  '&:hover': {
                    backgroundColor: 'rgba(26, 35, 126, 0.04)'
                  }
                }}
              >
                Back
              </Button>
            </Box>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              minHeight="calc(70vh - 48px)"
            >
              <Paper 
                elevation={3}
                sx={{
                  p: 4,
                  maxWidth: 500,
                  width: '100%',
                  textAlign: 'center',
                  borderRadius: 2,
                  background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)'
                }}
              >
                <VideocamOutlined 
                  sx={{ 
                    fontSize: 60, 
                    color: '#1a237e',
                    mb: 2
                  }} 
                />
                <Typography 
                  variant="h4" 
                  component="h1" 
                  gutterBottom
                  sx={{ 
                    color: '#1a237e',
                    fontWeight: 600
                  }}
                >
                  Payment Required
                </Typography>
                <Typography 
                  variant="subtitle1" 
                  sx={{ mb: 4, color: '#666' }}
                >
                  Please complete the payment to start your video consultation
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ my: 3 }}>
                  <Chip
                    icon={<PaymentOutlined />}
                    label="Secure Payment"
                    color="primary"
                    sx={{ mb: 2 }}
                  />
                </Box>
                <Button
                  variant="contained"
                  size="large"
                  onClick={initiateVideoCallPayment}
                  disabled={isPaymentLoading}
                  sx={{
                    backgroundColor: '#1a237e',
                    '&:hover': {
                      backgroundColor: '#0d1642',
                    },
                    py: 1.5,
                    px: 4,
                    borderRadius: 2
                  }}
                  startIcon={isPaymentLoading ? <CircularProgress size={20} color="inherit" /> : <PaymentOutlined />}
                >
                  {isPaymentLoading ? "Processing..." : "Pay Now"}
                </Button>
                {paymentError && (
                  <Box 
                    sx={{ 
                      mt: 2,
                      p: 2,
                      bgcolor: '#ffebee',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <ErrorOutline color="error" />
                    <Typography color="error">{paymentError}</Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          </Container>
        </div>
        <Footer />
      </div>
    );
  }

  // Video call interface
  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content">
        <ClientSidebar />
        <Container className="content-wrapper">
          <Box sx={{ mb: 3, ml: 2 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={handleBack}
              sx={{
                color: '#1a237e',
                '&:hover': {
                  backgroundColor: 'rgba(26, 35, 126, 0.04)'
                }
              }}
            >
              Back
            </Button>
          </Box>
          <Card 
            elevation={3}
            sx={{ 
              p: 4,
              maxWidth: 600,
              mx: 'auto',
              textAlign: 'center',
              borderRadius: 2
            }}
          >
            <Box sx={{ mb: 3 }}>
              <VideocamOutlined 
                sx={{ 
                  fontSize: 60, 
                  color: '#1a237e',
                  mb: 2
                }} 
              />
              <Typography variant="h5" gutterBottom>
                Video Call with {meetingDetails?.lawyerName || 'Lawyer'}
              </Typography>
              <Chip
                label={
                  callStatus === 'connecting' ? 'Connecting...' : 
                  callStatus === 'joined' ? 'Call in Progress' : 
                  callStatus === 'blocked' ? 'Pop-up Blocked' :
                  callStatus === 'ended' ? 'Call Ended' :
                  callStatus
                }
                color={
                  callStatus === 'joined' ? 'success' : 
                  callStatus === 'blocked' ? 'warning' :
                  callStatus === 'connecting' ? 'info' : 
                  'default'
                }
                icon={<VideocamOutlined />}
                sx={{ mb: 2 }}
              />
            </Box>
            
            {callStatus === 'blocked' && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" color="warning.main" gutterBottom>
                  Pop-up Blocked
                </Typography>
                <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 1, mb: 2 }}>
                  <Typography paragraph>
                    Choose one of these options to join the video call:
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Option 1: Enable pop-ups
                    </Typography>
                    <ol style={{ textAlign: 'left', mb: 2 }}>
                      <li>Click the pop-up blocked icon in your browser's address bar</li>
                      <li>Allow pop-ups for this site</li>
                      <li>Click the "Try Again" button below</li>
                    </ol>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Option 2: Open directly
                    </Typography>
                    <Typography paragraph>
                      Click the button below to open the video call in a new tab:
                    </Typography>
                    <Button
                      variant="outlined"
                      color="primary"
                      href={`https://meet.jit.si/${roomId}?jwt=${sessionStorage.getItem('token')}&userInfo.displayName=${encodeURIComponent(user?.fullName || user?.name || 'Client')}#config.prejoinPageEnabled=false`}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<VideocamOutlined />}
                      sx={{ mb: 2 }}
                      onClick={() => {
                        setCallStatus('joined');
                        toast.success('Opening video call in new tab');
                      }}
                    >
                      Open in New Tab
                    </Button>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={openSimplifiedJitsi}
                  startIcon={<VideocamOutlined />}
                  sx={{ mt: 2 }}
                >
                  Try Again
                </Button>
              </Box>
            )}

            {callStatus === 'error' && (
              <Box sx={{ mt: 2, color: 'error.main' }}>
                <ErrorOutline sx={{ fontSize: 40, mb: 1 }} />
                <Typography>
                  Failed to start video call. Please try again.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={openSimplifiedJitsi}
                  sx={{ mt: 2 }}
                >
                  Retry
                </Button>
              </Box>
            )}

            {callStatus === 'ended' && (
              <Box sx={{ mt: 2 }}>
                <Typography>
                  The video call has ended. Thank you for using our service.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate(-1)}
                  sx={{ mt: 2 }}
                >
                  Return to Dashboard
                </Button>
              </Box>
            )}
          </Card>
        </Container>
      </div>
      <Footer />
    </div>
  );
};

export default VideoCall; 