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
          setExistingAvailability(availabilityResponse.data.availability);
          setTimeSlots(availabilityResponse.data.availability.timeSlots);
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

  const handleDateChange = (date) => {
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

  const handleSaveSlots = async () => {
    if (!selectedDate) {
      alert("Please select a date.");
      return;
    }
    if (timeSlots.length === 0) {
      alert("Please add at least one time slot.");
      return;
    }

    try {
      const lawyerEmail =
        localStorage.getItem("userEmail") || sessionStorage.getItem("email");
      if (!lawyerEmail) {
        alert("Please login again.");
        window.location.href = "/login";
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
      console.error("Error saving time slots:", error);
      alert(
        error.response?.data?.message ||
          "An error occurred while saving time slots."
      );
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
                <h2>Manage Time Slots</h2>
                <div className="time-input-container">
                  <input
                    type="time"
                    value={newTimeSlot}
                    onChange={(e) => setNewTimeSlot(e.target.value)}
                    className="time-input"
                  />
                  <button onClick={handleAddTimeSlot} className="add-btn">
                    Add Slot
                  </button>
                </div>
              </div>

              <div className="slots-container">
                {timeSlots.map((slot, index) => (
                  <div key={index} className="slot-item">
                    <span>{slot}</span>
                    <button
                      onClick={() => handleRemoveTimeSlot(slot)}
                      className="remove-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

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

        .time-input-container {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .time-input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.875rem;
        }

        .slots-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .slot-item {
          background: #f8fafc;
          padding: 0.75rem;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
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
      `}</style>
    </>
  );
};

export default LawyerAvailability;
