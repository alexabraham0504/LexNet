import React, { useState } from "react";

const AppointmentScheduling = () => {
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({
    clientName: "",
    date: "",
    time: "",
    notes: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setAppointments((prev) => [
      ...prev,
      { ...form, id: Date.now() },
    ]);
    setForm({ clientName: "", date: "", time: "", notes: "" });
    alert("Appointment scheduled successfully!");
  };

  const handleDelete = (id) => {
    setAppointments((prev) => prev.filter((appt) => appt.id !== id));
    alert("Appointment cancelled successfully!");
  };

  return (
    <div style={styles.appointmentSchedulingPage}>
      <div style={styles.appointmentContainer}>
        <h2 style={styles.appointmentTitle}>Appointment Scheduling</h2>

        {/* Appointment Form */}
        <form onSubmit={handleSubmit} style={styles.appointmentForm}>
          <div style={styles.formGroup}>
            <label htmlFor="clientName">Client Name:</label>
            <input
              type="text"
              name="clientName"
              value={form.clientName}
              onChange={handleChange}
              required
              style={styles.formInput}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="date">Date:</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              style={styles.formInput}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="time">Time:</label>
            <input
              type="time"
              name="time"
              value={form.time}
              onChange={handleChange}
              required
              style={styles.formInput}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="notes">Notes:</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              style={styles.formTextarea}
            />
          </div>

          <button type="submit" style={styles.btnSchedule}>
            Schedule Appointment
          </button>
        </form>

        {/* Appointment List */}
        <div style={styles.appointmentList}>
          <h3 style={styles.appointmentListTitle}>Scheduled Appointments</h3>
          {appointments.length === 0 ? (
            <p>No appointments scheduled.</p>
          ) : (
            <ul style={styles.appointmentItems}>
              {appointments.map((appt) => (
                <li key={appt.id} style={styles.appointmentItem}>
                  <div>
                    <strong>{appt.clientName}</strong> - {appt.date} at {appt.time}
                  </div>
                  <div style={styles.appointmentActions}>
                    <button
                      style={styles.btnCancel}
                      onClick={() => handleDelete(appt.id)}
                    >
                      Cancel
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

// Styles
const styles = {
  appointmentSchedulingPage: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    // backgroundImage: "url('/assets/appointment-bg.jpg')", // Update with your background image
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  appointmentContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    maxWidth: "600px",
    width: "100%",
  },
  appointmentTitle: {
    textAlign: "center",
    color: "#2d6da5",
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "2rem",
  },
  appointmentForm: {
    marginBottom: "2rem",
  },
  formGroup: {
    marginBottom: "1.5rem",
  },
  formInput: {
    width: "100%",
    padding: "0.9rem",
    border: "1px solid #c2b697",
    borderRadius: "6px",
    fontSize: "1rem",
    backgroundColor: "#f9f9f9",
  },
  formTextarea: {
    width: "100%",
    padding: "0.9rem",
    border: "1px solid #c2b697",
    borderRadius: "6px",
    fontSize: "1rem",
    backgroundColor: "#f9f9f9",
    height: "100px",
    resize: "vertical",
  },
  btnSchedule: {
    display: "block",
    width: "100%",
    padding: "0.9rem",
    backgroundColor: "#2d6da5",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer",
  },
  appointmentList: {
    marginTop: "2rem",
  },
  appointmentListTitle: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginBottom: "1rem",
  },
  appointmentItems: {
    listStyle: "none",
    padding: 0,
  },
  appointmentItem: {
    padding: "1rem",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
    marginBottom: "1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appointmentActions: {
    display: "flex",
    gap: "1rem",
  },
  btnCancel: {
    backgroundColor: "#d9534f",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default AppointmentScheduling;
