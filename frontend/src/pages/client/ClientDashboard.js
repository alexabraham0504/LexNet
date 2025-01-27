import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faSearch,
  faGavel,
  faFileAlt,
} from "@fortawesome/free-solid-svg-icons";
import Navbar from "../../components/navbar/navbar-client";
import Footer from "../../components/footer/footer-client";

const ClientDashboard = () => {
  const [cases, setCases] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [statusUpdates, setStatusUpdates] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const casesResponse = await axios.get(
          "http://localhost:5000/api/cases"
        );
        setCases(casesResponse.data);

        const appointmentsResponse = await axios.get(
          "http://localhost:5000/api/appointments"
        );
        setAppointments(appointmentsResponse.data);

        const messagesResponse = await axios.get(
          "http://localhost:5000/api/messages"
        );
        setMessages(messagesResponse.data);

        const documentsResponse = await axios.get(
          "http://localhost:5000/api/documents"
        );
        setDocuments(documentsResponse.data);

        const statusUpdatesResponse = await axios.get(
          "http://localhost:5000/api/statusUpdates"
        );
        setStatusUpdates(statusUpdatesResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleCaseDetails = () => {
    // navigate("/lawyeravailabilityclient");
  };

  return (
    <>
      <div className="client-dashboard-page">
        <Navbar />
        <Helmet>
          <title>Client Dashboard - Lex Net</title>
        </Helmet>

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

              <div className="horizontal-btn d-none d-md-flex justify-content-center align-items-end w-100 h-100">
                {[
                  // { to: "/Profile", icon: faUser, label: "Me" },
                  { to: "/LawyerSearch", icon: faSearch, label: "Search" },
                  { to: "/IPC", icon: faGavel, label: "IPC" },
                  {
                    onClick: handleCaseDetails,
                    icon: faFileAlt,
                    label: "Case Details",
                  },
                ].map((button, index) => (
                  <div key={index} className="col flex-grow-1">
                    {button.to ? (
                      <Link to={button.to}>
                        <button
                          className="btn btn-lg btn-outline-dark type-button p-4 w-100 fw-bold"
                          aria-label={button.label}
                        >
                          <span className="p-3">
                            <FontAwesomeIcon icon={button.icon} size="1x" />
                          </span>
                          {button.label}
                        </button>
                      </Link>
                    ) : (
                      <button
                        onClick={button.onClick}
                        className="btn btn-lg btn-outline-dark type-button p-4 w-100 fw-bold"
                        aria-label={button.label}
                      >
                        <span className="p-3">
                          <FontAwesomeIcon icon={button.icon} size="1x" />
                        </span>
                        {button.label}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>

      <style>
        {`
          .client-dashboard-page {
            font-size: 0.9rem;
            max-width: 100%;
          }
          .hero-section {
            background-image: url("/assets/hero.webp");
            height: 600px;
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
