import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faUserCheck,
  faLaptopCode,
  faChartLine,
  faUserCog,
} from "@fortawesome/free-solid-svg-icons";
import Navbar from "../../components/navbar/navbar-admin";
import Footer from "../../components/footer/footer-admin";

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard-page">
      <Navbar />
      <div className="main-content">
        <Helmet>
          <title>Admin Dashboard - Lex Net</title>
          <meta
            name="description"
            content="Admin dashboard for managing Lex Net legal services."
          />
        </Helmet>

        <div className="hero-section">
          <div className="hero-overlay"></div>
          <div className="text-container slide">
            <div className="text-1">Admin Dashboard</div>
            <div className="text-2">
              Manage <span>Lex Net Platform</span>
            </div>
            <div className="text-3">
              "The good of the people is the greatest law." - Marcus Tullius Cicero
            </div>
          </div>

          <div className="button-panel">
            <Link to="/ContentModeration" className="panel-button">
              <FontAwesomeIcon icon={faUsers} className="button-icon" />
              Content Moderation
            </Link>

            <Link to="/LawyerVerification" className="panel-button">
              <FontAwesomeIcon icon={faUserCheck} className="button-icon" />
              Lawyer Verification
            </Link>

            <Link to="/Platform" className="panel-button">
              <FontAwesomeIcon icon={faLaptopCode} className="button-icon" />
              Platform
            </Link>

            <Link to="/ReportsAnalytics" className="panel-button">
              <FontAwesomeIcon icon={faChartLine} className="button-icon" />
              Reports Analytics
            </Link>

            <Link to="/UserManagement" className="panel-button">
              <FontAwesomeIcon icon={faUserCog} className="button-icon" />
              User Management
            </Link>
          </div>
        </div>

        <div className="admin-guide">
          <div className="guide-container">
            <div className="guide-header">
              <h6 className="guide-title">ADMINISTRATION</h6>
              <h5 className="guide-subtitle">Manage your platform</h5>
            </div>
            <div className="guide-text-wrapper">
              <p className="guide-text">
                As an administrator, you have full control over the platform's
                users, lawyers, and cases. Monitor activity, manage legal
                issues, and ensure smooth operation.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      <style>
        {`
          .admin-dashboard-page {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            overflow-x: hidden;
            margin: 0;
            padding: 0;
          }

          .main-content {
            flex: 1;
            width: 100vw;
            margin: 0;
            padding: 0;
          }

          .hero-section {
            background-image: url("/assets/admin.jpg");
            height: 600px;
            background-size: cover;
            background-position: center;
            position: relative;
            display: flex;
            flex-direction: column;
            width: 100%;
            margin: 0;
            padding: 0;
          }

          .hero-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.6);
            margin: 0;
          }

          .text-container {
            position: relative;
            z-index: 1;
            padding: 8rem 3rem;
            color: white;
            margin: 0;
          }

          .button-panel {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            display: flex;
            justify-content: stretch;
            margin: 0;
            padding: 0 1rem;
            width: 100%;
          }

          .panel-button {
            background-color: rgb(219, 204, 177);
            color: #0d6efd;
            text-decoration: none;
            padding: 1.2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.8rem;
            flex: 1;
            margin: 0.5rem;
            border-radius: 8px;
            transition: all 0.3s ease;
            font-weight: 500;
            font-size: 1rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          .panel-button:hover {
            background-color: #0d6efd;
            color: white;
          }

          .button-icon {
            font-size: 1.2rem;
            color: inherit;
          }

          .text-1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            font-family: "Marmelad", sans-serif;
            letter-spacing: 0.1rem;
          }

          .text-2 {
            font-size: 1.5rem;
            margin-bottom: 2rem;
            font-family: "Marmelad", sans-serif;
            letter-spacing: 0.1rem;
          }

          .text-2 span {
            color: rgb(232, 189, 134);
          }

          .text-3 {
            font-style: italic;
            color: #ebe2d6;
            font-size: 0.9rem;
            padding-top: 3rem;
            line-height: 1.8rem;
            width: 60%;
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

          @media (max-width: 1200px) {
            .panel-button {
              padding: 1rem;
              font-size: 0.9rem;
            }
          }

          @media (max-width: 768px) {
            .button-panel {
              flex-direction: column;
              padding: 1rem;
            }

            .panel-button {
              margin: 0.25rem 0;
            }
          }

          .admin-guide {
            padding: 4rem 0;
            background-color: #f8f9fa;
            width: 100%;
            margin: 0;
          }

          .guide-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            text-align: left;
            padding-left: calc(2rem + 2cm);
          }

          .guide-header {
            margin-bottom: 2rem;
          }

          .guide-title {
            color: #b8860b;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 1rem;
            letter-spacing: 0.1rem;
          }

          .guide-subtitle {
            color: #333;
            font-size: 1.8rem;
            font-weight: 500;
            margin-bottom: 1.5rem;
          }

          .guide-text-wrapper {
            position: relative;
            padding-left: 1rem;
            border-left: 3px solid #b8860b;
          }

          .guide-text {
            color: #666;
            font-size: 1.1rem;
            line-height: 1.8;
            max-width: 800px;
            margin: 0;
          }

          @media (max-width: 768px) {
            .guide-container {
              padding: 1rem;
              padding-left: calc(1rem + 1cm);
            }

            .guide-subtitle {
              font-size: 1.5rem;
            }

            .guide-text {
              font-size: 1rem;
              line-height: 1.6;
            }
          }
        `}
      </style>
    </div>
  );
};

export default AdminDashboard;
