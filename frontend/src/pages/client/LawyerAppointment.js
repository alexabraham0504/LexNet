import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";
import Navbar from "../../components/navbar/navbar-client";
import Footer from "../../components/footer/footer-client";

const LawyerAppointment = () => {
  const { lawyerId } = useParams();
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [lawyerDetails, setLawyerDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    notes: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

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
        const response = await axios.get(
          `http://localhost:5000/api/lawyer/availability/${lawyerId}/${formattedDate}`
        );

        if (response.data.availability) {
          setAvailableTimeSlots(response.data.availability.timeSlots);
        } else {
          setAvailableTimeSlots([]);
        }
      } catch (error) {
        console.error("Error fetching availability:", error);
        setError("Error loading available time slots");
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.clientName.trim()) {
      errors.clientName = "Name is required";
    } else if (formData.clientName.length < 3) {
      errors.clientName = "Name must be at least 3 characters long";
    }

    if (!formData.clientEmail) {
      errors.clientEmail = "Email is required";
    } else if (!validateEmail(formData.clientEmail)) {
      errors.clientEmail = "Please enter a valid email address";
    }

    if (!formData.clientPhone) {
      errors.clientPhone = "Phone number is required";
    } else if (!validatePhone(formData.clientPhone)) {
      errors.clientPhone = "Please enter a valid 10-digit phone number";
    }

    if (!selectedDate) {
      errors.date = "Please select a date";
    }

    if (!selectedTimeSlot) {
      errors.timeSlot = "Please select a time slot";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    try {
      const appointmentData = {
        lawyerId,
        clientName: formData.clientName.trim(),
        clientEmail: formData.clientEmail.trim(),
        clientPhone: formData.clientPhone.trim(),
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
          clientName: "",
          clientEmail: "",
          clientPhone: "",
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

  return (
    <>
      <Navbar />
      <div className="appointment-container">
        <h2>Book Appointment with {lawyerDetails?.fullname}</h2>

        <div className="booking-grid">
          <div className="calendar-section">
            <h3>Select Date</h3>
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              minDate={new Date()}
            />
          </div>

          <div className="time-slots-section">
            <h3>Available Time Slots</h3>
            {isLoading ? (
              <p>Loading time slots...</p>
            ) : availableTimeSlots.length > 0 ? (
              <div className="time-slots-grid">
                {availableTimeSlots.map((slot) => (
                  <button
                    key={slot}
                    className={`time-slot ${
                      selectedTimeSlot === slot ? "selected" : ""
                    }`}
                    onClick={() => handleTimeSlotSelect(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : (
              <p>No time slots available for selected date</p>
            )}
          </div>

          <div className="booking-form-section">
            <h3>Appointment Details</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  className={validationErrors.clientName ? "error" : ""}
                />
                {validationErrors.clientName && (
                  <span className="error-text">
                    {validationErrors.clientName}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="clientEmail"
                  value={formData.clientEmail}
                  onChange={handleInputChange}
                  className={validationErrors.clientEmail ? "error" : ""}
                />
                {validationErrors.clientEmail && (
                  <span className="error-text">
                    {validationErrors.clientEmail}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  name="clientPhone"
                  value={formData.clientPhone}
                  onChange={handleInputChange}
                  className={validationErrors.clientPhone ? "error" : ""}
                />
                {validationErrors.clientPhone && (
                  <span className="error-text">
                    {validationErrors.clientPhone}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                />
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
      <Footer />

      <style jsx>{`
        .appointment-container {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 0 1rem;
        }

        .booking-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .time-slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 0.5rem;
          margin-top: 1rem;
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
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          transition: border-color 0.2s;
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

        @media (max-width: 768px) {
          .booking-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
};

export default LawyerAppointment;
