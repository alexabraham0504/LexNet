import React, { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const LawyerDashboard = () => {
  // Sample data for dashboard
  const [activeCases, setActiveCases] = useState([
    { caseId: 101, clientName: "John Doe", status: "In Progress" },
    { caseId: 102, clientName: "Jane Smith", status: "Pending" },
    { caseId: 103, clientName: "Mark White", status: "Closed" },
  ]);

  const [appointments, setAppointments] = useState([
    { clientName: "John Doe", date: "Sep 26, 2024", time: "10:00 AM" },
    { clientName: "Jane Smith", date: "Sep 27, 2024", time: "2:00 PM" },
  ]);

  const [messages, setMessages] = useState([
    { clientName: "Mark White", message: "Please review the case documents." },
    {
      clientName: "Jane Smith",
      message: "What is the next step for our case?",
    },
  ]);

  const performanceMetrics = {
    clientSatisfaction: "95%",
    successfulCases: 24,
    totalCases: 30,
    engagementRate: "87%",
  };

  return (
    <div style={styles.dashboardPage}>
      <Navbar /> {/* Navbar placed at the top */}
      <div style={styles.dashboardContainer}>
        <h2 style={styles.dashboardTitle}>Lawyer Dashboard</h2>

        {/* Active Cases Overview */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Active Cases Overview</h3>
          <ul style={styles.cardList}>
            {activeCases.map((caseItem) => (
              <li key={caseItem.caseId} style={styles.listItem}>
                <span style={styles.listLabel}>Client:</span>{" "}
                {caseItem.clientName} -{" "}
                <span style={styles.listLabel}>Status:</span> {caseItem.status}
              </li>
            ))}
          </ul>
        </div>

        {/* Upcoming Appointments */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Upcoming Appointments</h3>
          <ul style={styles.cardList}>
            {appointments.map((appointment, index) => (
              <li key={index} style={styles.listItem}>
                <span style={styles.listLabel}>Client:</span>{" "}
                {appointment.clientName} -{" "}
                <span style={styles.listLabel}>Date:</span> {appointment.date}{" "}
                at {appointment.time}
              </li>
            ))}
          </ul>
        </div>

        {/* Client Messages */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Client Messages</h3>
          <ul style={styles.cardList}>
            {messages.map((message, index) => (
              <li key={index} style={styles.listItem}>
                <span style={styles.listLabel}>Client:</span>{" "}
                {message.clientName} -{" "}
                <span style={styles.listLabel}>Message:</span> {message.message}
              </li>
            ))}
          </ul>
        </div>

        {/* Performance Metrics */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Performance Metrics</h3>
          <div style={styles.metricsContainer}>
            <div style={styles.metric}>
              <h4 style={styles.metricValue}>
                {performanceMetrics.clientSatisfaction}
              </h4>
              <p style={styles.metricLabel}>Client Satisfaction</p>
            </div>
            <div style={styles.metric}>
              <h4 style={styles.metricValue}>
                {performanceMetrics.successfulCases}
              </h4>
              <p style={styles.metricLabel}>Successful Cases</p>
            </div>
            <div style={styles.metric}>
              <h4 style={styles.metricValue}>
                {performanceMetrics.totalCases}
              </h4>
              <p style={styles.metricLabel}>Total Cases</p>
            </div>
            <div style={styles.metric}>
              <h4 style={styles.metricValue}>
                {performanceMetrics.engagementRate}
              </h4>
              <p style={styles.metricLabel}>Engagement Rate</p>
            </div>
          </div>
        </div>
      </div>
      <Footer /> {/* Footer placed at the bottom */}
    </div>
  );
};

// Styles
const styles = {
  dashboardPage: {
    display: "flex",
    flexDirection: "column", // Stack items vertically
    minHeight: "100vh",
    backgroundImage: "url('/assets/lawyerdashboard.jpg')", // Uncomment if using a background image
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  dashboardContainer: {
    display: "flex",
    flexDirection: "column", // Ensure contents are stacked vertically
    flex: 1, // Take remaining space
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    maxWidth: "720px",
    margin: "2rem auto", // Center horizontally and add margin
  },
  dashboardTitle: {
    textAlign: "center",
    color: "#2d6da5",
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "2rem",
  },
  card: {
    backgroundColor: "#fff",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    marginBottom: "1.5rem",
  },
  cardTitle: {
    fontSize: "1.5rem",
    color: "#2d6da5",
    marginBottom: "1rem",
  },
  cardList: {
    listStyleType: "none",
    paddingLeft: "0",
    marginBottom: "0",
  },
  listItem: {
    padding: "0.8rem",
    backgroundColor: "#f2f2f2",
    borderRadius: "6px",
    marginBottom: "0.8rem",
  },
  listLabel: {
    fontWeight: "bold",
  },
  metricsContainer: {
    display: "flex",
    justifyContent: "space-between",
  },
  metric: {
    backgroundColor: "#3498db",
    color: "#fff",
    textAlign: "center",
    padding: "1rem",
    borderRadius: "6px",
    width: "23%",
  },
  metricValue: {
    fontSize: "1.8rem",
    margin: "0",
  },
  metricLabel: {
    marginTop: "0.5rem",
    fontSize: "1rem",
  },
};

export default LawyerDashboard;
