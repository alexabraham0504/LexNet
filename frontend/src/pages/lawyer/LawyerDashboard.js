import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Navbar from "../../components/navbar/navbar-lawyer";
import Footer from "../../components/footer/footer-lawyer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCog, faFileAlt } from "@fortawesome/free-solid-svg-icons";

const LawyerDashboard = () => {
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

        {/* HERO SECTION */}
        <div className="container-fluid">
          <div className="row">
            <div className="hero-section">
              <div className="hero-overlay"></div>
              <div className="text-container d-flex flex-column justify-content-start align-items-start pt-6 slide">
                <div className="text-1 fs-2 pb-3">Welcome, Lawyer!</div>
                <div className="text-2 fs-4">
                  Manage your cases and appointments efficiently
                </div>
              </div>

              {/* Horizontal Buttons */}
              <div className="horizontal-btn d-none d-md-flex justify-content-center align-items-end w-100 h-100">
                <div className="col flex-grow-1">
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
                </div>

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
        `}
      </style>
    </>
  );
};

export default LawyerDashboard;
