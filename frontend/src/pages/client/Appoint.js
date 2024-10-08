import React, { useState } from "react";

const Appoint = () => {
  const [appointments, setAppointments] = useState([]);
  const [lawyerId, setLawyerId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleBookAppointment = () => {
    const newAppointment = { lawyerId, date, time };
    setAppointments((prevAppointments) => [...prevAppointments, newAppointment]);
    resetForm();
  };

  const resetForm = () => {
    setLawyerId("");
    setDate("");
    setTime("");
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Schedule an Appointment</h2>
      <div style={styles.formContainer}>
        <label style={styles.label}>Select Lawyer</label>
        <input
          type="text"
          value={lawyerId}
          onChange={(e) => setLawyerId(e.target.value)}
          placeholder="Enter lawyer ID or name"
          style={styles.input}
        />
        <label style={styles.label}>Select Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={styles.input}
        />
        <label style={styles.label}>Select Time</label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleBookAppointment} style={styles.button}>
          Book Appointment
        </button>
      </div>
      <h3 style={styles.appointmentsHeader}>Upcoming Appointments</h3>
      <div style={styles.appointmentsList}>
        {appointments.length === 0 ? (
          <p style={styles.noAppointments}>No appointments scheduled.</p>
        ) : (
          appointments.map((appointment, index) => (
            <div key={index} style={styles.appointmentItem}>
              <p>Lawyer ID: {appointment.lawyerId}</p>
              <p>Date: {appointment.date}</p>
              <p>Time: {appointment.time}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Styles
const styles = {
  container: {
    padding: "20px",
    maxWidth: "600px",
    margin: "0 auto",
    border: "1px solid #ccc",
    borderRadius: "6px",
    backgroundColor: "#f9f9f9",
  },
  header: {
    textAlign: "center",
    fontSize: "24px",
    marginBottom: "20px",
    color: "#2d6da5",
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    marginBottom: "5px",
    color: "#333",
  },
  input: {
    padding: "10px",
    marginBottom: "15px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#2d6da5",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginBottom: "20px",
  },
  appointmentsHeader: {
    marginTop: "30px",
    fontSize: "20px",
    color: "#2d6da5",
  },
  appointmentsList: {
    borderTop: "1px solid #ccc",
    paddingTop: "10px",
  },
  appointmentItem: {
    marginBottom: "10px",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
  },
  noAppointments: {
    color: "#999",
  },
};

export default Appoint;
