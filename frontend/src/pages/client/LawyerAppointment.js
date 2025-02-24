import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";
import Navbar from "../../components/navbar/navbar-client";
import Footer from "../../components/footer/footer-client";
import ClientSidebar from '../../components/sidebar/ClientSidebar';
import { useAuth } from "../../context/AuthContext";

const BAD_WORDS = [
  'fuck', 'shit', 'ass', 'bitch', 'bastard', 'damn', 'cunt', 'dick', 'pussy', 
  // Add more bad words as needed
];

const LawyerAppointment = () => {
  const { lawyerId } = useParams();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
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
    const fetchAvailability = async () => {
      if (!selectedDate) return;

      try {
        setIsLoading(true);
        const formattedDate = selectedDate.toISOString().split("T")[0];
        
        // Fetch both availability and existing appointments
        const [availabilityResponse, appointmentsResponse] = await Promise.all([
          axios.get(
            `http://localhost:5000/api/lawyer/availability/${lawyerId}/${formattedDate}`
          ),
          axios.get(
            `http://localhost:5000/api/appointments/lawyer/${lawyerId}`
          )
        ]);

        if (availabilityResponse.data.availability) {
          const allTimeSlots = availabilityResponse.data.availability.timeSlots.sort();
          
          // Filter out booked slots
          const bookedSlots = appointmentsResponse.data.appointments
            .filter(apt => 
              new Date(apt.appointmentDate).toISOString().split('T')[0] === formattedDate &&
              apt.status !== 'cancelled'
            )
            .map(apt => apt.appointmentTime);

          const availableSlots = allTimeSlots.filter(slot => !bookedSlots.includes(slot));
          
          setAvailableTimeSlots(availableSlots);
          setAvailabilityStatus(availableSlots.length > 0 ? 'available' : 'fully-booked');
        } else {
          setAvailableTimeSlots([]);
          setAvailabilityStatus('unavailable');
        }
      } catch (error) {
        console.error("Error fetching availability:", error);
        setError("Error loading available time slots");
        setAvailabilityStatus('error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [selectedDate, lawyerId]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null); // Reset selected time slot when date changes
  };

  const handleTimeSlotSelect = (slot) => {
    setSelectedTimeSlot(slot);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      const appointmentData = {
        lawyerId,
        clientName: user?.fullName || user?.name,
        clientEmail: user?.email,
        clientPhone: user?.phone,
        appointmentDate: selectedDate.toISOString().split("T")[0],
        appointmentTime: selectedTimeSlot,
        notes: formData.notes.trim(),
      };

      const response = await axios.post(
        "http://localhost:5000/api/appointments",
        appointmentData
      );

      if (response.data.success) {
        setSuccess(true);
        setFormData({
          ...formData,
          notes: "",
        });
        setSelectedTimeSlot(null);
        setSelectedDate(null);
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      setError(
        error.response?.data?.message ||
          "Error occurred while booking appointment"
      );
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

  return (
    <>
      <div className="page-container">
        <Navbar />
        <ClientSidebar onToggle={setIsSidebarCollapsed} />
        <div className={`main-content ${isSidebarCollapsed ? '' : 'sidebar-expanded'}`}>
          <div className="appointment-container">
            <h2>Book Appointment with {lawyerDetails?.fullname}</h2>

            <div className="appointment-grid">
              {/* Left Side - Calendar */}
              <div className="calendar-section">
                <h3>Select Date & Time</h3>
                <Calendar
                  onChange={handleDateChange}
                  value={selectedDate}
                  minDate={new Date()}
                  className="custom-calendar"
                />

                {selectedDate && (
                  <div className="time-slots-section">
                    <h4>Available Time Slots</h4>
                    {isLoading ? (
                      <div className="loading-spinner">Loading time slots...</div>
                    ) : (
                      <div className="time-slots-grid">
                        {availableTimeSlots.map((slot) => (
                          <button
                            key={slot}
                            className={`time-slot ${selectedTimeSlot === slot ? "selected" : ""}`}
                            onClick={() => handleTimeSlotSelect(slot)}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Side - Form */}
              <div className="appointment-form-section">
                <h3>Your Information</h3>
                <form onSubmit={handleSubmit}>
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
                    <input
                      type="tel"
                      name="clientPhone"
                      value={formData.clientPhone}
                      onChange={handleInputChange}
                      className={validationErrors.clientPhone ? "error" : ""}
                      placeholder="Enter your 10-digit phone number"
                      maxLength={10}
                      pattern="[6-9][0-9]{9}"
                      title="Please enter a valid 10-digit Indian phone number"
                    />
                    {validationErrors.clientPhone && (
                      <span className="error-text">{validationErrors.clientPhone}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>
                      Notes <span className="optional">(Optional)</span>
                    </label>
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
                    disabled={!selectedDate || !selectedTimeSlot}
                  >
                    Book Appointment
                  </button>
                </form>
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
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .time-slot:hover {
          background: #f0f0f0;
        }

        .time-slot.selected {
          background: #007bff;
          color: white;
          border-color: #0056b3;
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
          color: #dc3545;
          margin: 1rem 0;
        }

        .success-message {
          color: #28a745;
          margin: 1rem 0;
        }

        .submit-button {
          background: #007bff;
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          width: 100%;
        }

        .submit-button:disabled {
          background: #ccc;
          cursor: not-allowed;
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
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
          color: #333;
          font-size: 1rem;
          margin-top: 5px;
          font-weight: 500;
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
      `}</style>
    </>
  );
};

export default LawyerAppointment;
