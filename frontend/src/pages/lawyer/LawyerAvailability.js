import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";
import Navbar from "../../components/navbar/navbar-lawyer";
import Footer from "../../components/footer/footer-lawyer";

const LawyerAvailability = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [newTimeSlot, setNewTimeSlot] = useState("");
  const [existingAvailability, setExistingAvailability] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch existing availability when date is selected
  useEffect(() => {
    const fetchAvailability = async () => {
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
        const response = await axios.get(
          `http://localhost:5000/api/lawyer/availability/${lawyerId}/${formattedDate}`
        );

        if (response.data.availability) {
          setExistingAvailability(response.data.availability);
          setTimeSlots(response.data.availability.timeSlots);
        } else {
          setExistingAvailability(null);
          setTimeSlots([]);
        }
      } catch (error) {
        console.error("Error fetching availability:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
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

  return (
    <>
      <Navbar />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "20px",
          minHeight: "calc(100vh - 160px)",
        }}
      >
        <div style={{ width: "40%" }}>
          <h2>Select a Date</h2>
          <Calendar onChange={handleDateChange} value={selectedDate} />
        </div>

        <div style={{ width: "55%" }}>
          {isLoading ? (
            <p>Loading...</p>
          ) : selectedDate ? (
            <>
              <h2>Manage Time Slots for {selectedDate.toDateString()}</h2>
              <div style={{ marginBottom: "20px" }}>
                <input
                  type="time"
                  value={newTimeSlot}
                  onChange={(e) => setNewTimeSlot(e.target.value)}
                />
                <button
                  onClick={handleAddTimeSlot}
                  style={{ marginLeft: "10px" }}
                >
                  Add Slot
                </button>
              </div>

              {timeSlots.length > 0 ? (
                <div>
                  <h3>Current Time Slots:</h3>
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {timeSlots.map((slot, index) => (
                      <li key={index} style={{ marginBottom: "10px" }}>
                        {slot}
                        <button
                          onClick={() => handleRemoveTimeSlot(slot)}
                          style={{ marginLeft: "10px", color: "red" }}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div style={{ marginTop: "20px" }}>
                    <button
                      onClick={handleSaveSlots}
                      style={{ marginRight: "10px" }}
                    >
                      {existingAvailability ? "Update Slots" : "Save Slots"}
                    </button>
                    {existingAvailability && (
                      <button
                        onClick={handleDeleteAvailability}
                        style={{ backgroundColor: "red", color: "white" }}
                      >
                        Delete Availability
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p>No time slots added yet.</p>
              )}
            </>
          ) : (
            <p>Please select a date to manage availability.</p>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LawyerAvailability;
