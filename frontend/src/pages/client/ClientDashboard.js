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
  faMessage,
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
        <div className="main-content">
          <Helmet>
            <title>Client Dashboard - Lex Net</title>
          </Helmet>

          <div className="hero-section">
            <div className="hero-overlay"></div>
            <div className="text-container">
              <div className="text-1">Client Dashboard</div>
              <div className="text-2">
                Manage <span>Your Legal Cases</span>
              </div>
              <div className="text-3">
                "Let justice be done though the heavens fall." - Legal Maxim
              </div>
            </div>

            <div className="button-section">
              <div className="col flex-grow-1">
                <Link to="/LawyerSearch" className="dashboard-link">
                  <button className="btn btn-lg btn-outline-dark type-button p-4 w-100 fw-bold">
                    <span className="p-3">
                      <FontAwesomeIcon icon={faSearch} size="1x" />
                    </span>
                    Lawyer Search
                  </button>
                </Link>
              </div>
              <div className="col flex-grow-1">
                <Link to="/IPC" className="dashboard-link">
                  <button className="btn btn-lg btn-outline-dark type-button p-4 w-100 fw-bold">
                    <span className="p-3">
                      <FontAwesomeIcon icon={faGavel} size="1x" />
                    </span>
                    IPC
                  </button>
                </Link>
              </div>
              <div className="col flex-grow-1">
                <Link to="/cases" className="dashboard-link">
                  <button className="btn btn-lg btn-outline-dark type-button p-4 w-100 fw-bold">
                    <span className="p-3">
                      <FontAwesomeIcon icon={faFileAlt} size="1x" />
                    </span>
                    Cases
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />

        <style jsx="true">{`
          .client-dashboard-page {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            background: #f8f9fa;
          }

          .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
          }

          .hero-section {
            position: relative;
            min-height: calc(100vh - 76px);
            background-image: url("/assets/hero.webp");
            background-size: cover;
            background-position: center;
            display: flex;
            flex-direction: column;
          }

          .hero-overlay {
            position: absolute;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.6);
          }

          .text-container {
            position: relative;
            z-index: 2;
            padding: 4rem 3rem;
            animation: slideLeft 1s forwards;
          }

          .text-1 {
            color: #fff;
            font-size: 2.5rem;
            font-family: "Marmelad", sans-serif;
            margin-bottom: 1rem;
          }

          .text-2 {
            color: #fff;
            font-size: 1.8rem;
            margin-bottom: 2rem;
          }

          .text-2 span {
            color: rgb(232, 189, 134);
            font-weight: bold;
          }

          .text-3 {
            color: #ebe2d6;
            font-size: 1.1rem;
            font-style: italic;
            max-width: 600px;
          }

          .button-section {
            width: 100%;
            display: flex;
            justify-content: center;
            background-color: transparent;
            margin-top: auto;
            position: relative;
            z-index: 2;
            padding: 0;
          }

          .dashboard-link {
            text-decoration: none;
            color: #1a365d;
            width: 100%;
          }

          .btn-outline-dark {
            background-color: rgb(191, 172, 143);
            border: none;
            color: #1a365d;
            transition: all 0.3s ease;
          }

          .btn-outline-dark:hover {
            background-color: #1a365d;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }

          @keyframes slideLeft {
            from {
              opacity: 0;
              transform: translateX(-100px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @media (max-width: 768px) {
            .text-container {
              padding: 2rem 1rem;
            }

            .text-1 {
              font-size: 2rem;
            }

            .text-2 {
              font-size: 1.5rem;
            }

            .text-3 {
              font-size: 1rem;
            }

            .button-section {
              flex-direction: column;
            }

            .col {
              padding: 0;
            }

            .btn-outline-dark {
              border-radius: 0;
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default ClientDashboard;
