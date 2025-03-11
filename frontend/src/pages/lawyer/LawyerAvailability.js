import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";
import Navbar from "../../components/navbar/navbar-lawyer";
import Footer from "../../components/footer/footer-lawyer";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/600.css";
import "@fontsource/montserrat/700.css";
import LawyerIconPanel from '../../components/LawyerIconPanel';

const LawyerAvailability = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [videoCallTimeSlots, setVideoCallTimeSlots] = useState([]);
  const [newTimeSlot, setNewTimeSlot] = useState("");
  const [existingAvailability, setExistingAvailability] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [rescheduleRequests, setRescheduleRequests] = useState([]);
  const [validationError, setValidationError] = useState("");
  const [activeTab, setActiveTab] = useState('inPerson'); // 'inPerson' or 'videoCall'

  // Fetch existing availability when date is selected
  useEffect(() => {
    const fetchAvailabilityAndAppointments = async () => {
      if (!selectedDate) {
        console.log("FETCH: No date selected, resetting slots");
        setTimeSlots([]);
        setVideoCallTimeSlots([]);
        setExistingAvailability(null);
        return;
      }

      try {
        setIsLoading(true);
        // Reset time slots FIRST before fetching new ones
        setTimeSlots([]);
        setVideoCallTimeSlots([]);
        setExistingAvailability(null);

        const lawyerEmail = localStorage.getItem("userEmail") || sessionStorage.getItem("email");
        const userResponse = await axios.get(
          `http://localhost:5000/api/lawyers/user-details/${lawyerEmail}`
        );
        const lawyerId = userResponse.data._id;

        // Format the date correctly for the API call
        // Ensure we're using the local date's year, month, and day
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        console.log("FETCH: Selected date:", selectedDate);
        console.log("FETCH: Formatted date for API:", formattedDate);

        const availabilityResponse = await axios.get(
          `http://localhost:5000/api/lawyer/availability/${lawyerId}/${formattedDate}`
        );

        if (availabilityResponse.data.availability) {
          const availability = availabilityResponse.data.availability;
          
          // Compare dates using local date strings to avoid timezone issues
          const availabilityDate = new Date(availability.date);
          const isCorrectDate = availabilityDate.toDateString() === selectedDate.toDateString();
          
          console.log("FETCH: Availability date:", availabilityDate);
          console.log("FETCH: Selected date:", selectedDate);
          console.log("FETCH: Dates match:", isCorrectDate);

          if (isCorrectDate) {
            // Filter out past time slots if it's today
            const isToday = selectedDate.toDateString() === new Date().toDateString();
            if (isToday) {
              const currentHour = new Date().getHours();
              const filteredSlots = availability.timeSlots.filter(slot => {
                const slotHour = parseInt(slot.split(':')[0]);
                return slotHour > currentHour;
              });
              setTimeSlots(filteredSlots);

              const filteredVideoSlots = availability.videoCallTimeSlots?.filter(slot => {
                const slotHour = parseInt(slot.split(':')[0]);
                return slotHour > currentHour;
              }) || [];
              setVideoCallTimeSlots(filteredVideoSlots);
            } else {
              setTimeSlots(availability.timeSlots || []);
              setVideoCallTimeSlots(availability.videoCallTimeSlots || []);
            }
            setExistingAvailability(availability);
          } else {
            console.log("FETCH: Date mismatch, resetting slots");
            setTimeSlots([]);
            setVideoCallTimeSlots([]);
            setExistingAvailability(null);
          }
        } else {
          console.log("FETCH: No availability found for date:", formattedDate);
        }

        // Fetch and filter appointments for the exact selected date
        const appointmentsResponse = await axios.get(
          `http://localhost:5000/api/appointments/lawyer/${lawyerId}`
        );

        const filteredAppointments = appointmentsResponse.data.appointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate.toDateString() === selectedDate.toDateString();
        });

        setAppointments(filteredAppointments);
      } catch (error) {
        console.error("FETCH ERROR:", error);
        setValidationError("Error loading data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailabilityAndAppointments();
  }, [selectedDate]);

  // First, update the useEffect to fetch appointments with payment information
  useEffect(() => {
    const fetchAppointmentsWithPayments = async () => {
      if (!selectedDate) return;
      
      try {
        const lawyerEmail = localStorage.getItem("userEmail") || sessionStorage.getItem("email");
        const userResponse = await axios.get(
          `http://localhost:5000/api/lawyers/user-details/${lawyerEmail}`
        );
        const lawyerId = userResponse.data._id;
        
        // Format the date for the API call
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        
        // Fetch appointments with payment information
        const appointmentsResponse = await axios.get(
          `http://localhost:5000/api/appointments/date/${lawyerId}/${formattedDate}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
            }
          }
        );
        
        if (appointmentsResponse.data && appointmentsResponse.data.appointments) {
          // Fetch payment information for each appointment
          const appointmentsWithPayments = await Promise.all(
            appointmentsResponse.data.appointments.map(async (appointment) => {
              try {
                // Get payment status for this appointment
                const paymentResponse = await axios.get(
                  `http://localhost:5000/api/payments/status/${appointment._id}`
                );
                
                return {
                  ...appointment,
                  paymentInfo: paymentResponse.data
                };
              } catch (error) {
                console.error(`Error fetching payment for appointment ${appointment._id}:`, error);
                return appointment;
              }
            })
          );
          
          setAppointments(appointmentsWithPayments);
        }
      } catch (error) {
        console.error("Error fetching appointments with payments:", error);
      }
    };
    
    fetchAppointmentsWithPayments();
  }, [selectedDate]);

  // Update the useEffect to fetch appointments on page load
  useEffect(() => {
    const fetchInitialAppointments = async () => {
      try {
        setIsLoading(true);
        
        const lawyerEmail = localStorage.getItem("userEmail") || sessionStorage.getItem("email");
        const userResponse = await axios.get(
          `http://localhost:5000/api/lawyers/user-details/${lawyerEmail}`
        );
        const lawyerId = userResponse.data._id;
        
        // Get today's date in the required format
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        
        // Set the selected date to today
        setSelectedDate(today);
        
        // Fetch appointments with payment information for today
        const appointmentsResponse = await axios.get(
          `http://localhost:5000/api/appointments/date/${lawyerId}/${formattedDate}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
            }
          }
        );
        
        if (appointmentsResponse.data && appointmentsResponse.data.appointments) {
          setAppointments(appointmentsResponse.data.appointments);
        }
      } catch (error) {
        console.error("Error fetching initial appointments:", error);
        setValidationError("Error loading appointments. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialAppointments();
  }, []); // Empty dependency array means this runs once on component mount

  // Add function to check if a date is a weekend
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
  };

  // Update handleDateChange function
  const handleDateChange = (date) => {
    if (isWeekend(date)) {
      setValidationError("Appointments are not available on weekends");
      return;
    }

    // Reset everything when date changes
    setValidationError("");
    setTimeSlots([]);
    setVideoCallTimeSlots([]);
    setExistingAvailability(null);
    
    // Create a new date object at the start of day in local timezone
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const newDate = new Date(year, month, day);
    
    console.log("Date changed to:", newDate);
    console.log("Date ISO string:", newDate.toISOString());
    console.log("Date local string:", newDate.toString());
    
    setSelectedDate(newDate);
  };

  const handleAddTimeSlot = () => {
    if (newTimeSlot && !timeSlots.includes(newTimeSlot)) {
      // Check if this slot is already used for video calls
      if (videoCallTimeSlots.includes(newTimeSlot)) {
        setValidationError("This time slot is already set for video call consultations");
        return;
      }
      setTimeSlots([...timeSlots, newTimeSlot].sort());
      setNewTimeSlot(""); // Reset the input after adding
    }
  };

  const handleRemoveTimeSlot = (slotToRemove) => {
    setTimeSlots(timeSlots.filter((slot) => slot !== slotToRemove));
  };

  const handleDeleteAvailability = async (type = 'all') => {
    if (!existingAvailability) return;

    try {
      setIsLoading(true);
      
      if (type === 'all') {
        // Delete the entire availability record
        await axios.delete(
          `http://localhost:5000/api/lawyer/availability/${existingAvailability._id}`
        );
        
        setTimeSlots([]);
        setVideoCallTimeSlots([]);
        setExistingAvailability(null);
      } else {
        // Update the availability record to remove only the specified type of slots
        const updateData = {};
        
        if (type === 'inPerson') {
          // Check if video call slots exist
          if (existingAvailability.videoCallTimeSlots && existingAvailability.videoCallTimeSlots.length > 0) {
            // If video call slots exist, just update the in-person slots to empty
            updateData.timeSlots = [];
            updateData.videoCallTimeSlots = existingAvailability.videoCallTimeSlots;
            
            const response = await axios.put(
              `http://localhost:5000/api/lawyer/availability/${existingAvailability._id}`,
              updateData
            );
            
            setTimeSlots([]);
            setExistingAvailability(response.data.availability);
          } else {
            // If no video call slots, delete the entire record
            await axios.delete(
              `http://localhost:5000/api/lawyer/availability/${existingAvailability._id}`
            );
            
            setTimeSlots([]);
            setVideoCallTimeSlots([]);
            setExistingAvailability(null);
          }
        } else if (type === 'videoCall') {
          // Check if in-person slots exist
          if (existingAvailability.timeSlots && existingAvailability.timeSlots.length > 0) {
            // If in-person slots exist, just update the video call slots to empty
            updateData.timeSlots = existingAvailability.timeSlots;
            updateData.videoCallTimeSlots = [];
            
            const response = await axios.put(
              `http://localhost:5000/api/lawyer/availability/${existingAvailability._id}`,
              updateData
            );
            
            setVideoCallTimeSlots([]);
            setExistingAvailability(response.data.availability);
          } else {
            // If no in-person slots, delete the entire record
            await axios.delete(
              `http://localhost:5000/api/lawyer/availability/${existingAvailability._id}`
            );
            
            setTimeSlots([]);
            setVideoCallTimeSlots([]);
            setExistingAvailability(null);
          }
        }
      }
      
      setValidationError("");
    } catch (error) {
      console.error("Error deleting availability:", error);
      setValidationError("Error deleting availability. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add validation before saving slots
  const validateTimeSlots = () => {
    if (!selectedDate) {
      setValidationError("Please select a date first");
      return false;
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDay = new Date(selectedDate);
    selectedDay.setHours(0, 0, 0, 0);

    if (selectedDay < today) {
      setValidationError("Cannot set availability for past dates");
      return false;
    }

    // If it's today, check for past hours
    if (selectedDay.getTime() === today.getTime()) {
      const currentHour = new Date().getHours();
      const hasPastSlots = timeSlots.some(slot => {
        const slotHour = parseInt(slot.split(':')[0]);
        return slotHour <= currentHour;
      });

      if (hasPastSlots) {
        setValidationError("Cannot set availability for past hours");
        return false;
      }
    }

    // Check if at least one time slot is selected
    if (timeSlots.length === 0) {
      setValidationError("Please select at least one time slot");
      return false;
    }

    // Check for any conflicting appointments
    const hasConflict = appointments.some(appointment => {
      return timeSlots.includes(appointment.appointmentTime) && 
             appointment.status !== 'cancelled';
    });

    if (hasConflict) {
      setValidationError("Some selected slots conflict with existing appointments");
      return false;
    }

    setValidationError("");
    return true;
  };

  // Add validation for video call time slots
  const validateVideoCallTimeSlots = () => {
    if (!selectedDate) {
      setValidationError("Please select a date first");
      return false;
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDay = new Date(selectedDate);
    selectedDay.setHours(0, 0, 0, 0);

    if (selectedDay < today) {
      setValidationError("Cannot set availability for past dates");
      return false;
    }

    // If it's today, check for past hours
    if (selectedDay.getTime() === today.getTime()) {
      const currentHour = new Date().getHours();
      const hasPastSlots = videoCallTimeSlots.some(slot => {
        const slotHour = parseInt(slot.split(':')[0]);
        return slotHour <= currentHour;
      });

      if (hasPastSlots) {
        setValidationError("Cannot set availability for past hours");
        return false;
      }
    }

    setValidationError("");
    return true;
  };

  // Update handleSaveSlots function
  const handleSaveSlots = async () => {
    if (!validateTimeSlots()) {
      return;
    }

    try {
      setIsLoading(true);
      const lawyerEmail = localStorage.getItem("userEmail") || sessionStorage.getItem("email");
      const userResponse = await axios.get(
        `http://localhost:5000/api/lawyers/user-details/${lawyerEmail}`
      );
      const lawyerId = userResponse.data._id;

      // Format the date properly to avoid timezone issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      console.log("SAVE: Selected date object:", selectedDate);
      console.log("SAVE: Selected date local:", selectedDate.toString());
      console.log("SAVE: Formatted date string:", formattedDate);

      const availabilityData = {
        lawyerId,
        date: formattedDate,
        timeSlots,
        videoCallTimeSlots
      };

      const response = await axios.post(
        "http://localhost:5000/api/lawyer/availability",
        availabilityData
      );

      console.log("SAVE: Create response:", response.data);
      setExistingAvailability(response.data.availability);
      setValidationError("");
    } catch (error) {
      console.error("SAVE ERROR:", error);
      setValidationError(
        error.response?.data?.message || "Error saving availability"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Add a function to get appointment status color
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

  // Add function to handle appointment status change
  const handleAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/appointments/status/${appointmentId}`,
        { status: newStatus }
      );

      if (response.data.success) {
        // Update the appointments list with new status
        setAppointments(appointments.map(appointment => 
          appointment._id === appointmentId 
            ? { ...appointment, status: newStatus }
            : appointment
        ));
        alert(`Appointment ${newStatus} successfully`);
      }
    } catch (error) {
      console.error("Error updating appointment status:", error);
      alert("Error updating appointment status");
    }
  };

  // Add function to handle reschedule requests
  const handleRescheduleRequest = async (appointmentId, action) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/appointments/reschedule/${appointmentId}/${action}`
      );

      if (response.data.success) {
        // Update the appointments and reschedule requests lists
        setRescheduleRequests(prevRequests => 
          prevRequests.filter(req => req._id !== appointmentId)
        );
        
        // Refresh appointments
        const updatedAppointments = appointments.map(apt => 
          apt._id === appointmentId ? response.data.appointment : apt
        );
        setAppointments(updatedAppointments);

        alert(`Reschedule request ${action}ed successfully`);
      }
    } catch (error) {
      alert(error.response?.data?.message || `Error ${action}ing reschedule request`);
    }
  };

  // Update generateTimeSlots to filter out past times for current day
  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const currentHour = now.getHours();
    
    // Check if selected date is today
    const isToday = selectedDate && 
      selectedDate.toDateString() === new Date().toDateString();

    for (let hour = 9; hour <= 17; hour++) {
      // Skip past hours if it's today
      if (isToday && hour <= currentHour) {
        continue;
      }
      
      const formattedHour = hour.toString().padStart(2, '0');
      slots.push(`${formattedHour}:00`);
    }
    return slots;
  };

  const availableTimeSlots = generateTimeSlots();

  // Add a function to check if a slot is already booked for either type of appointment
  const isSlotBooked = (slot, appointmentType) => {
    return appointments.some(
      apt => apt.appointmentTime === slot && 
             apt.status !== 'cancelled' && 
             (appointmentType === 'all' || apt.appointmentType === appointmentType)
    );
  };

  // Update handleSlotToggle to prevent selecting slots already used for video calls
  const handleSlotToggle = (slot) => {
    // Clear any previous validation errors
    setValidationError("");

    // Check if the slot has an existing appointment of any type
    const hasAppointment = isSlotBooked(slot, 'all');

    if (hasAppointment) {
      setValidationError("Cannot modify slot with existing appointment");
      return;
    }

    // Check if the slot is already selected for video calls
    if (videoCallTimeSlots.includes(slot)) {
      setValidationError("This time slot is already set for video call consultations");
      return;
    }

    if (timeSlots.includes(slot)) {
      setTimeSlots(timeSlots.filter((s) => s !== slot));
    } else {
      setTimeSlots([...timeSlots, slot].sort());
    }
  };

  // Update handleVideoCallSlotToggle to prevent selecting slots already used for in-person
  const handleVideoCallSlotToggle = (slot) => {
    // Clear any previous validation errors
    setValidationError("");

    // Check if the slot has an existing appointment of any type
    const hasAppointment = isSlotBooked(slot, 'all');

    if (hasAppointment) {
      setValidationError("Cannot modify slot with existing appointment");
      return;
    }

    // Check if the slot is already selected for in-person consultations
    if (timeSlots.includes(slot)) {
      setValidationError("This time slot is already set for in-person consultations");
      return;
    }

    if (videoCallTimeSlots.includes(slot)) {
      setVideoCallTimeSlots(videoCallTimeSlots.filter((s) => s !== slot));
    } else {
      setVideoCallTimeSlots([...videoCallTimeSlots, slot].sort());
    }
  };

  // Add the missing handler for tab switching
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <>
      <Navbar />
      <LawyerIconPanel />
      <div className="dashboard-container">
        <div className="hero-section">
          <h1 className="main-title">Availability Dashboard</h1>
          <p className="subtitle">Manage your schedule efficiently</p>
        </div>

        <div className="content-wrapper">
          <div className="left-section">
            <div className="calendar-box">
              <h2>Select Date</h2>
              <Calendar
                onChange={handleDateChange}
                value={selectedDate}
                minDate={new Date()}
                className="modern-calendar"
                tileDisabled={({date}) => isWeekend(date)}
                tileClassName={({date}) => 
                  isWeekend(date) ? 'weekend-tile' : ''
                }
              />
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                  <h3>Today's Appointments</h3>
                  <span className="stat-number">{appointments.length}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👤</div>
                <div className="stat-info">
                  <h3>In-Person Slots</h3>
                  <span className="stat-number">{timeSlots.length}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📹</div>
                <div className="stat-info">
                  <h3>Video Call Slots</h3>
                  <span className="stat-number">{videoCallTimeSlots.length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="right-section">
            <div className="time-slots-box">
              <div className="section-header">
                <h2>Select Available Hours</h2>
                <div className="tabs">
                  <button 
                    className={`tab-btn ${activeTab === 'inPerson' ? 'active' : ''}`}
                    onClick={() => handleTabChange('inPerson')}
                  >
                    In-Person Appointments
                  </button>
                  <button 
                    className={`tab-btn ${activeTab === 'videoCall' ? 'active' : ''}`}
                    onClick={() => handleTabChange('videoCall')}
                  >
                    Video Call Appointments
                  </button>
                </div>
                <p className="time-info">Select your available time slots (1-hour intervals)</p>
              </div>

              {activeTab === 'inPerson' ? (
                <div className="time-slots-grid">
                  {availableTimeSlots.map((slot) => {
                    const hasAppointment = isSlotBooked(slot, 'inPerson');
                    const isUsedForVideoCall = videoCallTimeSlots.includes(slot);
                    
                    const isToday = selectedDate && 
                      selectedDate.toDateString() === new Date().toDateString();
                    const slotHour = parseInt(slot.split(':')[0]);
                    const currentHour = new Date().getHours();
                    const isPastSlot = isToday && slotHour <= currentHour;
                    
                    return (
                      <div
                        key={slot}
                        className={`time-slot 
                          ${timeSlots.includes(slot) ? 'selected' : ''} 
                          ${hasAppointment ? 'has-appointment' : ''}
                          ${isPastSlot ? 'past-slot' : ''}
                          ${isUsedForVideoCall ? 'used-for-other-type' : ''}`}
                        onClick={() => !isPastSlot && !isUsedForVideoCall && handleSlotToggle(slot)}
                        title={isPastSlot ? "Past time slot" : 
                               hasAppointment ? "Slot has existing appointment" : 
                               isUsedForVideoCall ? "Already set for video call consultations" : ""}
                      >
                        {slot}
                        {hasAppointment && <span className="appointment-indicator">📅</span>}
                        {isUsedForVideoCall && <span className="other-type-indicator">📹</span>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="time-slots-grid">
                  {availableTimeSlots.map((slot) => {
                    const hasAppointment = isSlotBooked(slot, 'videoCall');
                    const isUsedForInPerson = timeSlots.includes(slot);
                    
                    const isToday = selectedDate && 
                      selectedDate.toDateString() === new Date().toDateString();
                    const slotHour = parseInt(slot.split(':')[0]);
                    const currentHour = new Date().getHours();
                    const isPastSlot = isToday && slotHour <= currentHour;
                    
                    return (
                      <div
                        key={slot}
                        className={`time-slot 
                          ${videoCallTimeSlots.includes(slot) ? 'selected' : ''} 
                          ${hasAppointment ? 'has-appointment' : ''}
                          ${isPastSlot ? 'past-slot' : ''}
                          ${isUsedForInPerson ? 'used-for-other-type' : ''}`}
                        onClick={() => !isPastSlot && !isUsedForInPerson && handleVideoCallSlotToggle(slot)}
                        title={isPastSlot ? "Past time slot" : 
                               hasAppointment ? "Slot has existing appointment" : 
                               isUsedForInPerson ? "Already set for in-person consultations" : ""}
                      >
                        {slot}
                        {hasAppointment && <span className="appointment-indicator">📹</span>}
                        {isUsedForInPerson && <span className="other-type-indicator">👤</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {validationError && (
                <div className="validation-error">
                  {validationError}
                </div>
              )}

              <div className="action-buttons">
                <button onClick={handleSaveSlots} className="save-btn">
                  {existingAvailability ? "Update Slots" : "Save Slots"}
                </button>
                
                {existingAvailability && (
                  <div className="delete-buttons">
                    {activeTab === 'inPerson' && timeSlots.length > 0 && (
                      <button 
                        onClick={() => handleDeleteAvailability('inPerson')} 
                        className="delete-btn delete-specific"
                      >
                        Delete In-Person Slots
                      </button>
                    )}
                    
                    {activeTab === 'videoCall' && videoCallTimeSlots.length > 0 && (
                      <button 
                        onClick={() => handleDeleteAvailability('videoCall')} 
                        className="delete-btn delete-specific"
                      >
                        Delete Video Call Slots
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleDeleteAvailability('all')} 
                      className="delete-btn delete-all"
                    >
                      Delete All Slots
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="appointments-overview">
              <h2 className="section-title">Appointments Overview</h2>
              
              <div className="appointments-tabs">
                <div className="pending-section">
                  <div className="section-header">
                    <h3>New Requests</h3>
                    <span className="count-badge">
                      {appointments.filter(apt => apt.status === 'pending').length}
                    </span>
                  </div>
                  <div className="appointments-list">
                    {appointments
                      .filter(apt => apt.status === 'pending')
                      .map((appointment, index) => (
                        <div key={index} className="appointment-card pending">
                          <div className="card-time">
                            <i className="far fa-clock"></i>
                            {appointment.appointmentTime}
                          </div>
                          <div className="card-details">
                            <h4>{appointment.clientName}</h4>
                            <p>{appointment.clientEmail}</p>
                            <div className="appointment-meta">
                              <span className={`consultation-type ${appointment.appointmentType}`}>
                                {appointment.appointmentType === 'videoCall' ? 
                                  <><i className="fas fa-video"></i> Video Call</> : 
                                  <><i className="fas fa-user"></i> Face to Face</>
                                }
                              </span>
                              <span className={`payment-status ${appointment.paymentInfo?.status || 'pending'}`}>
                                {appointment.paymentInfo?.status === 'completed' ? 
                                  <><i className="fas fa-check-circle"></i> Paid</> : 
                                  <><i className="fas fa-clock"></i> Payment Pending</>
                                }
                              </span>
                            </div>
                            <p className="notes">{appointment.notes}</p>
                          </div>
                          <div className="card-actions">
                            <button 
                              onClick={() => handleAppointmentStatus(appointment._id, 'confirmed')}
                              className="accept-btn"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => handleAppointmentStatus(appointment._id, 'cancelled')}
                              className="reject-btn"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="confirmed-section">
                  <div className="section-header">
                    <h3>Confirmed</h3>
                    <span className="count-badge">
                      {appointments.filter(apt => apt.status === 'confirmed').length}
                    </span>
                  </div>
                  <div className="appointments-list">
                    {appointments
                      .filter(apt => apt.status === 'confirmed')
                      .map((appointment, index) => (
                        <div key={index} className="appointment-card confirmed">
                          <div className="card-time">
                            <i className="far fa-check-circle"></i>
                            {appointment.appointmentTime}
                          </div>
                          <div className="card-details">
                            <h4>{appointment.clientName}</h4>
                            <p>{appointment.clientEmail}</p>
                            <div className="appointment-meta">
                              <span className={`consultation-type ${appointment.appointmentType}`}>
                                {appointment.appointmentType === 'videoCall' ? 
                                  <><i className="fas fa-video"></i> Video Call</> : 
                                  <><i className="fas fa-user"></i> Face to Face</>
                                }
                              </span>
                              <span className={`payment-status ${appointment.paymentInfo?.status || 'pending'}`}>
                                {appointment.paymentInfo?.status === 'completed' ? 
                                  <><i className="fas fa-check-circle"></i> Paid</> : 
                                  <><i className="fas fa-clock"></i> Payment Pending</>
                                }
                              </span>
                            </div>
                            <p className="notes">{appointment.notes}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="cancelled-section">
                  <div className="section-header">
                    <h3>Cancelled</h3>
                    <span className="count-badge">
                      {appointments.filter(apt => apt.status === 'cancelled').length}
                    </span>
                  </div>
                  <div className="appointments-list">
                    {appointments
                      .filter(apt => apt.status === 'cancelled')
                      .map((appointment, index) => (
                        <div key={index} className="appointment-card cancelled">
                          <div className="card-time">
                            <i className="far fa-times-circle"></i>
                            {appointment.appointmentTime}
                          </div>
                          <div className="card-details">
                            <h4>{appointment.clientName}</h4>
                            <p>{appointment.clientEmail}</p>
                            <div className="appointment-meta">
                              <span className={`consultation-type ${appointment.appointmentType}`}>
                                {appointment.appointmentType === 'videoCall' ? 
                                  <><i className="fas fa-video"></i> Video Call</> : 
                                  <><i className="fas fa-user"></i> Face to Face</>
                                }
                              </span>
                              <span className={`payment-status ${appointment.paymentInfo?.status || 'pending'}`}>
                                {appointment.paymentInfo?.status === 'completed' ? 
                                  <><i className="fas fa-check-circle"></i> Paid</> : 
                                  <><i className="fas fa-clock"></i> Payment Pending</>
                                }
                              </span>
                            </div>
                            <p className="notes">{appointment.notes}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="appointments-summary">
              <div className="appointment-type-section">
                <h3>
                  <i className="fas fa-user"></i> Today's In-Person Appointments
                </h3>
                <div className="appointment-list">
                  {isLoading ? (
                    <div className="loading">Loading appointments...</div>
                  ) : appointments.filter(apt => apt.appointmentType === 'inPerson').length > 0 ? (
                    appointments
                      .filter(apt => apt.appointmentType === 'inPerson')
                      .map((appointment, index) => (
                        <div key={index} className={`appointment-item ${appointment.status}`}>
                          <div className="appointment-time">
                            <i className="far fa-clock"></i> {appointment.appointmentTime}
                          </div>
                          <div className="appointment-details">
                            <div className="client-info">
                              <strong>{appointment.clientName}</strong>
                              <span>{appointment.clientEmail}</span>
                            </div>
                            <div className="appointment-status">
                              <span className={`status-badge ${appointment.status}`}>
                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              </span>
                              <span className={`payment-badge ${appointment.paymentInfo?.status || 'pending'}`}>
                                {appointment.paymentInfo?.status === 'completed' ? 'Paid' : 'Payment Pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="no-appointments">No in-person appointments today</div>
                  )}
                </div>
              </div>
              
              <div className="appointment-type-section">
                <h3>
                  <i className="fas fa-video"></i> Today's Video Call Appointments
                </h3>
                <div className="appointment-list">
                  {isLoading ? (
                    <div className="loading">Loading appointments...</div>
                  ) : appointments.filter(apt => apt.appointmentType === 'videoCall').length > 0 ? (
                    appointments
                      .filter(apt => apt.appointmentType === 'videoCall')
                      .map((appointment, index) => (
                        <div key={index} className={`appointment-item ${appointment.status}`}>
                          <div className="appointment-time">
                            <i className="far fa-clock"></i> {appointment.appointmentTime}
                          </div>
                          <div className="appointment-details">
                            <div className="client-info">
                              <strong>{appointment.clientName}</strong>
                              <span>{appointment.clientEmail}</span>
                            </div>
                            <div className="appointment-status">
                              <span className={`status-badge ${appointment.status}`}>
                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              </span>
                              <span className={`payment-badge ${appointment.paymentInfo?.status || 'pending'}`}>
                                {appointment.paymentInfo?.status === 'completed' ? 'Paid' : 'Payment Pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="no-appointments">No video call appointments today</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .dashboard-container {
          margin-left: 60px;
          min-height: calc(100vh - 60px);
          padding: 20px;
        }

        .content-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 2rem;
          align-items: start;
        }

        .left-section {
          position: sticky;
          top: 2rem;
        }

        .calendar-box, .time-slots-box, .appointments-overview {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 1.5rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .stat-card {
          background: white;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          align-items: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .stat-card:nth-child(1) .stat-icon {
          background-color: #e0f2fe;
          color: #0284c7;
        }
        
        .stat-card:nth-child(2) .stat-icon {
          background-color: #dcfce7;
          color: #16a34a;
        }
        
        .stat-card:nth-child(3) .stat-icon {
          background-color: #f0f9ff;
          color: #0369a1;
        }

        .stat-info h3 {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
        }

        .stat-number {
          font-size: 1.5rem;
          font-weight: 600;
          color: #0f172a;
        }

        .time-slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 1rem;
          margin: 1.5rem 0;
        }

        .time-slot {
          background: #f8fafc;
          padding: 1rem;
          border-radius: 8px;
          text-align: center;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s ease;
        }

        .time-slot:hover {
          background: #e2e8f0;
        }

        .time-slot.selected {
          background: #2563eb;
          color: white;
          border-color: #1e40af;
        }

        .time-info {
          color: #64748b;
          font-size: 0.875rem;
          margin: 0;
        }

        .appointments-tabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-top: 1rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #f1f5f9;
        }

        .section-header h3 {
          font-size: 1.1rem;
          color: #0f172a;
          margin: 0;
        }

        .count-badge {
          background: #f1f5f9;
          color: #64748b;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .appointments-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 500px;
          overflow-y: auto;
        }

        .appointment-card {
          background: white;
          border-radius: 8px;
          padding: 1rem;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }

        .appointment-card.pending {
          border-left: 4px solid #f59e0b;
        }

        .appointment-card.confirmed {
          border-left: 4px solid #10b981;
        }

        .appointment-card.cancelled {
          border-left: 4px solid #ef4444;
        }

        .card-time {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .card-details h4 {
          margin: 0;
          color: #0f172a;
          font-size: 1rem;
        }

        .card-details p {
          margin: 0.25rem 0;
          color: #64748b;
          font-size: 0.875rem;
        }

        .notes {
          font-style: italic;
          color: #94a3b8;
        }

        .card-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .accept-btn, .reject-btn {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .accept-btn {
          background: #10b981;
          color: white;
          border: none;
        }

        .reject-btn {
          background: #ef4444;
          color: white;
          border: none;
        }

        button {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-btn, .save-btn {
          background: #2563eb;
          color: white;
          border: none;
        }

        .delete-btn {
          background: #dc2626;
          color: white;
          border: none;
        }

        button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        @media (max-width: 1024px) {
          .content-wrapper {
            grid-template-columns: 1fr;
          }

          .left-section {
            position: static;
          }

          .appointments-tabs {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            margin-left: 50px;
            padding: 15px;
          }
        }

        .validation-error {
          color: #dc2626;
          background: #fee2e2;
          padding: 0.75rem;
          border-radius: 6px;
          margin: 1rem 0;
          font-size: 0.875rem;
        }

        .time-slot.has-appointment {
          position: relative;
          background: #f0f9ff;
          border-color: #0ea5e9;
        }

        .appointment-indicator {
          position: absolute;
          top: -5px;
          right: -5px;
          font-size: 12px;
        }

        .time-slot.has-appointment.selected {
          background: #0ea5e9;
          color: white;
        }

        .time-slot:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .time-slot.past-slot {
          opacity: 0.5;
          background: #e5e7eb;
          cursor: not-allowed;
          color: #9ca3af;
        }

        .time-slot.past-slot.selected {
          background: #9ca3af;
          border-color: #6b7280;
        }

        .weekend-tile {
          background-color: #f3f4f6;
          color: #9ca3af;
        }

        .weekend-tile:hover {
          background-color: #f3f4f6 !important;
          cursor: not-allowed;
        }

        .weekend-tile abbr {
          text-decoration: line-through;
        }

        .tabs {
          display: flex;
          margin-bottom: 1rem;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .tab-btn {
          padding: 0.75rem 1.5rem;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .tab-btn.active {
          color: #2563eb;
          border-bottom-color: #2563eb;
        }
        
        .tab-btn:hover {
          color: #1e40af;
          background-color: rgba(37, 99, 235, 0.05);
        }

        .time-slot.used-for-other-type {
          opacity: 0.5;
          background: #f0f0f0;
          cursor: not-allowed;
          color: #999;
          border: 1px dashed #ccc;
        }

        .other-type-indicator {
          position: absolute;
          top: -5px;
          right: -5px;
          font-size: 12px;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }
        
        .delete-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        
        .save-btn {
          background-color: #2563eb;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .save-btn:hover {
          background-color: #1d4ed8;
        }
        
        .delete-btn {
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .delete-specific {
          background-color: #f3f4f6;
          color: #4b5563;
          border: 1px solid #d1d5db;
        }
        
        .delete-specific:hover {
          background-color: #e5e7eb;
          color: #1f2937;
        }
        
        .delete-all {
          background-color: #fee2e2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        
        .delete-all:hover {
          background-color: #fecaca;
          color: #b91c1c;
        }

        /* Add these styles for consultation type and payment status */
        .appointment-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .consultation-type,
        .payment-status {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .consultation-type.videoCall {
          background-color: #dcfce7;
          color: #166534;
        }

        .consultation-type.inPerson {
          background-color: #e0f2fe;
          color: #0369a1;
        }

        .payment-status.completed {
          background-color: #d1fae5;
          color: #065f46;
        }

        .payment-status.pending,
        .payment-status.created {
          background-color: #fef3c7;
          color: #92400e;
        }

        .payment-status.failed {
          background-color: #fee2e2;
          color: #b91c1c;
        }

        /* Add these styles for the appointments summary section */
        .appointments-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 1.5rem;
          margin-bottom: 2rem;
        }

        .appointment-type-section {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 1rem;
        }

        .appointment-type-section h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
          color: #1f2937;
          font-size: 1.1rem;
        }

        .appointment-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .appointment-item {
          display: flex;
          padding: 0.75rem;
          border-radius: 6px;
          background-color: #f9fafb;
          border-left: 3px solid #9ca3af;
        }

        .appointment-item.pending {
          border-left-color: #f59e0b;
        }

        .appointment-item.confirmed {
          border-left-color: #10b981;
        }

        .appointment-item.cancelled {
          border-left-color: #ef4444;
        }

        .appointment-time {
          min-width: 80px;
          font-weight: 500;
          color: #4b5563;
        }

        .appointment-details {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .client-info {
          display: flex;
          flex-direction: column;
        }

        .client-info strong {
          font-size: 0.95rem;
          color: #1f2937;
        }

        .client-info span {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .appointment-status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }

        .status-badge, .payment-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .status-badge.pending {
          background-color: #fef3c7;
          color: #92400e;
        }

        .status-badge.confirmed {
          background-color: #d1fae5;
          color: #065f46;
        }

        .status-badge.cancelled {
          background-color: #fee2e2;
          color: #b91c1c;
        }

        .payment-badge.completed {
          background-color: #d1fae5;
          color: #065f46;
        }

        .payment-badge.pending {
          background-color: #fef3c7;
          color: #92400e;
        }

        .no-appointments {
          padding: 1rem;
          text-align: center;
          color: #6b7280;
          font-style: italic;
        }

        .loading {
          padding: 1rem;
          text-align: center;
          color: #6b7280;
        }

        /* Make it responsive */
        @media (max-width: 768px) {
          .appointments-summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
};

export default LawyerAvailability;
