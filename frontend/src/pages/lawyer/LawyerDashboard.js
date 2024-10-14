import React from "react";
import { Link } from "react-router-dom";
// import Header from "../../components/header/header-lawyer";
import Navbar from "../../components/navbar/navbar-lawyer";
import Footer from "../../components/footer/footer-lawyer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserCog,
  faFileAlt,
  faComments,
  faClipboardList,
  faMoneyBillWave,
  faCalendarPlus,
} from "@fortawesome/free-solid-svg-icons";

const LawyerDashboard = () => {
  return (
    <>
      <div className="lawyer-dashboard-page">
        {/* <Header /> */}
        <Navbar /> {/* Navbar placed at the top */}
        
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
                  <Link to="/ProfileManagement">
                    <button
                      id="horizontal1"
                      className="btn btn-outline-dark btn-lg type-button p-4 w-100 fw-bold"
                      aria-label="ProfileManagement"
                    >
                      <span className="p-3">
                        <FontAwesomeIcon icon={faUserCog} size="1x" />
                      </span>
                      ProfileMgmt
                    </button>
                  </Link>
                </div>
                <div className="col flex-grow-1">
                  <Link to="/LegalDocumentAnalysis">
                    <button
                      className="btn btn-lg btn-outline-dark type-button p-4 w-100 fw-bold"
                      aria-label="LegalDocumentAnalysis"
                    >
                      <span className="p-3">
                        <FontAwesomeIcon icon={faFileAlt} size="1x" />
                      </span>
                      DocAnalysis
                    </button>
                  </Link>
                </div>
                <div className="col flex-grow-1">
                  <Link to="/ClientMessaging">
                    <button
                      className="btn btn-lg btn-outline-dark type-button p-4 w-100 fw-bold"
                      aria-label="ClientMessaging"
                    >
                      <span className="p-3">
                        <FontAwesomeIcon icon={faComments} size="1x" />
                      </span>
                      ClientMsg
                    </button>
                  </Link>
                </div>
                <div className="col flex-grow-1">
                  <Link to="/CaseManagement">
                    <button
                      className="btn btn-lg btn-outline-dark type-button p-4 w-100 fw-bold"
                      aria-label="CaseManagement"
                    >
                      <span className="p-3">
                        <FontAwesomeIcon icon={faClipboardList} size="1x" />
                      </span>
                      CaseMgmt
                    </button>
                  </Link>
                </div>
                <div className="col flex-grow-1">
                  <Link to="/BillingPayment">
                    <button
                      className="btn btn-lg btn-outline-dark type-button p-4 w-100 fw-bold"
                      aria-label="BillingPayment"
                    >
                      <span className="p-3">
                        <FontAwesomeIcon icon={faMoneyBillWave} size="1x" />
                      </span>
                      BillPay
                    </button>
                  </Link>
                </div>
                <div className="col flex-grow-1">
                  <Link to="/AppointmentScheduling">
                    <button
                      className="btn btn-lg btn-outline-dark type-button p-4 w-100 fw-bold"
                      aria-label="AppointmentScheduling"
                    >
                      <span className="p-3">
                        <FontAwesomeIcon icon={faCalendarPlus} size="1x" />
                      </span>
                      AppSched
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Footer /> {/* Footer placed at the bottom */}
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

export default LawyerDashboard;
