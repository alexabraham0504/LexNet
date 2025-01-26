import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Navbar from "../../components/navbar/navbar-lawyer";
import Footer from "../../components/footer/footer-lawyer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileAlt } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const LawyerDashboard = () => {
  const [lawyerData, setLawyerData] = useState(null);

  useEffect(() => {
    const fetchLawyerData = async () => {
      try {
        // Add debugging logs
        console.log("localStorage email:", localStorage.getItem("userEmail"));
        console.log("sessionStorage email:", sessionStorage.getItem("email"));
        console.log(
          "sessionStorage userEmail:",
          sessionStorage.getItem("userEmail")
        );

        // Try all possible storage locations
        const userEmail =
          localStorage.getItem("userEmail") ||
          sessionStorage.getItem("email") ||
          sessionStorage.getItem("userEmail");

        console.log("Final userEmail value:", userEmail);

        if (!userEmail) {
          console.error("User email not found in any storage location");
          // Uncomment the following line if you want to redirect to login
          // window.location.href = "/login";
          return;
        }

        // First get lawyer details using email
        const response = await axios.get(
          `http://localhost:5000/api/lawyers/user-details/${userEmail}`
        );
        console.log("API Response:", response.data);
        setLawyerData(response.data);
      } catch (error) {
        console.error("Error fetching lawyer data:", error);
        if (error.response) {
          console.log("Error response:", error.response.data);
          console.log("Error status:", error.response.status);
        }
      }
    };

    fetchLawyerData();
  }, []);

  const userName = sessionStorage.getItem("name") || "Lawyer";

  return (
    <>
      <div className="lawyer-dashboard-page">
        <Navbar />
        <Helmet>
          <title>Lawyer Dashboard - Lex Net</title>
          <meta
            name="description"
            content="Dashboard for managing cases and appointments for lawyers on Lex Net."
          />
        </Helmet>

        {lawyerData?.deactivationMessage && (
          <div
            className={`status-alert ${
              !lawyerData.visibleToClients ? "deactivated" : "activated"
            }`}
          >
            <div className="alert-content">
              <h3>
                Account Status:{" "}
                {lawyerData.visibleToClients ? "Activated" : "Deactivated"}
              </h3>
              <p>{lawyerData.deactivationMessage}</p>
            </div>
          </div>
        )}

        {/* HERO SECTION */}
        <div className="container-fluid">
          <div className="row">
            <div className="hero-section">
              <div className="hero-overlay"></div>
              <div className="text-container d-flex flex-column justify-content-start align-items-start pt-6 slide">
                <div className="text-1 fs-2 pb-3">Welcome, {userName}!</div>
                <div className="text-2 fs-4">
                  Manage your cases and appointments efficiently
                </div>
              </div>
              {/* Horizontal Buttons */}
              <div className="horizontal-btn d-none d-md-flex justify-content-center align-items-end w-100 h-100">
                {/* <div className="col flex-grow-1">
                  <Link to="/LawyerRegistration">
                    <button
                      className="btn btn-lg btn-outline-dark type-button p-4 w-100 fw-bold"
                      aria-label="Profile"
                    >
                      <span className="p-3">
                        <FontAwesomeIcon icon={faUserCog} size="1x" />
                      </span>
                      Profile
                    </button>
                  </Link>
                </div> */}

                <div className="col flex-grow-1">
                  <Link to="/lawyercasemanagement">
                    <button
                      className="btn btn-lg btn-outline-dark type-button p-4 w-100 fw-bold"
                      aria-label="Case Details"
                    >
                      <span className="p-3">
                        <FontAwesomeIcon icon={faFileAlt} size="1x" />
                      </span>
                      Case Hub
                    </button>
                  </Link>
                </div>
                <div className="col flex-grow-1">
                  <Link to="/lawyeravailability">
                    <button
                      className="btn btn-lg btn-outline-dark type-button p-4 w-100 fw-bold"
                      aria-label="Case Details"
                    >
                      <span className="p-3">
                        <FontAwesomeIcon icon={faFileAlt} size="1x" />
                      </span>
                      Availability
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>

      <style>
        {`
          .lawyer-dashboard-page {
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
          }
          .status-alert {
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            animation: slideIn 0.3s ease-out;
          }

          .deactivated {
            background-color: #fff3f3;
            border: 1px solid #ffcdd2;
          }

          .activated {
            background-color: #f1f8e9;
            border: 1px solid #c5e1a5;
          }

          .alert-content {
            text-align: center;
          }

          .alert-content h3 {
            margin-bottom: 10px;
            font-size: 1.2rem;
          }

          .deactivated h3 {
            color: #d32f2f;
          }

          .activated h3 {
            color: #2e7d32;
          }

          .alert-content p {
            color: #666;
            margin: 0;
            font-size: 1rem;
            line-height: 1.5;
          }

          @keyframes slideIn {
            from {
              transform: translateY(-20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </>
  );
};

export default LawyerDashboard;
