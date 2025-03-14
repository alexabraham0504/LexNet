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
import { FaCalendar, FaTimes } from 'react-icons/fa';

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
  const [rescheduleBookingId, setRescheduleBookingId] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
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

  // Load Razorpay script
  const loadRazorpayScript = async () => {
    const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
    if (!res) {
      setPaymentError('Razorpay SDK failed to load. Please check your internet connection.');
      return false;
    }
    return true;
  };

  // Handle payment initiation
  const initiatePayment = async (appointmentId) => {
    try {
      setIsPaymentLoading(true);
      
      console.log("Initiating payment for appointment:", appointmentId);
      
      // Create order on the server
      const orderResponse = await axios.post(
        "http://localhost:5000/api/payments/create-order",
        { appointmentId: appointmentId }
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
        key: "rzp_test_bD1Alu6Su7sKSO", // Use your Razorpay key
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Lex Net Legal Services",
        description: `Appointment with ${orderData.lawyerName}`,
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
              setSuccess(true);
              toast.success("Payment successful! Appointment booked.");
              
              // Reset form
              setFormData({
                ...formData,
                notes: "",
              });
              setSelectedTimeSlot(null);
              setSelectedDate(null);
              
              // Fetch updated bookings
              fetchMyBookings();
            } else {
              setPaymentError("Payment verification failed. Please contact support.");
              
              // Cancel the appointment since payment failed
              await axios.put(
                `http://localhost:5000/api/appointments/${appointmentId}/cancel`
              );
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            setPaymentError("Payment verification failed. Please contact support.");
            
            // Cancel the appointment since payment failed
            await axios.put(
              `http://localhost:5000/api/appointments/${appointmentId}/cancel`
            );
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
          ondismiss: async function() {
            setIsPaymentLoading(false);
            setPaymentError("Payment cancelled. Appointment not confirmed.");
            
            // Cancel the appointment since payment was cancelled
            await axios.put(
              `http://localhost:5000/api/appointments/${appointmentId}/cancel`
            );
          }
        }
      };
      
      // Create Razorpay instance and open payment modal
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
      // Handle payment modal close
      razorpay.on('payment.failed', async function (response) {
        setPaymentError(`Payment failed: ${response.error.description}`);
        setIsPaymentLoading(false);
        
        // Cancel the appointment since payment failed
        await axios.put(
          `http://localhost:5000/api/appointments/${appointmentId}/cancel`
        );
      });
      
    } catch (error) {
      console.error("Payment initiation error:", error);
      setPaymentError(error.response?.data?.message || error.message || "Failed to initiate payment");
      setIsPaymentLoading(false);
    }
  };

  // Update handleSubmit to initiate payment
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      setPaymentError(null);
      
      // Format the date for the API
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      // Validate all required fields
      if (!selectedDate || !selectedTimeSlot || !formData.clientName || !formData.clientEmail || !formData.clientPhone) {
        setError("Please fill in all required fields");
        setIsLoading(false);
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

      console.log("Appointment creation response:", response.data);

      if (response.data) {
        // Try different ways to extract the appointment ID
        let appointmentId = null;
        
        // Check all possible locations of the ID in the response
        if (response.data._id) {
          appointmentId = response.data._id;
        } else if (response.data.appointmentId) {
          appointmentId = response.data.appointmentId;
        } else if (response.data.appointment && response.data.appointment._id) {
          appointmentId = response.data.appointment._id;
        } else if (response.data.data && response.data.data._id) {
          appointmentId = response.data.data._id;
        } else if (response.data.id) {
          appointmentId = response.data.id;
        }
        
        if (!appointmentId) {
          console.error("Could not find appointment ID in response:", response.data);
          throw new Error('No appointment ID returned from server');
        }
        
        console.log("Successfully extracted appointment ID:", appointmentId);
        
        // Initiate payment process
        await initiatePayment(appointmentId);
        
      } else {
        setError('Error booking appointment: No response data');
      }
    } catch (error) {
      console.error('Error in appointment booking:', error);
      setError(error.message || 'Error booking appointment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    try {
      setIsLoadingBookings(true);
      const clientEmail = localStorage.getItem("userEmail") || sessionStorage.getItem("email");
      const response = await axios.get(
        `http://localhost:5000/api/appointments/client/${clientEmail}`
      );

      // Fetch lawyer details for each booking if not already included
      const bookingsWithLawyerDetails = await Promise.all(
        response.data.appointments.map(async (booking) => {
          if (!booking.lawyerName || !booking.lawyerSpecialization) {
            try {
              const lawyerResponse = await axios.get(
                `http://localhost:5000/api/lawyers/${booking.lawyerId}`
              );
              return {
                ...booking,
                lawyerName: lawyerResponse.data.fullname,
                lawyerSpecialization: lawyerResponse.data.specialization
              };
            } catch (error) {
              console.error("Error fetching lawyer details:", error);
              return booking;
            }
          }
          return booking;
        })
      );

      setMyBookings(bookingsWithLawyerDetails);
      
      // Check if there's at least one confirmed appointment with this lawyer
      const hasConfirmed = bookingsWithLawyerDetails.some(
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

  // Add the handleVideoCall function
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
    toast.loading("Initiating video call...");
    setIsVideoCallLoading(true);

    // Get token from sessionStorage
    const token = sessionStorage.getItem('token');
    
    if (!token) {
      toast.dismiss();
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
      lawyerName: lawyerDetails?.fullName || 'Lawyer',
      status: 'pending'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      toast.dismiss();
      setIsVideoCallLoading(false);
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
              lawyerName: lawyerDetails?.fullName || 'Lawyer',
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
      toast.dismiss();
      setIsVideoCallLoading(false);
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

  // Add these function definitions to your component

  // Add this near your other handler functions
  const handleCancelBooking = async (bookingId) => {
    try {
      setIsLoading(true);
      const response = await axios.put(
        `http://localhost:5000/api/appointments/${bookingId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`
          }
        }
      );
      
      if (response.status === 200) {
        toast.success("Booking cancelled successfully");
        // Update the booking status in the local state
        setMyBookings(prevBookings => 
          prevBookings.map(booking => 
            booking._id === bookingId 
              ? { ...booking, status: 'cancelled' } 
              : booking
          )
        );
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error(error.response?.data?.message || "Failed to cancel booking");
    } finally {
      setIsLoading(false);
    }
  };

  // Add this near your other handler functions
  const handleRescheduleClick = (bookingId) => {
    // Find the booking to reschedule
    const bookingToReschedule = myBookings.find(booking => booking._id === bookingId);
    if (bookingToReschedule) {
      // Make sure we're storing the complete booking object with all properties
      setSelectedAppointment(bookingToReschedule);
      setRescheduleBookingId(bookingId);
      setShowRescheduleModal(true);
      
      // Log to verify the appointment type is being captured
      console.log("Selected appointment type:", bookingToReschedule.appointmentType);
    } else {
      toast.error("Booking not found");
    }
  };

  // Add a function to fetch receipt details
  const fetchReceiptDetails = async (paymentId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/payments/receipt/${paymentId}`
      );
      
      if (response.data.success) {
        setReceiptData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching receipt:", error);
    }
  };

  return (
    <>
      <div className="page-container">
        <Navbar />
        <ClientSidebar onToggle={setIsSidebarCollapsed} />
        <div className={`main-content ${isSidebarCollapsed ? '' : 'sidebar-expanded'}`}>
          <div className="appointment-container">
            <div className="appointment-header">
              <h1>Book Appointment with {lawyerDetails?.fullName}</h1>
            </div>

            <div className="video-consultation-section">
              <button 
                className="video-consultation-button"
                onClick={handleVideoCall}
                disabled={isVideoCallLoading || !hasAcceptedAppointment}
              >
                <i className="fas fa-video"></i>
                {isVideoCallLoading ? 'Sending Request...' : 'Request Video Consultation'}
              </button>
              
              <p className="video-consultation-info">
                Connect instantly with {lawyerDetails?.fullName} via secure video call for quick consultation
              </p>
              
              <div className="connection-status">
                <span className="status-dot"></span>
                <span className="status-text">Ready for video consultation</span>
              </div>
            </div>

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
                      className={`btn btn-primary btn-block ${isLoading || isPaymentLoading ? 'btn-loading' : ''}`}
                      disabled={isLoading || isPaymentLoading}
                    >
                      {isLoading ? (
                        <span><i className="fas fa-spinner fa-spin"></i> Processing...</span>
                      ) : isPaymentLoading ? (
                        <span><i className="fas fa-spinner fa-spin"></i> Processing Payment...</span>
                      ) : (
                        'Book Appointment'
                      )}
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
                  {myBookings.map((booking) => (
                    <div 
                      key={booking._id} 
                      className={`booking-card ${booking.status.toLowerCase()}`}
                    >
                      <div className="booking-header">
                        <div className="booking-date">
                          <i className="far fa-calendar-alt calendar-icon"></i>
                          {new Date(booking.appointmentDate).toLocaleDateString()}
                      </div>
                        <div className={`status-badge ${booking.status.toLowerCase()}`}>
                          {booking.status === 'confirmed' && <i className="fas fa-check-circle"></i>}
                          {booking.status === 'pending' && <i className="fas fa-clock"></i>}
                          {booking.status === 'cancelled' && <i className="fas fa-times-circle"></i>}
                          <span>{booking.status}</span>
                        </div>
                      </div>
                      
                      <div className="lawyer-details">
                        <div className="lawyer-info">
                          <div className="lawyer-avatar">
                            <i className="fas fa-user-tie"></i>
                          </div>
                          <div className="lawyer-text">
                            <h4 className="lawyer-name">
                              {booking.lawyerId.fullName}
                            </h4>
                            <p className="lawyer-specialization">
                              <i className="fas fa-gavel"></i>
                              {booking.lawyerId.specialization}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="consultation-type">
                        <div className="type-icon">
                          {booking.appointmentType === 'videoCall' ? (
                            <i className="fas fa-video"></i>
                          ) : (
                            <i className="fas fa-handshake"></i>
                        )}
                      </div>
                        <div className="type-details">
                          <span className="type-label">Consultation Type:</span>
                          <span className="type-text">
                            {booking.appointmentType === 'videoCall' ? 'Video Call Consultation' : 'Face to Face Consultation'}
                          </span>
                        </div>
                      </div>

                      <div className="booking-time">
                        <div className="time-icon">
                          <i className="far fa-clock"></i>
                        </div>
                        <div className="time-details">
                          <span className="time-label">Scheduled Time:</span>
                          <span className="time-value">{booking.appointmentTime}</span>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="booking-notes">
                          <div className="notes-icon">
                            <i className="far fa-sticky-note"></i>
                          </div>
                          <div className="notes-content">
                            <span className="notes-label">Notes:</span>
                            <p className="notes-text">{booking.notes}</p>
                          </div>
                        </div>
                      )}

                      {/* Add or restore the reschedule button in the booking card */}
                      <div className="booking-actions">
                        {booking.status !== "cancelled" && (
                          <div className="booking-actions">
                            {booking.status === "pending" && (
                        <button
                                className="action-button cancel-btn"
                                onClick={() => handleCancelBooking(booking._id)}
                        >
                                <FaTimes />
                                <span>Cancel</span>
                        </button>
                      )}
                            {booking.status === "confirmed" && !booking.rescheduleRequest.requested && (
                              <button
                                className="action-button reschedule-btn"
                                onClick={() => handleRescheduleClick(booking._id)}
                              >
                                <FaCalendar />
                                <span>Reschedule</span>
                              </button>
                            )}
                            {booking.rescheduleRequest.requested && booking.rescheduleRequest.status === null && (
                              <span className="reschedule-pending">Reschedule request pending</span>
                            )}
                          </div>
                        )}
                      </div>
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
          <div className="reschedule-request-container">
            <div className="reschedule-header">
              <h3>
                <i className="fas fa-calendar-alt"></i>
                Request Appointment Reschedule with
                <span className="lawyer-name">{selectedAppointment?.lawyerId?.fullName}</span>
              </h3>
            </div>
            
            <form className="reschedule-form" onSubmit={handleRescheduleSubmit}>
              <div className="form-row reason-row">
                <label htmlFor="reschedule-reason">
                  <i className="fas fa-comment-alt"></i>
                  Reason for Reschedule
                </label>
              <textarea
                  id="reschedule-reason"
                value={rescheduleData.reason}
                  onChange={(e) => setRescheduleData({...rescheduleData, reason: e.target.value})}
                  placeholder="Please explain why you need to reschedule this appointment"
                required
                ></textarea>
            </div>
              
              <div className="form-row">
                <label>
                  <i className="fas fa-handshake"></i>
                  Consultation Type
                </label>
                <div className="consultation-type-display">
                  {selectedAppointment && selectedAppointment.appointmentType === 'videoCall' 
                    ? 'Video Call Consultation' 
                    : 'Face to Face Consultation'}
                </div>
              </div>
              
              <div className="form-row">
                <label htmlFor="proposed-date">
                  <i className="fas fa-calendar"></i>
                  Proposed Date
                </label>
                <div className="date-input">
              <input
                    id="proposed-date"
                type="date"
                    value={rescheduleData.proposedDate || ''}
                    onChange={(e) => setRescheduleData({...rescheduleData, proposedDate: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                required
              />
                  <i className="fas fa-calendar-day"></i>
            </div>
              </div>
              
              <div className="form-row">
                <label htmlFor="proposed-time">
                  <i className="fas fa-clock"></i>
                  Proposed Time
                </label>
                <div className="time-input">
              <input
                    id="proposed-time"
                type="time"
                    value={rescheduleData.proposedTime}
                    onChange={(e) => setRescheduleData({...rescheduleData, proposedTime: e.target.value})}
                required
              />
                  <i className="fas fa-hourglass-half"></i>
            </div>
            </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="form-button cancel-button"
                  onClick={() => setShowRescheduleModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="form-button submit-button"
                  disabled={isLoading}
                >
                  {isLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
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
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.25rem;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          border-left: 5px solid #e2e8f0;
          transition: all 0.3s ease;
        }

        .booking-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          background: linear-gradient(to right, rgba(255,255,255,0.1), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }

        .booking-card:hover::before {
          transform: translateX(100%);
        }

        .booking-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }

        .booking-card.pending {
          border-left-color: #FF9800;
          background: linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 167, 38, 0.05));
        }

        .booking-card.confirmed {
          border-left-color: #4CAF50;
          background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(102, 187, 106, 0.05));
        }

        .booking-card.cancelled {
          border-left-color: #F44336;
          background: linear-gradient(135deg, rgba(244, 67, 54, 0.1), rgba(239, 83, 80, 0.05));
        }

        .status-badge {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: capitalize;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .status-badge.pending {
          background: #fff7ed;
          color: #c2410c;
          border: 1px solid #fed7aa;
        }

        .status-badge.confirmed {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }

        .status-badge.cancelled {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .lawyer-details {
          margin: 1.25rem 0;
          padding: 1rem;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(0, 0, 0, 0.05);
          backdrop-filter: blur(8px);
          transition: all 0.3s ease;
        }

        .lawyer-details:hover {
          background: rgba(255, 255, 255, 0.95);
          transform: translateX(5px);
        }

        .lawyer-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .lawyer-name::before {
          content: '👨‍⚖️';
          font-size: 1.2rem;
        }

        .lawyer-specialization {
          color: #4f46e5;
          font-weight: 500;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .lawyer-specialization::before {
          content: '🔹';
          position: absolute;
          left: 0.5rem;
        }

        .lawyer-specialization i {
          color: #6366f1;
        }

        .booking-time {
          margin: 0.75rem 0;
          color: #2c3e50;
          font-size: 1.1rem;
          padding: 0.5rem 0;
        }

        .booking-notes {
          margin-top: 1rem;
          padding: 1rem;
          border-radius: 10px;
          background: #f8fafc;
          color: #64748b;
          font-size: 0.875rem;
          border: 1px dashed rgba(0, 0, 0, 0.1);
        }

        .reschedule-btn {
          margin-top: 1rem;
          padding: 0.75rem 1.25rem;
          background: linear-gradient(135deg, #6366F1, #7C3AED);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);
        }

        .reschedule-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(99, 102, 241, 0.3);
          background: linear-gradient(135deg, #5558DA, #6B2EE2);
        }

        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }

        .booking-date {
          font-size: 1.1rem;
          font-weight: 600;
          color: #2d3748;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .calendar-icon {
          color: #4f46e5;
          font-size: 1.2rem;
        }

        @media (max-width: 640px) {
          .booking-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .status-badge {
            width: 100%;
            text-align: center;
          }
        }

        /* Popup Overlay Animation */
        .popup-overlay {
          animation: fadeIn 0.3s ease;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
        }

        /* Popup Content Animation */
        .popup-content {
          animation: slideUp 0.4s ease;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          max-width: 600px;
          width: 90%;
          overflow: hidden;
        }

        /* Popup Header Styling */
        .popup-header {
          background: linear-gradient(135deg, #2c3e50, #3498db);
          padding: 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
        }

        .popup-header h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .close-button {
          background: transparent;
          border: none;
          color: white;
          font-size: 1.75rem;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: rotate(90deg);
        }

        /* Popup Body Styling */
        .popup-body {
          padding: 1.5rem;
          max-height: 70vh;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 #f7fafc;
        }

        /* Loading State */
        .loading {
          text-align: center;
          padding: 2rem;
          color: #64748b;
          font-size: 1.1rem;
          animation: pulse 2s infinite;
        }

        /* No Bookings State */
        .no-bookings {
          text-align: center;
          padding: 3rem 2rem;
          color: #64748b;
          font-size: 1.1rem;
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border-radius: 12px;
          border: 2px dashed #e2e8f0;
        }

        /* Scrollbar Styling */
        .popup-body::-webkit-scrollbar {
          width: 8px;
        }

        .popup-body::-webkit-scrollbar-track {
          background: #f7fafc;
        }

        .popup-body::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 4px;
        }

        .popup-body::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }

        /* Responsive Design */
        @media (max-width: 640px) {
          .popup-content {
            width: 95%;
            margin: 10px;
          }

          .booking-card {
            padding: 1rem;
          }

          .status-badge {
            width: 100%;
            text-align: center;
            margin-top: 0.5rem;
          }

          .lawyer-details {
            margin: 1rem 0;
            padding: 0.75rem;
          }
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        /* Book Appointment Section Styling */
        .appointment-header {
          background: linear-gradient(135deg, #1a365d, #2c5282);
          padding: 2rem;
          border-radius: 16px;
          margin-bottom: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          color: white;
          position: relative;
          overflow: hidden;
        }

        .appointment-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('/path-to-pattern.svg') repeat;
          opacity: 0.1;
          z-index: 1;
        }

        .appointment-header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          position: relative;
          z-index: 2;
          animation: slideInLeft 0.6s ease;
        }

        /* Video Consultation Button Section */
        .video-consultation-section {
          background: linear-gradient(135deg, #ffffff, #f8fafc);
          border-radius: 12px;
          padding: 1.5rem;
          margin: 1rem 0 2rem;
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .video-consultation-section:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
        }

        .video-consultation-button {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 50px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: fit-content;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
        }

        .video-consultation-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transform: translateX(-100%);
        }

        .video-consultation-button:hover::before {
          animation: shimmer 1.5s infinite;
        }

        .video-consultation-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
          background: linear-gradient(135deg, #4f46e5, #4338ca);
        }

        .video-consultation-button:active {
          transform: translateY(1px);
        }

        .video-consultation-button i {
          font-size: 1.2rem;
          animation: pulse 2s infinite;
        }

        .video-consultation-info {
          text-align: center;
          margin-top: 1rem;
          color: #4b5563;
          font-size: 0.95rem;
          line-height: 1.5;
          padding: 0 1rem;
        }

        /* Connection Status Indicator */
        .connection-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          justify-content: center;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #10b981;
          animation: blink 1.5s infinite;
        }

        .status-text {
          font-size: 0.9rem;
          color: #6b7280;
        }

        /* Animations */
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .appointment-header {
            padding: 1.5rem;
            text-align: center;
          }

          .appointment-header h1 {
            font-size: 2rem;
          }

          .video-consultation-button {
            width: 100%;
            justify-content: center;
          }
        }

        /* Dark Mode Support */
        @media (prefers-color-scheme: dark) {
          .video-consultation-section {
            background: linear-gradient(135deg, #1f2937, #111827);
            border-color: rgba(255, 255, 255, 0.1);
          }

          .video-consultation-info {
            color: #9ca3af;
          }

          .status-text {
            color: #9ca3af;
          }
        }

        .consultation-type {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1rem 0;
          padding: 0.75rem;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.03);
          transition: all 0.3s ease;
        }

        .type-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white;
          font-size: 1rem;
        }

        .type-text {
          font-size: 0.95rem;
          font-weight: 500;
          color: #4b5563;
        }

        .booking-card.pending .consultation-type {
          background: rgba(255, 152, 0, 0.05);
        }

        .booking-card.confirmed .consultation-type {
          background: rgba(76, 175, 80, 0.05);
        }

        .booking-card.cancelled .consultation-type {
          background: rgba(244, 67, 54, 0.05);
        }

        .booking-card.pending .type-icon {
          background: linear-gradient(135deg, #FF9800, #FFA726);
        }

        .booking-card.confirmed .type-icon {
          background: linear-gradient(135deg, #4CAF50, #66BB6A);
        }

        .booking-card.cancelled .type-icon {
          background: linear-gradient(135deg, #F44336, #EF5350);
        }

        .consultation-type:hover {
          transform: translateX(5px);
          background: rgba(0, 0, 0, 0.05);
        }

        /* Animation for icons */
        .type-icon i {
          transition: all 0.3s ease;
        }

        .consultation-type:hover .type-icon i {
          transform: scale(1.1);
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .consultation-type {
            background: rgba(255, 255, 255, 0.05);
          }

          .type-text {
            color: #e5e7eb;
          }

          .booking-card.pending .consultation-type {
            background: rgba(255, 152, 0, 0.1);
          }

          .booking-card.confirmed .consultation-type {
            background: rgba(76, 175, 80, 0.1);
          }

          .booking-card.cancelled .consultation-type {
            background: rgba(244, 67, 54, 0.1);
          }
        }

        .calendar-icon {
          margin-right: 8px;
          color: #6366f1;
        }

        .lawyer-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .lawyer-avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
          box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);
        }

        .lawyer-text {
          flex: 1;
        }

        .lawyer-name {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.1rem;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .lawyer-specialization {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .lawyer-specialization i {
          color: #818cf8;
        }

        .type-details, .time-details, .notes-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .type-label, .time-label, .notes-label {
          font-size: 0.85rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .type-text, .time-value, .notes-text {
          color: #374151;
          font-size: 1rem;
        }

        .booking-time, .booking-notes {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 0.75rem;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 8px;
          margin-top: 1rem;
        }

        .time-icon, .notes-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          margin-right: 1rem;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white;
          box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-badge i {
          font-size: 1rem;
        }

        /* Status-specific colors for icons */
        .booking-card.pending .time-icon,
        .booking-card.pending .notes-icon {
          background: linear-gradient(135deg, #FF9800, #FFA726);
        }

        .booking-card.confirmed .time-icon,
        .booking-card.confirmed .notes-icon {
          background: linear-gradient(135deg, #4CAF50, #66BB6A);
        }

        .booking-card.cancelled .time-icon,
        .booking-card.cancelled .notes-icon {
          background: linear-gradient(135deg, #F44336, #EF5350);
        }

        /* Hover effects */
        .booking-card:hover .lawyer-avatar,
        .booking-card:hover .time-icon,
        .booking-card:hover .notes-icon {
          transform: scale(1.05);
          transition: transform 0.3s ease;
        }

        /* Dark mode adjustments */
        @media (prefers-color-scheme: dark) {
          .type-text, .time-value, .notes-text {
            color: #e5e7eb;
          }

          .type-label, .time-label, .notes-label {
            color: #9ca3af;
          }

          .lawyer-name {
            color: #f3f4f6;
          }
        }

        /* Consultation Type Section Enhancement */
        .consultation-type {
          background: #ffffff;  /* Lighter background */
          padding: 1.25rem;
          border-radius: 12px;
          margin: 1.25rem 0;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .type-details {
          flex: 1;
        }

        .type-label {
          display: block;
          color: #4b5563;  /* Darker gray for better readability */
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .type-text {
          color: #111827;  /* Almost black for maximum readability */
          font-size: 1.1rem;
          font-weight: 600;
          display: block;
        }

        /* Booking Time Section Enhancement - matching styles */
        .booking-time {
          background: #ffffff;
          padding: 1.25rem;
          border-radius: 12px;
          margin: 1.25rem 0;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .time-label {
          display: block;
          color: #4b5563;
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .time-value {
          color: #111827;
          font-size: 1.1rem;
          font-weight: 600;
          display: block;
        }

        /* Status-specific background colors */
        .booking-card.pending .consultation-type,
        .booking-card.pending .booking-time {
          background: #fffbeb;  /* Light yellow background for pending */
        }

        .booking-card.confirmed .consultation-type,
        .booking-card.confirmed .booking-time {
          background: #f0fdf4;  /* Light green background for confirmed */
        }

        .booking-card.cancelled .consultation-type,
        .booking-card.cancelled .booking-time {
          background: #fef2f2;  /* Light red background for cancelled */
        }

        /* Dark mode adjustments */
        @media (prefers-color-scheme: dark) {
          .consultation-type,
          .booking-time {
            background: #1f2937;
            border-color: #374151;
          }

          .type-label,
          .time-label {
            color: #9ca3af;  /* Lighter gray in dark mode */
          }

          .type-text,
          .time-value {
            color: #ffffff;  /* White text in dark mode */
          }

          .booking-card.pending .consultation-type,
          .booking-card.pending .booking-time {
            background: rgba(255, 251, 235, 0.05);
          }

          .booking-card.confirmed .consultation-type,
          .booking-card.confirmed .booking-time {
            background: rgba(240, 253, 244, 0.05);
          }

          .booking-card.cancelled .consultation-type,
          .booking-card.cancelled .booking-time {
            background: rgba(254, 242, 242, 0.05);
          }
        }

        /* Consultation Type Section */
        .consultation-type {
          background: #ffffff;
          padding: 1.25rem;
          border-radius: 12px;
          margin: 1.25rem 0;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .type-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.3rem;
          box-shadow: 0 4px 6px rgba(99, 102, 241, 0.2);
          flex-shrink: 0;
        }

        .type-details {
          flex: 1;
        }

        .type-label {
          display: block;
          color: #000000;  /* Changed to black */
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .type-text {
          color: #000000;  /* Changed to black */
          font-size: 1.1rem;
          font-weight: 600;
          display: block;
        }

        /* Booking Time Section */
        .booking-time {
          background: #ffffff;
          padding: 1.25rem;
          border-radius: 12px;
          margin: 1.25rem 0;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .time-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.3rem;
          box-shadow: 0 4px 6px rgba(99, 102, 241, 0.2);
          flex-shrink: 0;
        }

        .time-details {
          flex: 1;
        }

        .time-label {
          display: block;
          color: #000000;  /* Changed to black */
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .time-value {
          color: #000000;  /* Changed to black */
          font-size: 1.1rem;
          font-weight: 600;
          display: block;
        }

        /* Status-specific background colors with improved contrast */
        .booking-card.pending .consultation-type,
        .booking-card.pending .booking-time {
          background: #fff8e1;  /* Lighter yellow background */
        }

        .booking-card.confirmed .consultation-type,
        .booking-card.confirmed .booking-time {
          background: #e8f5e9;  /* Lighter green background */
        }

        .booking-card.cancelled .consultation-type,
        .booking-card.cancelled .booking-time {
          background: #ffebee;  /* Lighter red background */
        }

        /* Dark mode adjustments */
        @media (prefers-color-scheme: dark) {
          .consultation-type,
          .booking-time {
            background: #1f2937;
          }

          .type-label,
          .time-label {
            color: #ffffff;  /* White text in dark mode */
          }

          .type-text,
          .time-value {
            color: #ffffff;  /* White text in dark mode */
          }

          /* Status-specific dark mode backgrounds */
          .booking-card.pending .consultation-type,
          .booking-card.pending .booking-time {
            background: #2c2410;  /* Dark yellow */
          }

          .booking-card.confirmed .consultation-type,
          .booking-card.confirmed .booking-time {
            background: #132e1a;  /* Dark green */
          }

          .booking-card.cancelled .consultation-type,
          .booking-card.cancelled .booking-time {
            background: #2d1517;  /* Dark red */
          }
        }

        /* Booking Notes Section Enhancement */
        .booking-notes {
          background: #ffffff;
          padding: 1.25rem;
          border-radius: 12px;
          margin: 1.25rem 0;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .notes-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.3rem;
          box-shadow: 0 4px 6px rgba(99, 102, 241, 0.2);
          flex-shrink: 0;
        }

        .notes-content {
          flex: 1;
        }

        .notes-label {
          display: block;
          color: #000000;  /* Changed to black */
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .notes-text {
          color: #000000;  /* Changed to black */
          font-size: 1.1rem;
          font-weight: 500;
          line-height: 1.5;
          display: block;
        }

        /* Status-specific background colors for notes */
        .booking-card.pending .booking-notes {
          background: #fff8e1;  /* Lighter yellow background */
        }

        .booking-card.confirmed .booking-notes {
          background: #e8f5e9;  /* Lighter green background */
        }

        .booking-card.cancelled .booking-notes {
          background: #ffebee;  /* Lighter red background */
        }

        /* Dark mode adjustments for notes */
        @media (prefers-color-scheme: dark) {
          .booking-notes {
            background: #1f2937;
            border-color: #374151;
          }

          .notes-label {
            color: #ffffff;  /* White text in dark mode */
          }

          .notes-text {
            color: #ffffff;  /* White text in dark mode */
          }

          /* Status-specific dark mode backgrounds for notes */
          .booking-card.pending .booking-notes {
            background: #2c2410;  /* Dark yellow */
          }

          .booking-card.confirmed .booking-notes {
            background: #132e1a;  /* Dark green */
          }

          .booking-card.cancelled .booking-notes {
            background: #2d1517;  /* Dark red */
          }
        }

        /* Booking Card Actions */
        .booking-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1.25rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .action-button {
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border: none;
        }

        .reschedule-btn {
          background-color: #3b82f6;
          color: white;
        }

        .reschedule-btn:hover {
          background-color: #2563eb;
        }

        .cancel-btn {
          background-color: #ef4444;
          color: white;
        }

        .cancel-btn:hover {
          background-color: #dc2626;
        }

        /* Status-specific button visibility */
        .booking-card.cancelled .booking-actions {
          display: none;
        }

        /* Dark mode adjustments for buttons */
        @media (prefers-color-scheme: dark) {
          .booking-actions {
            border-color: #374151;
          }
        }

        /* Add these styles to improve the reschedule modal appearance */

        /* Reschedule Modal Styling */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .reschedule-modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 550px;
          padding: 0;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          animation: modalFadeIn 0.3s ease-out;
          overflow: hidden;
        }

        .modal-header {
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          color: white;
          padding: 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .modal-close {
          background: transparent;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.2s;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .modal-body {
          padding: 1.5rem;
        }

        .reschedule-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 600;
          color: #374151;
          font-size: 1rem;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          border-color: #6366f1;
          outline: none;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-group textarea {
          min-height: 100px;
          resize: vertical;
        }

        .modal-footer {
          padding: 1.25rem;
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-cancel {
          background: #f3f4f6;
          color: #4b5563;
          border: 1px solid #d1d5db;
        }

        .btn-cancel:hover {
          background: #e5e7eb;
        }

        .btn-submit {
          background: #4f46e5;
          color: white;
          border: none;
        }

        .btn-submit:hover {
          background: #4338ca;
        }

        .btn-submit:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        /* Calendar styling in modal */
        .reschedule-calendar {
          margin-bottom: 1rem;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .reschedule-calendar .react-calendar {
          width: 100%;
          border: none;
        }

        .time-slots-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .time-slot {
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .time-slot:hover {
          border-color: #6366f1;
          background: #f5f5ff;
        }

        .time-slot.selected {
          background: #6366f1;
          color: white;
          border-color: #6366f1;
        }

        /* Animation */
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .reschedule-modal {
            width: 95%;
            max-height: 90vh;
            overflow-y: auto;
          }

          .time-slots-container {
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          }
        }

        /* Reschedule Request Form Styling */
        .reschedule-request-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          margin: 2rem 0;
          border: 1px solid #e2e8f0;
        }

        .reschedule-header {
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          color: white;
          padding: 1.5rem;
          position: relative;
        }

        .reschedule-header h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .reschedule-header h3 i {
          font-size: 1.25rem;
        }

        .reschedule-header .lawyer-name {
          font-weight: 700;
          margin-left: 0.25rem;
        }

        .reschedule-form {
          padding: 1.5rem;
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 2fr;
          align-items: center;
          gap: 1.5rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 8px;
          border-left: 4px solid #6366f1;
        }

        .form-row label {
          font-weight: 600;
          color: #1e293b;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .form-row label i {
          color: #6366f1;
          font-size: 1.1rem;
        }

        .form-row input,
        .form-row textarea,
        .form-row select {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 1rem;
          background: white;
          transition: all 0.2s;
        }

        .form-row input:focus,
        .form-row textarea:focus,
        .form-row select:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
          outline: none;
        }

        .form-row textarea {
          min-height: 120px;
          resize: vertical;
        }

        .form-row.reason-row {
          grid-template-columns: 1fr;
        }

        .form-row.reason-row label {
          margin-bottom: 0.75rem;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding: 1.5rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }

        .form-button {
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .cancel-button {
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #cbd5e1;
        }

        .cancel-button:hover {
          background: #e2e8f0;
        }

        .submit-button {
          background: #4f46e5;
          color: white;
          border: none;
        }

        .submit-button:hover {
          background: #4338ca;
        }

        .submit-button:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        .date-time-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .date-input, .time-input {
          position: relative;
        }

        .date-input i, .time-input i {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          
          .date-time-container {
            grid-template-columns: 1fr;
          }
        }

        .btn-loading {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .btn-loading i {
          margin-right: 8px;
        }
      `}</style>
    </>
  );
};

export default LawyerAppointment;
