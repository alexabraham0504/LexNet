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
  const [userId, setUserId] = useState(sessionStorage.getItem("userid"));
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const userId = sessionStorage.getItem("userid");
        if (!token || !userId) {
          throw new Error("No authentication token found");
        }
        
        setUserId(userId);
        
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        try {
          const casesResponse = await axios.get(
            "http://localhost:5000/api/cases",
            config
          );
          const transformedCases = casesResponse.data
            .filter(caseItem => !caseItem.isDeleted)
            .map(caseItem => ({
              ...caseItem,
              location: caseItem.location?.address || 'No location specified'
            }));
          setCases(transformedCases);
        } catch (error) {
          console.warn("Cases endpoint error:", error);
          setCases([]);
        }

        try {
          const appointmentsResponse = await axios.get(
            "http://localhost:5000/api/appointments",
            config
          );
          const transformedAppointments = appointmentsResponse.data.map(apt => ({
            ...apt,
            location: apt.location?.address || 'No location specified'
          }));
          setAppointments(transformedAppointments);
        } catch (error) {
          console.warn("Appointments endpoint error:", error);
          setAppointments([]);
        }

        try {
          const messagesResponse = await axios.get(
            "http://localhost:5000/api/messages",
            config
          );
          setMessages(messagesResponse.data || []);
        } catch (error) {
          console.warn("Messages endpoint error:", error);
          setMessages([]);
        }

        try {
          const documentsResponse = await axios.get(
            "http://localhost:5000/api/documents",
            config
          );
          setDocuments(documentsResponse.data || []);
        } catch (error) {
          console.warn("Documents endpoint error:", error);
          setDocuments([]);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.response?.status === 401) {
          navigate('/login');
        }
      }
    };

    fetchData();
  }, []);

  const handleLawyerSearchClick = () => {
    navigate('/client/lawyer-search', {
      state: {
        specialization: '',
        ipcSection: '',
        crimeType: '',
        caseDetails: null
      }
    });
  };

  return (
    <div className="client-dashboard">
      <Navbar />
      <div className="dashboard-container">
        <Helmet>
          <title>Client Dashboard - Lex Net</title>
        </Helmet>

        <div className="hero-section">
          <div className="hero-overlay"></div>
          <div className="dashboard-content">
            <div className="welcome-section">
              <h1 className="dashboard-title">Client Dashboard</h1>
              <h2 className="dashboard-subtitle">
                Manage <span className="highlight">Your Legal Cases</span>
              </h2>
              <p className="dashboard-quote">
                "Let justice be done though the heavens fall." - Legal Maxim
              </p>
            </div>

            <div className="action-cards">
              <div onClick={handleLawyerSearchClick} className="action-card">
                <div className="card-content">
                  <FontAwesomeIcon icon={faSearch} className="card-icon" />
                  <h3>Lawyer Search</h3>
                  <p>Find the right lawyer for your case</p>
                </div>
              </div>

              <Link to="/IPC" className="action-card">
                <div className="card-content">
                  <FontAwesomeIcon icon={faGavel} className="card-icon" />
                  <h3>IPC Sections</h3>
                  <p>Browse Indian Penal Code sections</p>
                </div>
              </Link>

              <Link 
                to={`/case-details/${userId}`} 
                className="action-card"
              >
                <div className="card-content">
                  <FontAwesomeIcon icon={faFileAlt} className="card-icon" />
                  <h3>Case Management</h3>
                  <p>View and manage your legal cases</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
        <Footer />

        <style jsx="true">{`
          .client-dashboard {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }

          .dashboard-container {
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
            align-items: center;
            justify-content: center;
          }

          .hero-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
          }

          .dashboard-content {
            position: relative;
            z-index: 2;
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 3rem 2rem;
            min-height: calc(100vh - 76px);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .welcome-section {
            text-align: center;
            margin: auto 0;
            animation: fadeInUp 0.8s ease;
            padding-bottom: 2rem;
          }

          .dashboard-title {
            color: #fff;
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 1rem;
            font-family: "Marmelad", sans-serif;
          }

          .dashboard-subtitle {
            color: #fff;
            font-size: 2rem;
            margin-bottom: 1.5rem;
          }

          .highlight {
            color: rgb(232, 189, 134);
            font-weight: bold;
          }

          .dashboard-quote {
            color: #ebe2d6;
            font-size: 1.2rem;
            font-style: italic;
            max-width: 600px;
            margin: 0 auto;
          }

          .action-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2rem;
            margin-top: auto;
            animation: fadeInUp 1s ease 0.3s forwards;
            opacity: 0;
            padding-bottom: 2rem;
          }

          .action-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            padding: 2rem;
            text-decoration: none;
            color: white;
            transition: all 0.3s ease;
          }

          .action-card:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.3);
          }

          .card-content {
            text-align: center;
          }

          .card-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            color: rgb(232, 189, 134);
          }

          .card-content h3 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
            color: white;
          }

          .card-content p {
            color: #ebe2d6;
            font-size: 0.9rem;
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @media (max-width: 992px) {
            .action-cards {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 768px) {
            .dashboard-content {
              padding: 2rem 1rem;
            }

            .dashboard-title {
              font-size: 2.5rem;
            }

            .dashboard-subtitle {
              font-size: 1.8rem;
            }

            .action-cards {
              grid-template-columns: 1fr;
              gap: 1rem;
            }

            .action-card {
              padding: 1.5rem;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ClientDashboard;
