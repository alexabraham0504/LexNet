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
  const [newTimeSlot, setNewTimeSlot] = useState("");
  const [existingAvailability, setExistingAvailability] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [rescheduleRequests, setRescheduleRequests] = useState([]);
  const [validationError, setValidationError] = useState("");

  // Fetch existing availability when date is selected
  useEffect(() => {
    const fetchAvailabilityAndAppointments = async () => {
      if (!selectedDate) return;

      try {
        setIsLoading(true);
        const lawyerEmail =
          localStorage.getItem("userEmail") || sessionStorage.getItem("email");
        const userResponse = await axios.get(
          `http://localhost:5000/api/lawyers/user-details/${lawyerEmail}`
        );
        const lawyerId = userResponse.data._id;

        const formattedDate = selectedDate.toISOString().split("T")[0];
        
        // Fetch availability
        const availabilityResponse = await axios.get(
          `http://localhost:5000/api/lawyer/availability/${lawyerId}/${formattedDate}`
        );

        if (availabilityResponse.data.availability) {
          const availability = availabilityResponse.data.availability;
          
          // Filter out past time slots if it's today
          const isToday = selectedDate.toDateString() === new Date().toDateString();
          if (isToday) {
            const currentHour = new Date().getHours();
            const filteredSlots = availability.timeSlots.filter(slot => {
              const slotHour = parseInt(slot.split(':')[0]);
              return slotHour > currentHour;
            });
            setTimeSlots(filteredSlots);
          } else {
            setTimeSlots(availability.timeSlots);
          }
          
          setExistingAvailability(availability);
        } else {
          setExistingAvailability(null);
          setTimeSlots([]);
        }

        // Fetch appointments for the selected date
        const appointmentsResponse = await axios.get(
          `http://localhost:5000/api/appointments/lawyer/${lawyerId}`
        );

        // Filter appointments for the selected date
        const selectedDateAppointments = appointmentsResponse.data.appointments.filter(
          (appointment) => {
            const appointmentDate = new Date(appointment.appointmentDate).toISOString().split('T')[0];
            return appointmentDate === formattedDate;
          }
        );

        setAppointments(selectedDateAppointments);

        // Filter appointments with reschedule requests
        const appointmentsWithReschedule = appointmentsResponse.data.appointments.filter(
          apt => apt.rescheduleRequest?.requested && apt.rescheduleRequest?.status === 'pending'
        );
        setRescheduleRequests(appointmentsWithReschedule);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailabilityAndAppointments();
  }, [selectedDate]);

  // Add function to check if a date is a weekend
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
  };

  // Update handleDateChange to prevent weekend selection
  const handleDateChange = (date) => {
    if (isWeekend(date)) {
      setValidationError("Appointments are not available on weekends");
      return;
    }
    setValidationError("");
    setSelectedDate(date);
  };

  const handleAddTimeSlot = () => {
    if (newTimeSlot && !timeSlots.includes(newTimeSlot)) {
      setTimeSlots([...timeSlots, newTimeSlot].sort());
      setNewTimeSlot("");
    }
  };

  const handleRemoveTimeSlot = (slotToRemove) => {
    setTimeSlots(timeSlots.filter((slot) => slot !== slotToRemove));
  };

  const handleDeleteAvailability = async () => {
    if (
      !existingAvailability ||
      !window.confirm("Are you sure you want to delete this availability?")
    ) {
      return;
    }

    try {
      await axios.delete(
        `http://localhost:5000/api/lawyer/availability/${existingAvailability._id}`
      );
      setTimeSlots([]);
      setExistingAvailability(null);
      alert("Availability deleted successfully!");
    } catch (error) {
      console.error("Error deleting availability:", error);
      alert("Error deleting availability");
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

  // Update handleSaveSlots with validation
  const handleSaveSlots = async () => {
    if (!validateTimeSlots()) {
      return;
    }

    try {
      const lawyerEmail =
        localStorage.getItem("userEmail") || sessionStorage.getItem("email");
      if (!lawyerEmail) {
        setValidationError("Please login again");
        return;
      }

      const userResponse = await axios.get(
        `http://localhost:5000/api/lawyers/user-details/${lawyerEmail}`
      );
      const lawyerId = userResponse.data._id;
      const formattedDate = selectedDate.toISOString().split("T")[0];
      const formattedTimeSlots = timeSlots
        .map((slot) => {
          const [hours, minutes] = slot.split(":");
          return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
        })
        .sort();

      const requestData = {
        lawyerId,
        date: formattedDate,
        timeSlots: formattedTimeSlots,
      };

      const response = await axios[existingAvailability ? "put" : "post"](
        `http://localhost:5000/api/lawyer/availability${
          existingAvailability ? `/${existingAvailability._id}` : ""
        }`,
        requestData
      );

      alert(
        existingAvailability
          ? "Time slots updated successfully!"
          : "Time slots saved successfully!"
      );
      setExistingAvailability(response.data.availability);
    } catch (error) {
      setValidationError(error.response?.data?.message || "Error saving time slots");
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

  // Update handleSlotToggle with validation
  const handleSlotToggle = (slot) => {
    // Clear any previous validation errors
    setValidationError("");

    // Check if the slot has an existing appointment
    const hasAppointment = appointments.some(
      apt => apt.appointmentTime === slot && apt.status !== 'cancelled'
    );

    if (hasAppointment) {
      setValidationError("Cannot remove slot with existing appointment");
      return;
    }

    if (timeSlots.includes(slot)) {
      setTimeSlots(timeSlots.filter((s) => s !== slot));
    } else {
      setTimeSlots([...timeSlots, slot].sort());
    }
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
                <div className="stat-icon">⏰</div>
                <div className="stat-info">
                  <h3>Available Slots</h3>
                  <span className="stat-number">{timeSlots.length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="right-section">
            <div className="time-slots-box">
              <div className="section-header">
                <h2>Select Available Hours</h2>
                <p className="time-info">Select your available time slots (1-hour intervals)</p>
              </div>

              <div className="time-slots-grid">
                {availableTimeSlots.map((slot) => {
                  const hasAppointment = appointments.some(
                    apt => apt.appointmentTime === slot && apt.status !== 'cancelled'
                  );
                  
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
                        ${isPastSlot ? 'past-slot' : ''}`}
                      onClick={() => !isPastSlot && handleSlotToggle(slot)}
                      title={isPastSlot ? "Past time slot" : 
                             hasAppointment ? "Slot has existing appointment" : ""}
                    >
                      {slot}
                      {hasAppointment && <span className="appointment-indicator">📅</span>}
                    </div>
                  );
                })}
              </div>

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
                  <button onClick={handleDeleteAvailability} className="delete-btn">
                    Delete All
                  </button>
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
                          </div>
                        </div>
                      ))}
                  </div>
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
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .stat-card {
          background: white;
          padding: 1.25rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon {
          font-size: 2rem;
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
      `}</style>
    </>
  );
};

export default LawyerAvailability;
