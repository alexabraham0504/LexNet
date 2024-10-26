import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet";
import Navbar from "../../components/navbar/navbar-client";
import Footer from "../../components/footer/footer-client";
// import Header from "../../components/header/header-client";

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
    <>
      <div className="client-dashboard-page">
        {/* <Header /> */}
        <Navbar />
        <Helmet>
          <title>Client Dashboard - Lex Net</title>
          <meta
            name="description"
            // content="Admin dashboard for managing Lex Net legal services."
          />
        </Helmet>

        {/* Hero Section */}
        <div className="container-fluid">
          <div className="row">
            <div className="hero-section">
              <div className="hero-overlay"></div>
              <div className="text-container d-flex flex-column justify-content-start align-items-start pt-6 slide">
                <div className="text-1 fs-2 pb-3">Client Dashboard</div>
                <div className="text-2 fs-4">
                  Manage <span className="fw-bold">Your Legal Cases</span>
                </div>
                <div className="text-3 fst-italic fw-light">
                  "Let justice be done though the heavens fall." - Legal Maxim
                </div>
              </div>

              {/* Client actions buttons */}
              <div className="horizontal-btn d-none d-md-flex justify-content-around align-items-end w-100 h-100">
                {[
                  { to: "/ClientChatPage", icon: "comments", label: "Chat" },
                  { to: "/Appoint", icon: "calendar-alt", label: "Book" },
                  { to: "/Review", icon: "star", label: "Rate" },
                  { to: "/Profile", icon: "user", label: "Me" },
                  { to: "/LawyerSearch", icon: "search", label: "Search" },
                  { to: "/LawyerProfile", icon: "briefcase", label: "Lawyer" },
                  { to: "/IPC", icon: "gavel", label: "IPC" },
                ].map((button, index) => (
                  <div key={index} className="col flex-grow-1 text-center">
                    <Link to={button.to}>
                      <button
                        className="btn btn-outline-dark btn-lg type-button p-4 w-100 fw-bold"
                        aria-label={button.label}
                      >
                        <i className={`fas fa-${button.icon} me-2`}></i>{" "}
                        {button.label}
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons for small screens */}
            <div className="mobile-btn d-md-none d-flex justify-content-between pt-2">
              {[
                {
                  to: "/client-chat-page",
                  icon: "comments",
                  label: "Client Chat",
                },
                { to: "/appoint", icon: "calendar-alt", label: "Book" },
                { to: "/review", icon: "star", label: "Rate" },
                { to: "/profile", icon: "user", label: "Me" },
                { to: "/lawyer-search", icon: "search", label: "Search" },
                { to: "/lawyer-profile", icon: "briefcase", label: "Lawyer" },
                { to: "/ipc", icon: "gavel", label: "IPC" },
              ].map((button, index) => (
                <Link key={index} to={button.to}>
                  <button className="btn btn-outline-dark type-button p-2 mb-1 btn-md me-1">
                    <i className={`fas fa-${button.icon} me-2`}></i>{" "}
                    {button.label}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <Footer />
      </div>

      <style>
        {`
          /* HOME PAGE ====================== */
          .home-page {
            font-size: 0.9rem;
            max-width: 100%;
          }
          .hero-section {
            background-image: url("/assets/hero.webp");
            height: 600px; /* Adjust as necessary */
            background-size: cover;
            background-position: center;
            position: relative;
            display: flex;
          }
          .hero-overlay {
            background-color: rgba(0, 0, 0, 0.6);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }
          .text-container {
            position: relative;
            z-index: 1;
            margin-top: 8rem;
            margin-left: 3rem;
          }
          .text-1,
          .text-2 {
            color: #fff;
            font-family: "Marmelad", sans-serif;
            letter-spacing: 0.1rem;
          }
          .text-2 {
            line-height: 2rem;
          }
          .text-2 span {
            color: rgb(232, 189, 134);
            font-size: 1.3rem;
          }
          .text-3 {
            color: #ebe2d6ff;
            font-size: 0.9rem;
            padding-top: 3rem;
            line-height: 1.8rem;
            width: 60%;
          }
          .text-3 span {
            font-size: 0.7rem;
          }
          .slide {
            opacity: 0;
            transform: translateX(-100%);
            animation: slideLeft 1s forwards;
          }
          @keyframes slideLeft {
            from {
              opacity: 0;
              transform: translateX(-100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          /* Responsive adjustments */
          @media (max-width: 768px) {
            .text-container {
              margin-left: 1rem;
            }
            .text-3 {
              width: 90%;
            }
          }
        `}
      </style>
    </>
  );
};

export default ClientDashboard;
