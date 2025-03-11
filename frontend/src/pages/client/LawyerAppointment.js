import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";
import Navbar from "../../components/navbar/navbar-client";
import Footer from "../../components/footer/footer-client";
import ClientSidebar from '../../components/sidebar/ClientSidebar';
import { useAuth } from "../../context/AuthContext";
import { loadScript } from '../../utils/razorpay';
import { toast } from 'react-hot-toast';

const BAD_WORDS = [
  'fuck', 'shit', 'ass', 'bitch', 'bastard', 'damn', 'cunt', 'dick', 'pussy', 
  // Add more bad words as needed
];

const LawyerAppointment = () => {
  const { lawyerId } = useParams();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [videoCallTimeSlots, setVideoCallTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [appointmentType, setAppointmentType] = useState('inPerson');
  const [lawyerDetails, setLawyerDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: sessionStorage.getItem("name") || "",
    clientEmail: sessionStorage.getItem("email") || "",
    clientPhone: sessionStorage.getItem("phone") || "",
    notes: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [availabilityStatus, setAvailabilityStatus] = useState('');
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [showStatusButton, setShowStatusButton] = useState(true);
  const [hasNotification, setHasNotification] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({
    reason: '',
    proposedDate: null,
    proposedTime: ''
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [appointmentId, setAppointmentId] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isVideoCallLoading, setIsVideoCallLoading] = useState(false);
  const [myConsultationRequests, setMyConsultationRequests] = useState([]);
  const [isLoadingConsultations, setIsLoadingConsultations] = useState(false);
  const [hasAcceptedAppointment, setHasAcceptedAppointment] = useState(false);
  const navigate = useNavigate();

  // Fetch lawyer details on component mount
  useEffect(() => {
    const fetchLawyerDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/lawyers/${lawyerId}`
        );
        setLawyerDetails(response.data);
      } catch (error) {
        console.error("Error fetching lawyer details:", error);
        setError("Error loading lawyer details");
      }
    };

    fetchLawyerDetails();
  }, [lawyerId]);

  // Fetch available time slots when date is selected
  useEffect(() => {
    const fetchAvailableTimeSlots = async () => {
      if (!selectedDate || !lawyerId) return;
      
      try {
        setIsLoading(true);
        
        // Reset time slots first
        setAvailableTimeSlots([]);
        setVideoCallTimeSlots([]);
        
        // Format the date to YYYY-MM-DD using local date components
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        
        console.log("Client fetching availability for date:", formattedDate, "lawyerId:", lawyerId);
        
        const response = await axios.get(
          `http://localhost:5000/api/lawyer/availability/${lawyerId}/${formattedDate}`
        );
        
        if (response.data.availability) {
          let inPersonSlots = [];
          let videoSlots = [];
          
          const availability = response.data.availability;
          
          // Get in-person slots
          if (availability.timeSlots && availability.timeSlots.length > 0) {
            inPersonSlots = availability.timeSlots;
          }
          
          // Get video call slots
          if (availability.videoCallTimeSlots && availability.videoCallTimeSlots.length > 0) {
            videoSlots = availability.videoCallTimeSlots;
          }
          
          // Fetch existing appointments to filter out booked slots
          const appointmentsResponse = await axios.get(
            `http://localhost:5000/api/appointments/date/${lawyerId}/${formattedDate}`
          );
          
          const bookedAppointments = appointmentsResponse.data.appointments || [];
          
          // Filter out booked in-person slots
          const bookedInPersonSlots = bookedAppointments
            .filter(apt => apt.status !== 'cancelled' && apt.appointmentType === 'inPerson')
            .map(apt => apt.appointmentTime);
          
          // Filter out booked video call slots
          const bookedVideoSlots = bookedAppointments
            .filter(apt => apt.status !== 'cancelled' && apt.appointmentType === 'videoCall')
            .map(apt => apt.appointmentTime);
          
          // Remove booked slots from available slots
          const availableInPersonSlots = inPersonSlots.filter(
            slot => !bookedInPersonSlots.includes(slot)
          );
          
          const availableVideoSlots = videoSlots.filter(
            slot => !bookedVideoSlots.includes(slot)
          );
          
          // Filter out past time slots if it's today
          const now = new Date();
          const isToday = selectedDate.toDateString() === now.toDateString();
          
          if (isToday) {
            const currentHour = now.getHours();
            
            // Filter in-person slots
            const filteredInPersonSlots = availableInPersonSlots.filter(slot => {
              const slotHour = parseInt(slot.split(':')[0]);
              return slotHour > currentHour;
            });
            
            // Filter video slots
            const filteredVideoSlots = availableVideoSlots.filter(slot => {
              const slotHour = parseInt(slot.split(':')[0]);
              return slotHour > currentHour;
            });
            
            setAvailableTimeSlots(filteredInPersonSlots);
            setVideoCallTimeSlots(filteredVideoSlots);
          } else {
            setAvailableTimeSlots(availableInPersonSlots);
            setVideoCallTimeSlots(availableVideoSlots);
          }
        }
      } catch (error) {
        console.error("Error fetching time slots:", error);
        setError("Failed to load available time slots. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableTimeSlots();
  }, [selectedDate, lawyerId]);

  const handleDateChange = (date) => {
    // Create a new date object at the start of the selected day
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    
    console.log("Client - Date changed to:", newDate);
    console.log("Client - Date ISO string:", newDate.toISOString());
    console.log("Client - Date local string:", newDate.toString());
    
    setSelectedDate(newDate);
    setSelectedTimeSlot(null);
    setError(null);
    setSuccess(false);
  };

  const handleTimeSlotSelect = (slot) => {
    setSelectedTimeSlot(slot);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "clientPhone") {
      // Only allow numbers
      const numbersOnly = value.replace(/[^\d]/g, '');
      // Update form data with numbers only
      setFormData(prev => ({
        ...prev,
        [name]: numbersOnly
      }));
      
      // Validate phone number
      const error = validatePhone(numbersOnly);
      setValidationErrors(prev => ({
        ...prev,
        [name]: error
      }));
      return;
    }

    // Real-time bad word filtering for name and notes
    if (name === "clientName" || name === "notes") {
      const containsBadWord = BAD_WORDS.some(word => 
        value.toLowerCase().includes(word.toLowerCase())
      );
      if (containsBadWord) {
        setValidationErrors(prev => ({
          ...prev,
          [name]: "Please use appropriate language"
        }));
        return; // Don't update the form data if it contains bad words
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Real-time validation
    let error = "";
    switch (name) {
      case "clientName":
        error = validateName(value);
        break;
      case "clientEmail":
        error = validateEmail(value);
        break;
      case "clientPhone":
        error = validatePhone(value);
        break;
      case "notes":
        error = validateNotes(value);
        break;
      default:
        break;
    }

    setValidationErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // Validation functions
  const validateName = (name) => {
    if (!name.trim()) {
      return "Name is required";
    }
    if (name.length < 3) {
      return "Name must be at least 3 characters long";
    }
    if (name.length > 50) {
      return "Name cannot exceed 50 characters";
    }

    // Check for bad words
    const containsBadWord = BAD_WORDS.some(word => 
      name.toLowerCase().includes(word.toLowerCase())
    );
    if (containsBadWord) {
      return "Please use appropriate language";
    }

    // Check for sequential repetition of letters (more than 2 times)
    const repeatingLetterRegex = /([a-zA-Z])\1{2,}/;
    if (repeatingLetterRegex.test(name)) {
      return "A letter cannot be repeated more than twice in sequence";
    }

    // Allow only letters, spaces, and common name characters
    const nameRegex = /^[a-zA-Z\s'.,-]+$/;
    if (!nameRegex.test(name.trim())) {
      return "Name can only contain letters, spaces, and basic punctuation";
    }

    return "";
  };

  const validateEmail = (email) => {
    if (!email) {
      return "Email is required";
    }
    if (email.length > 100) {
      return "Email cannot exceed 100 characters";
    }
    // More comprehensive email regex
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const validatePhone = (phone) => {
    if (!phone) {
      return "Phone number is required";
    }
    // Remove any spaces or special characters for validation
    const cleanPhone = phone.replace(/[\s-]/g, '');
    // Indian phone number validation (10 digits, starting with 6-9)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return "Please enter a valid 10-digit Indian phone number";
    }
    return "";
  };

  const validateNotes = (notes) => {
    if (notes.length > 500) {
      return "Notes cannot exceed 500 characters";
    }

    // Check for bad words
    const containsBadWord = BAD_WORDS.some(word => 
      notes.toLowerCase().includes(word.toLowerCase())
    );
    if (containsBadWord) {
      return "Please use appropriate language";
    }

    // Check for any malicious content or scripts
    const suspiciousPatterns = /<script|javascript:|data:/i;
    if (suspiciousPatterns.test(notes)) {
      return "Invalid characters in notes";
    }
    return "";
  };

  const validateForm = () => {
    const errors = {};
    
    // Validate name
    const nameError = validateName(formData.clientName);
    if (nameError) errors.clientName = nameError;

    // Validate email
    const emailError = validateEmail(formData.clientEmail);
    if (emailError) errors.clientEmail = emailError;

    // Validate phone
    const phoneError = validatePhone(formData.clientPhone);
    if (phoneError) errors.clientPhone = phoneError;

    // Validate notes if present
    if (formData.notes) {
      const notesError = validateNotes(formData.notes);
      if (notesError) errors.notes = notesError;
    }

    // Validate date and time slot selection
    if (!selectedDate) {
      errors.date = "Please select an appointment date";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDateCopy = new Date(selectedDate);
      selectedDateCopy.setHours(0, 0, 0, 0);

      if (selectedDateCopy < today) {
        errors.date = "Please select a future date";
      }
    }

    if (!selectedTimeSlot) {
      errors.timeSlot = "Please select an appointment time";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const loadRazorpayScript = async () => {
    const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
    if (!res) {
      setPaymentError('Razorpay SDK failed to load. Please check your internet connection.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Format the date for the API
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      // Validate all required fields
      if (!selectedDate || !selectedTimeSlot || !formData.clientName || !formData.clientEmail || !formData.clientPhone) {
        setError("Please fill in all required fields");
        return;
      }

      // Create appointment data
      const appointmentData = {
        lawyerId,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        appointmentDate: formattedDate,
        appointmentTime: selectedTimeSlot,
        appointmentType: appointmentType,
        notes: formData.notes
      };

      // Make the API call to create appointment
      const response = await axios.post(
        'http://localhost:5000/api/appointments',
        appointmentData
      );

      if (response.data.success !== false) {
        setSuccess(true);
        setError(null);
        
        // Reset form
        setSelectedTimeSlot(null);
        setFormData({
          ...formData,
          notes: ''
        });

        // Show payment modal if needed
        if (response.data.requiresPayment) {
          setAppointmentId(response.data.appointmentId);
          setPaymentAmount(response.data.paymentAmount);
          setShowPaymentModal(true);
        }
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError(error.response?.data?.message || 'Error booking appointment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const initiatePayment = async (appointmentId) => {
    try {
      setIsPaymentLoading(true);
      
      // Create order on the server
      const orderResponse = await axios.post(
        "http://localhost:5000/api/payments/create-order",
        { appointmentId }
      );
      
      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || "Failed to create payment order");
      }
      
      const orderData = orderResponse.data.data;
      
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) return;
      
      // Configure Razorpay options
      const options = {
        key: "rzp_test_bD1Alu6Su7sKSO", // Hardcoded for now to ensure it works
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Lex Net Legal Services",
        description: `Appointment with ${orderData.lawyerName} on ${new Date(orderData.appointmentDate).toLocaleDateString()} at ${orderData.appointmentTime}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            // Verify payment on server
            const verifyResponse = await axios.post(
              "http://localhost:5000/api/payments/verify",
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                appointmentId
              }
            );
            
            if (verifyResponse.data.success) {
              setPaymentSuccess(true);
              setSuccess(true);
              
              // Reset form data
              setFormData({
                ...formData,
                notes: "",
              });
              setSelectedTimeSlot(null);
              setSelectedDate(null);
              
              // Refresh bookings if needed
              if (fetchMyBookings) {
                fetchMyBookings();
              }
            } else {
              setPaymentError("Payment verification failed. Please contact support.");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            setPaymentError("Payment verification failed. Please contact support.");
          } finally {
            setIsPaymentLoading(false);
          }
        },
        prefill: {
          name: user?.fullName || user?.name || formData.clientName,
          email: user?.email || formData.clientEmail,
          contact: user?.phone || formData.clientPhone
        },
        theme: {
          color: "#1a237e"
        },
        modal: {
          ondismiss: function() {
            setIsPaymentLoading(false);
            setPaymentError("Payment cancelled. You can try again.");
          }
        }
      };
      
      // Create Razorpay instance and open payment modal
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
      // Handle payment modal close
      razorpay.on('payment.failed', function (response) {
        setPaymentError(`Payment failed: ${response.error.description}`);
        setIsPaymentLoading(false);
      });
      
    } catch (error) {
      console.error("Payment initiation error:", error);
      setPaymentError(error.response?.data?.message || error.message || "Failed to initiate payment");
      setIsPaymentLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    try {
      setIsLoadingBookings(true);
      const clientEmail = localStorage.getItem("userEmail") || sessionStorage.getItem("email");
      const response = await axios.get(
        `http://localhost:5000/api/appointments/client/${clientEmail}`
      );
      setMyBookings(response.data.appointments);
      
      // Check if there's at least one confirmed appointment with this lawyer
      const hasConfirmed = response.data.appointments.some(
        booking => booking.status === 'confirmed'
      );
      setHasAcceptedAppointment(hasConfirmed);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (showStatusPopup) {
      fetchMyBookings();
    }
  }, [showStatusPopup]);

  useEffect(() => {
    if (myBookings.length > 0) {
      const hasNewStatus = myBookings.some(booking => 
        booking.status === 'confirmed' || booking.status === 'cancelled'
      );
      setHasNotification(hasNewStatus);
      
      // Set the notification status based on the most recent booking
      const mostRecentBooking = myBookings[0];
      setNotificationStatus(mostRecentBooking.status);
    }
  }, [myBookings]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#28a745';
      case 'pending':
        return '#ffc107';
      case 'cancelled':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const handleRescheduleRequest = async (appointment) => {
    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = async () => {
    try {
      if (!rescheduleData.reason || !rescheduleData.proposedDate || !rescheduleData.proposedTime) {
        alert('Please fill all required fields');
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/appointments/reschedule/${selectedAppointment._id}`,
        {
          reason: rescheduleData.reason,
          proposedDate: rescheduleData.proposedDate,
          proposedTime: rescheduleData.proposedTime
        }
      );

      if (response.data.success) {
        alert('Reschedule request submitted successfully');
        setShowRescheduleModal(false);
        // Refresh appointments
        fetchMyBookings();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting reschedule request');
    }
  };

  const renderFormGroup = (label, name, type = "text", maxLength, required = true) => (
    <div className="form-group">
      <label>
        {label} {required && <span className="required">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        className={validationErrors[name] ? "error" : ""}
        maxLength={maxLength}
        required={required}
        placeholder={`Enter your ${label.toLowerCase()}`}
        style={{ height: '42px' }}
        {...(name === "clientName" && {
          pattern: "[A-Za-z .',-]*",
          onKeyPress: (e) => {
            if (!/[A-Za-z .',-]/.test(e.key)) {
              e.preventDefault();
            }
          },
          onPaste: (e) => {
            e.preventDefault();
            const pastedText = e.clipboardData.getData('text');
            const sanitizedText = pastedText.replace(/[^A-Za-z .',-]/g, '');
            const containsBadWord = BAD_WORDS.some(word => 
              sanitizedText.toLowerCase().includes(word.toLowerCase())
            );
            if (!containsBadWord) {
              setFormData(prev => ({
                ...prev,
                [name]: sanitizedText
              }));
            }
          }
        })}
        {...(name === "clientPhone" && {
          pattern: "[0-9]*",
          onKeyPress: (e) => {
            if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
              e.preventDefault();
            }
          },
          onPaste: (e) => {
            const pastedText = e.clipboardData.getData('text');
            if (!/^\d+$/.test(pastedText)) {
              e.preventDefault();
            }
          }
        })}
      />
      {maxLength && (
        <small className="char-count">
          {formData[name].length}/{maxLength} characters
        </small>
      )}
      {validationErrors[name] && (
        <span className="error-text">{validationErrors[name]}</span>
      )}
    </div>
  );

  // Add a handler for appointment type change
  const handleAppointmentTypeChange = (type) => {
    setAppointmentType(type);
    setSelectedTimeSlot(null); // Reset selected time slot when changing appointment type
  };

  // Update the handleVideoCall function to send a consultation request instead of immediately starting a call
  const handleVideoCall = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!lawyerId) {
      console.error("No lawyer ID found");
      return;
    }

    // Create a unique room name using timestamp and IDs
    const timestamp = new Date().getTime();
    const roomName = `meeting_${user._id}_${lawyerId}_${timestamp}`;

    // Show loading toast
    toast.loading("Sending video consultation request...");
    setIsVideoCallLoading(true);

    // Get token from sessionStorage
    const token = sessionStorage.getItem('token');
    
    if (!token) {
      toast.dismiss();
      toast.error('Authentication error. Please log in again.');
      navigate('/login');
      setIsVideoCallLoading(false);
      return;
    }

    // Send consultation request to the lawyer
    axios.post('http://localhost:5000/api/consultations/request', {
      lawyerId: lawyerId,
      roomName: roomName,
      clientName: user?.fullName || user?.name || sessionStorage.getItem('userName') || localStorage.getItem('userName') || 'Client',
      clientId: user?._id,
      lawyerName: lawyerDetails?.fullName || lawyerDetails?.fullname || lawyerDetails?.name || 'Lawyer',
      status: 'pending',
      message: "I would like to schedule a video consultation with you."
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      toast.dismiss();
      setIsVideoCallLoading(false);
      
      if (response.data.success) {
        toast.success('Video consultation request sent to lawyer');
        // Show a confirmation message to the client
        setSuccess(true);
        setError(null);
      } else {
        toast.error(response.data.message || 'Failed to send consultation request');
        setError(response.data.message || 'Failed to send consultation request');
      }
    })
    .catch(error => {
      toast.dismiss();
      setIsVideoCallLoading(false);
      console.error('Error sending consultation request:', error);
      
      // Log more detailed error information
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
      
      if (error.response && error.response.status === 401) {
        toast.error('Authentication error. Please log in again.');
        sessionStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Error sending consultation request. Please try again.');
        setError('Error sending consultation request. Please try again.');
      }
    });
  };

  // Temporary workaround to prevent 404 errors
  useEffect(() => {
    // Only attempt to fetch if the backend route is ready
    const isBackendReady = false; // Set this to true when your backend route is ready
    
    if (isBackendReady) {
      const fetchMyConsultationRequests = async () => {
        if (!user?._id) return;
        
        try {
          setIsLoadingConsultations(true);
          const token = sessionStorage.getItem('token');
          
          if (!token) {
            console.error("No authentication token found");
            return;
          }
          
          console.log("Fetching consultation requests for client:", user._id);
          console.log("Using token:", token.substring(0, 10) + "...");
          
          const response = await axios.get(
            `http://localhost:5000/api/consultations/client/${user._id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          console.log("Consultation requests response:", response.data);
          
          if (response.data.success) {
            // Filter to only show consultations with this lawyer
            const filteredRequests = response.data.consultationRequests.filter(
              req => req.lawyerId === lawyerId
            );
            setMyConsultationRequests(filteredRequests);
          }
        } catch (error) {
          console.error("Error fetching consultation requests:", error);
          
          // Add more detailed error logging
          if (error.response) {
            console.error("Error status:", error.response.status);
            console.error("Error data:", error.response.data);
            
            if (error.response.status === 404) {
              console.error("Endpoint not found. Check if the route is registered correctly in your backend.");
            } else if (error.response.status === 401) {
              console.error("Authentication error. Token may be invalid or expired.");
              // Optionally redirect to login
              // navigate('/login');
            }
          }
        } finally {
          setIsLoadingConsultations(false);
        }
      };
      
      fetchMyConsultationRequests();
      
      // Set up polling to check for updates every 30 seconds
      const intervalId = setInterval(fetchMyConsultationRequests, 30000);
      
      return () => clearInterval(intervalId);
    } else {
      // Set empty array to prevent errors
      setMyConsultationRequests([]);
      setIsLoadingConsultations(false);
    }
  }, [user?._id, lawyerId]);

  const handleStartVideoCall = (consultationRequest) => {
    const { roomName } = consultationRequest;
    
    // Create URL with encoded parameters for external video service
    const clientName = encodeURIComponent(
      user?.fullName || 
      user?.name || 
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
          isLawyer: false,
          clientName: clientName,
          lawyerName: consultationRequest.lawyerName,
          autoJoin: true
        }
      });
    }
  };

  return (
    <>
      <div className="page-container">
        <Navbar />
        <ClientSidebar onToggle={setIsSidebarCollapsed} />
        <div className={`main-content ${isSidebarCollapsed ? '' : 'sidebar-expanded'}`}>
          <div className="appointment-container">
            <h2>Book Appointment with {lawyerDetails?.fullname}</h2>

            {/* Add Video Call Button - Only show if lawyer has accepted an appointment */}
            {lawyerDetails && hasAcceptedAppointment && (
              <div className="video-call-section">
                <button 
                  className="video-call-button"
                  onClick={handleVideoCall}
                  disabled={isVideoCallLoading}
                >
                  <i className="fas fa-video"></i>
                  {isVideoCallLoading ? 'Sending Video Consultation Request...' : 'Request Video Consultation'}
                </button>
                <p className="video-call-info">
                  Connect instantly with {lawyerDetails.fullname} via video call for quick consultation
                </p>
              </div>
            )}

            {/* Show message if no accepted appointments yet */}
            {lawyerDetails && !hasAcceptedAppointment && (
              <div className="video-call-info-message">
                <p>
                  <i className="fas fa-info-circle"></i> 
                  Video consultation will be available after the lawyer accepts your appointment
                </p>
              </div>
            )}

            <div className="appointment-grid">
              {/* Left Side */}
              <div className="left-section">
                {/* Consultation Type Selection */}
                <div className="consultation-type-section">
                  <h3>Select Consultation Type</h3>
                  <div className="consultation-buttons">
                    <button
                      className={`consultation-btn ${appointmentType === 'inPerson' ? 'active' : ''}`}
                      onClick={() => handleAppointmentTypeChange('inPerson')}
                    >
                      <i className="fas fa-user"></i>
                      Face to Face Consultation
                    </button>
                    <button
                      className={`consultation-btn ${appointmentType === 'videoCall' ? 'active' : ''}`}
                      onClick={() => handleAppointmentTypeChange('videoCall')}
                    >
                      <i className="fas fa-video"></i>
                      Video Call Consultation
                    </button>
                  </div>
                </div>

                {/* Calendar Section */}
                <div className="calendar-section">
                  <h3>Select Date</h3>
                  <Calendar
                    onChange={handleDateChange}
                    value={selectedDate}
                    minDate={new Date()}
                    className="custom-calendar"
                    tileDisabled={({ date }) => date.getDay() === 0 || date.getDay() === 6}
                  />
                </div>

                {/* Time Slots Section */}
                {selectedDate && (
                  <div className="time-slots-section">
                    <h3>Available Time Slots</h3>
                    {isLoading ? (
                      <div className="loading-spinner">Loading available slots...</div>
                    ) : (
                      <div className="time-slots-container">
                        {appointmentType === 'inPerson' ? (
                          availableTimeSlots.length > 0 ? (
                            <div className="time-slots-grid">
                              {availableTimeSlots.map((slot) => (
                                <button
                                  key={slot}
                                  className={`time-slot ${selectedTimeSlot === slot ? 'selected' : ''}`}
                                  onClick={() => handleTimeSlotSelect(slot)}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="no-slots">No face-to-face consultation slots available</p>
                          )
                        ) : (
                          videoCallTimeSlots.length > 0 ? (
                            <div className="time-slots-grid">
                              {videoCallTimeSlots.map((slot) => (
                                <button
                                  key={slot}
                                  className={`time-slot ${selectedTimeSlot === slot ? 'selected' : ''}`}
                                  onClick={() => handleTimeSlotSelect(slot)}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="no-slots">No video call consultation slots available</p>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Video Consultation Requests Section */}
                {myConsultationRequests.length > 0 && (
                  <div className="consultation-requests-section">
                    <h3>Your Video Consultation Requests</h3>
                    
                    {isLoadingConsultations ? (
                      <div className="loading-spinner">Loading your consultation requests...</div>
                    ) : (
                      <div className="consultation-list">
                        {myConsultationRequests.map(request => (
                          <div key={request._id} className={`consultation-item ${request.status}`}>
                            <div className="consultation-details">
                              <p className="request-time">
                                Requested on: {new Date(request.createdAt).toLocaleString()}
                              </p>
                              <p className="request-message">{request.message}</p>
                              <p className="request-status">Status: {request.status}</p>
                              
                              {request.scheduledTime && (
                                <p className="scheduled-time">
                                  Scheduled for: {new Date(request.scheduledTime).toLocaleString()}
                                </p>
                              )}
                            </div>
                            
                            {request.status === 'accepted' && (
                              <button 
                                className="start-call-btn"
                                onClick={() => handleStartVideoCall(request)}
                              >
                                <i className="fas fa-video"></i> Start Video Call
                              </button>
                            )}
                            
                            {request.status === 'pending' && (
                              <p className="pending-message">Waiting for lawyer to accept your request</p>
                            )}
                            
                            {request.status === 'declined' && (
                              <p className="declined-message">Lawyer has declined this request</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Side - Booking Form */}
              <div className="right-section">
                <div className="appointment-form-section">
                  <h3>Your Information</h3>
                  <form onSubmit={handleSubmit}>
                    {selectedTimeSlot && (
                      <div className="selected-slot-summary">
                        <p><strong>Selected Consultation:</strong> {appointmentType === 'inPerson' ? 'Face to Face' : 'Video Call'}</p>
                        <p><strong>Date:</strong> {selectedDate.toLocaleDateString()}</p>
                        <p><strong>Time:</strong> {selectedTimeSlot}</p>
                      </div>
                    )}

                    <div className="form-group">
                      <label>Name <span className="required">*</span></label>
                      <div className="info-display">
                        {formData.clientName || "Not available"}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Email <span className="required">*</span></label>
                      <div className="info-display">
                        {formData.clientEmail || "Not available"}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Phone <span className="required">*</span></label>
                      <div className="info-display">
                        {formData.clientPhone || "Not available"}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Notes <span className="optional">(Optional)</span></label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Add any additional notes or specific concerns..."
                        maxLength={500}
                        className={validationErrors.notes ? "error" : ""}
                      />
                      <small className="char-count">
                        {formData.notes.length}/500 characters
                      </small>
                      {validationErrors.notes && (
                        <span className="error-text">{validationErrors.notes}</span>
                      )}
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {success && (
                      <div className="success-message">
                        Appointment booked successfully!
                      </div>
                    )}

                    <button
                      type="submit"
                      className="submit-button"
                      disabled={!selectedDate || !selectedTimeSlot || isLoading || !formData.clientName || !formData.clientEmail || !formData.clientPhone}
                    >
                      {isLoading ? 'Booking...' : 'Book Appointment'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>

      {showStatusPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="popup-header">
              <h3>My Bookings</h3>
              <button 
                className="close-button"
                onClick={() => setShowStatusPopup(false)}
              >
                ×
              </button>
            </div>
            <div className="popup-body">
              {isLoadingBookings ? (
                <div className="loading">Loading bookings...</div>
              ) : myBookings.length > 0 ? (
                <div className="bookings-list">
                  {myBookings.map((booking, index) => (
                    <div key={index} className="booking-card">
                      <div className="booking-header">
                        <span className="booking-date">
                          {new Date(booking.appointmentDate).toLocaleDateString()}
                        </span>
                        <span 
                          className="booking-status"
                          style={{ backgroundColor: getStatusColor(booking.status) }}
                        >
                          {booking.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="booking-details">
                        <p><strong>Time:</strong> {booking.appointmentTime}</p>
                        <p><strong>Lawyer:</strong> {booking.lawyerName}</p>
                        {booking.notes && <p><strong>Notes:</strong> {booking.notes}</p>}
                        {booking.rescheduleRequest?.requested && (
                          <div className="reschedule-status">
                            <p>
                              <strong>Reschedule Status:</strong>
                              <span className={`status-badge ${booking.rescheduleRequest.status || 'pending'}`}>
                                {booking.rescheduleRequest.status ? 
                                  booking.rescheduleRequest.status.toUpperCase() : 
                                  'PENDING'}
                              </span>
                            </p>
                            {booking.rescheduleRequest.status === 'pending' && (
                              <>
                                <p><strong>Proposed Date:</strong> {new Date(booking.rescheduleRequest.proposedDate).toLocaleDateString()}</p>
                                <p><strong>Proposed Time:</strong> {booking.rescheduleRequest.proposedTime}</p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {booking.status === 'confirmed' && !booking.rescheduleRequest?.requested && (
                        <button
                          onClick={() => handleRescheduleRequest(booking)}
                          className="reschedule-btn"
                        >
                          Request Reschedule
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-bookings">No bookings found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {!showStatusPopup && (
        <div 
          className="status-button-container"
          onMouseEnter={() => setShowStatusButton(true)}
          onMouseLeave={() => setShowStatusButton(false)}
        >
          <button 
            className={`status-button ${showStatusButton ? 'visible' : ''}`}
            onClick={() => setShowStatusPopup(true)}
          >
            <div className="button-content">
              {hasNotification && (
                <span className={`notification-dot ${notificationStatus}`}></span>
              )}
              <span className="clipboard-icon">📋</span>
            </div>
          </button>
        </div>
      )}

      {showRescheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Request Appointment Reschedule</h3>
            <div className="form-group">
              <label>Reason for Reschedule *</label>
              <textarea
                value={rescheduleData.reason}
                onChange={(e) => setRescheduleData({
                  ...rescheduleData,
                  reason: e.target.value
                })}
                required
              />
            </div>
            <div className="form-group">
              <label>Proposed Date *</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setRescheduleData({
                  ...rescheduleData,
                  proposedDate: e.target.value
                })}
                required
              />
            </div>
            <div className="form-group">
              <label>Proposed Time *</label>
              <input
                type="time"
                onChange={(e) => setRescheduleData({
                  ...rescheduleData,
                  proposedTime: e.target.value
                })}
                required
              />
            </div>
            <div className="modal-actions">
              <button onClick={handleRescheduleSubmit}>Submit Request</button>
              <button onClick={() => setShowRescheduleModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

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

        .appointment-container {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 2rem;
          background: white;
          border-radius: 15px;
          box-shadow: 0 0 20px rgba(0,0,0,0.05);
        }

        .appointment-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-top: 2rem;
        }

        .consultation-type-section {
          margin-bottom: 2rem;
        }

        .consultation-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .consultation-btn {
          flex: 1;
          padding: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .consultation-btn.active {
          border-color: #2563eb;
          background: #2563eb;
          color: white;
        }

        .calendar-section {
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 10px;
          border: 1px solid #e9ecef;
        }

        .appointment-form-section {
          padding: 1.5rem;
          background: #fff;
          border-radius: 10px;
          border: 1px solid #e9ecef;
        }

        .time-slots-section {
          margin-top: 1.5rem;
        }

        .time-slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .custom-calendar {
          width: 100%;
          max-width: none;
          border: none;
          background: white;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        @media (max-width: 768px) {
          .appointment-grid {
            grid-template-columns: 1fr;
          }

          .appointment-container {
            margin: 1rem;
            padding: 1rem;
          }
        }

        .time-slot {
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .time-slot:hover {
          border-color: #2563eb;
        }

        .time-slot.selected {
          background: #2563eb;
          color: white;
          border-color: #2563eb;
        }

        .selected-slot-summary {
          background: #f8fafc;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          border: 1px solid #e2e8f0;
        }

        .selected-slot-summary p {
          margin: 0.5rem 0;
        }

        .form-group {
          margin-bottom: 1.5rem;
          position: relative;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          transition: border-color 0.2s;
          height: 42px;
          font-size: 14px;
        }

        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          transition: border-color 0.2s;
          resize: vertical;
          min-height: 100px;
          max-height: 200px;
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        .error-message {
          color: #dc2626;
          background-color: #fee2e2;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .success-message {
          color: #059669;
          background-color: #d1fae5;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .submit-button {
          width: 100%;
          padding: 0.75rem;
          background-color: #2563eb;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .submit-button:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
        }

        .submit-button:hover:not(:disabled) {
          background-color: #1d4ed8;
        }

        .error {
          border-color: #dc3545;
        }

        .error-text {
          color: #dc3545;
          font-size: 0.875rem;
          margin-top: 0.25rem;
          display: block;
        }

        .date-info {
          margin-bottom: 1rem;
          font-weight: 500;
          color: #333;
        }

        .availability-status {
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          text-align: center;
          font-weight: 500;
        }

        .availability-status.available {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .availability-status.unavailable {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .select-date-message {
          text-align: center;
          color: #666;
          padding: 1rem;
          background-color: #f8f9fa;
          border-radius: 4px;
        }

        .loading-spinner {
          text-align: center;
          color: #666;
          padding: 1rem;
        }

        .status-button-container {
          position: fixed;
          right: 20px;
          top: 100px;
          transform: none;
          padding: 10px;
          z-index: 100;
          display: flex;
          align-items: center;
          transition: all 0.3s ease;
        }

        .status-button {
          position: relative;
          width: 50px;
          height: 50px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
          opacity: 0;
          transform: translateX(100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        .status-button.visible {
          opacity: 1;
          transform: translateX(0);
        }

        .status-button:hover {
          background-color: #0056b3;
          transform: translateX(0) scale(1.1);
          width: auto;
          height: auto;
          border-radius: 25px;
          padding: 10px 20px;
        }

        .status-button:hover::before {
          content: "Check Booking Status";
          white-space: nowrap;
          font-size: 14px;
        }

        .status-button::before {
          content: "📋";
          font-size: 20px;
        }

        .button-content {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .clipboard-icon {
          font-size: 20px;
        }

        .notification-dot {
          position: absolute;
          top: -10px;
          right: -10px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 0 2px #fff;
          z-index: 1;
        }

        .notification-dot.confirmed {
          background-color: #28a745;
        }

        .notification-dot.cancelled {
          background-color: #dc3545;
        }

        .notification-dot.pending {
          background-color: #ffc107;
        }

        @media (max-width: 768px) {
          .status-button-container {
            right: 10px;
            top: 90px;
          }

          .status-button {
            width: 40px;
            height: 40px;
          }

          .status-button::before {
            font-size: 16px;
          }

          .status-button:hover {
            padding: 8px 16px;
          }
        }

        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }

        .popup-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.3s ease;
        }

        .popup-header {
          padding: 1rem;
          border-bottom: 1px solid #dee2e6;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .popup-header h3 {
          margin: 0;
          color: #333;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .close-button:hover {
          background-color: #f0f0f0;
          color: #333;
        }

        .popup-body {
          padding: 1rem;
          overflow-y: auto;
        }

        .bookings-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .booking-card {
          border: 1px solid #dee2e6;
          border-radius: 6px;
          padding: 1rem;
          transition: all 0.2s;
        }

        .booking-card:hover {
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .booking-date {
          font-weight: 500;
          color: #495057;
        }

        .booking-status {
          padding: 4px 8px;
          border-radius: 4px;
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .booking-details {
          color: #666;
        }

        .booking-details p {
          margin: 0.25rem 0;
        }

        .loading, .no-bookings {
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
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

        .reschedule-btn {
          background-color: #6c757d;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 10px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 20px;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .modal-actions button {
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .modal-actions button:first-child {
          background-color: #007bff;
          color: white;
          border: none;
        }

        .modal-actions button:last-child {
          background-color: #6c757d;
          color: white;
          border: none;
        }

        .reschedule-status {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #eee;
        }

        .status-badge.pending {
          background-color: #ffc107;
        }

        .status-badge.approved {
          background-color: #28a745;
        }

        .status-badge.rejected {
          background-color: #dc3545;
        }

        .required {
          color: #dc3545;
          margin-left: 4px;
        }

        .optional {
          color: #6c757d;
          font-size: 0.875rem;
          margin-left: 4px;
        }

        .char-count {
          display: block;
          text-align: right;
          color: #6c757d;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }

        .form-group input.error,
        .form-group textarea.error {
          border-color: #dc3545;
          background-color: #fff8f8;
        }

        .form-group input.error:focus,
        .form-group textarea.error:focus {
          box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
        }

        .info-display {
          padding: 0.75rem;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          color: #4a5568;
          font-size: 0.95rem;
        }

        .info-display:empty::before {
          content: "Not available";
          color: #6c757d;
          font-style: italic;
        }

        .form-group input[type="tel"] {
          width: 100%;
          padding: 12px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
          background-color: #fff;
        }

        .form-group input[type="tel"]:focus {
          outline: none;
          border-color: #1a237e;
          box-shadow: 0 0 0 2px rgba(26, 35, 126, 0.1);
        }

        .form-group input[type="tel"].error {
          border-color: #dc3545;
          background-color: #fff8f8;
        }

        .form-group input[type="tel"].error:focus {
          box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.1);
        }

        .form-group input[type="tel"]::placeholder {
          color: #6c757d;
          font-size: 0.9rem;
        }

        .appointment-type-selector {
          margin-bottom: 2rem;
        }
        
        .appointment-type-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
        }
        
        .appointment-type-btn {
          padding: 0.75rem 1rem;
          border: 1px solid #e5e7eb;
          background-color: #f9fafb;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          flex: 1;
        }
        
        .appointment-type-btn:hover {
          background-color: #f3f4f6;
        }
        
        .appointment-type-btn.active {
          background-color: #2563eb;
          color: white;
          border-color: #2563eb;
        }

        .time-slots-container {
          margin-bottom: 2rem;
        }
        
        .no-slots-message {
          text-align: center;
          color: #666;
          padding: 1rem;
          background-color: #f8f9fa;
          border-radius: 4px;
        }

        .info-text {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 1rem;
          padding: 0.5rem;
          background-color: #f8f9fa;
          border-left: 3px solid #2563eb;
          border-radius: 4px;
        }

        .consultation-type-section {
          margin-bottom: 2rem;
        }

        .consultation-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .consultation-btn {
          flex: 1;
          padding: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .consultation-btn.active {
          border-color: #2563eb;
          background: #2563eb;
          color: white;
        }

        .booking-form {
          margin-top: 2rem;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }

        .form-summary {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 6px;
        }

        .video-call-section {
          margin: 1.5rem 0;
          padding: 1.5rem;
          background: #f0f7ff;
          border-radius: 10px;
          border: 1px solid #cce5ff;
          text-align: center;
        }

        .video-call-button {
          padding: 0.75rem 1.5rem;
          background-color: #9C27B0;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
        }

        .video-call-button:hover:not(:disabled) {
          background-color: #7B1FA2;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .video-call-button:disabled {
          background-color: #D1C4E9;
          cursor: not-allowed;
        }

        .video-call-button i {
          font-size: 1.2rem;
        }

        .video-call-info {
          margin-top: 0.75rem;
          color: #555;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .video-call-section {
            padding: 1rem;
          }
          
          .video-call-button {
            width: 100%;
            justify-content: center;
          }
        }

        .consultation-requests-section {
          margin: 2rem 0;
          padding: 1.5rem;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .consultation-requests-section h3 {
          margin-bottom: 1rem;
          color: #333;
          font-size: 1.25rem;
        }
        
        .consultation-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .consultation-item {
          padding: 1rem;
          border-radius: 6px;
          border-left: 4px solid #ccc;
          background-color: #f9f9f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .consultation-item.pending {
          border-left-color: #f0ad4e;
          background-color: #fff9f0;
        }
        
        .consultation-item.accepted {
          border-left-color: #5cb85c;
          background-color: #f0fff0;
        }
        
        .consultation-item.declined {
          border-left-color: #d9534f;
          background-color: #fff0f0;
          opacity: 0.8;
        }
        
        .consultation-details {
          flex: 1;
        }
        
        .request-time {
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 0.5rem;
        }
        
        .request-message {
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }
        
        .request-status {
          font-weight: 600;
          text-transform: capitalize;
        }
        
        .scheduled-time {
          margin-top: 0.5rem;
          font-weight: 600;
          color: #5cb85c;
        }
        
        .start-call-btn {
          background-color: #9C27B0;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 0.75rem 1.25rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .start-call-btn:hover {
          background-color: #7B1FA2;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .pending-message {
          color: #f0ad4e;
          font-style: italic;
          padding: 0.5rem 1rem;
        }
        
        .declined-message {
          color: #d9534f;
          font-style: italic;
          padding: 0.5rem 1rem;
        }
        
        @media (max-width: 768px) {
          .consultation-item {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .start-call-btn {
            margin-top: 1rem;
            width: 100%;
            justify-content: center;
          }
        }

        .video-call-info-message {
          margin: 1.5rem 0;
          padding: 1.5rem;
          background: #f0f7ff;
          border-radius: 10px;
          border: 1px solid #cce5ff;
          text-align: center;
        }

        .video-call-info-message p {
          margin: 0;
          color: #555;
          font-size: 0.9rem;
        }
      `}</style>
    </>
  );
};

export default LawyerAppointment;
