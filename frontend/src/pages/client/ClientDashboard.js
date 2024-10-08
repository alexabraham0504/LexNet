import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const ClientDashboard = () => {
  const [cases, setCases] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [statusUpdates, setStatusUpdates] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const casesResponse = await axios.get(
          "http://localhost:3000/api/cases"
        );
        setCases(casesResponse.data);

        const appointmentsResponse = await axios.get(
          "http://localhost:3000/api/appointments"
        );
        setAppointments(appointmentsResponse.data);

        const messagesResponse = await axios.get(
          "http://localhost:3000/api/messages"
        );
        setMessages(messagesResponse.data);

        const documentsResponse = await axios.get(
          "http://localhost:3000/api/documents"
        );
        setDocuments(documentsResponse.data);

        const statusUpdatesResponse = await axios.get(
          "http://localhost:3000/api/statusUpdates"
        );
        setStatusUpdates(statusUpdatesResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div style={styles.dashboardContainer}>
      <Navbar />
      <div style={styles.content}>
        <h1 style={styles.title}>Client Dashboard</h1>

        {/* Recent/Ongoing Cases */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent/Ongoing Cases</h2>
          <ul style={styles.list}>
            {cases.length > 0 ? (
              cases.map((caseItem) => (
                <li key={caseItem.id} style={styles.listItem}>
                  <strong>{caseItem.caseName}</strong> - {caseItem.status}
                  <Link to={`/case/${caseItem.id}`} style={styles.viewDetails}>
                    View Details
                  </Link>
                </li>
              ))
            ) : (
              <li style={styles.listItem}>No recent cases.</li>
            )}
          </ul>
        </section>

        {/* Appointments */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Appointments</h2>
          <ul style={styles.list}>
            {appointments.length > 0 ? (
              appointments.map((appointment) => (
                <li key={appointment.id} style={styles.listItem}>
                  <strong>{appointment.date}</strong> with{" "}
                  {appointment.lawyerName}
                  <Link
                    to={`/appointment/${appointment.id}`}
                    style={styles.viewDetails}
                  >
                    View Details
                  </Link>
                </li>
              ))
            ) : (
              <li style={styles.listItem}>No upcoming appointments.</li>
            )}
          </ul>
        </section>

        {/* Messages */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Messages with Lawyers</h2>
          <ul style={styles.list}>
            {messages.length > 0 ? (
              messages.map((message) => (
                <li key={message.id} style={styles.listItem}>
                  <strong>{message.lawyerName}:</strong> {message.text}
                  <Link to={`/messages/${message.id}`} style={styles.viewDetails}>
                    View Conversation
                  </Link>
                </li>
              ))
            ) : (
              <li style={styles.listItem}>No messages.</li>
            )}
          </ul>
        </section>

        {/* Legal Documents */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Legal Documents</h2>
          <ul style={styles.list}>
            {documents.length > 0 ? (
              documents.map((doc) => (
                <li key={doc.id} style={styles.listItem}>
                  <strong>{doc.fileName}</strong> -{" "}
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.link}
                  >
                    Download
                  </a>
                </li>
              ))
            ) : (
              <li style={styles.listItem}>No legal documents uploaded yet.</li>
            )}
          </ul>
        </section>

        {/* Case Status Updates */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Status Updates</h2>
          <ul style={styles.list}>
            {statusUpdates.length > 0 ? (
              statusUpdates.map((update) => (
                <li key={update.id} style={styles.listItem}>
                  <strong>{update.caseName}</strong> - {update.updateText}
                  <Link to={`/case/${update.caseId}`} style={styles.viewDetails}>
                    View Case
                  </Link>
                </li>
              ))
            ) : (
              <li style={styles.listItem}>No status updates available.</li>
            )}
          </ul>
        </section>
      </div>
      <Footer />
    </div>
  );
};

// Inline Styles
const styles = {
  dashboardContainer: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh", // Ensures the container takes the full viewport height
    backgroundColor: "#f7f7f7",
  },
  content: {
    flex: "1", // Makes the content area grow to take available space
    padding: "2rem",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  title: {
    textAlign: "center",
    color: "#2d6da5",
    marginBottom: "2rem",
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    marginBottom: "2rem",
    padding: "1.5rem",
  },
  sectionTitle: {
    color: "#333333",
    marginBottom: "1rem",
  },
  list: {
    listStyleType: "none",
    padding: "0",
  },
  listItem: {
    padding: "0.75rem 0",
    borderBottom: "1px solid #dddddd",
  },
  viewDetails: {
    marginLeft: "10px",
    textDecoration: "none",
    color: "#ffffff",
    backgroundColor: "#2d6da5",
    padding: "5px 10px",
    borderRadius: "5px",
    fontSize: "0.9rem",
    transition: "background-color 0.3s ease",
  },
  link: {
    color: "#2d6da5",
  },
};

export default ClientDashboard;
