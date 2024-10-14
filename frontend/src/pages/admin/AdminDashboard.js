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
// import Header from "../../components/header/header-admin";
import Navbar from "../../components/navbar/navbar-admin";
import Footer from "../../components/footer/footer-admin";

const AdminDashboard = () => {
  return (
    <>
      <div className="admin-dashboard-page">
        {/* <Header/> */}
        <Navbar />
        <Helmet>
          <title>Admin Dashboard - Lex Net</title>
          <meta
            name="description"
            content="Admin dashboard for managing Lex Net legal services."
          />
        </Helmet>

        {/* HERO SECTION */}
        <div className="container-fluid">
          <div className="row">
            <div className="hero-section">
              <div className="hero-overlay"></div>
              <div className="text-container d-flex flex-column justify-content-start align-items-start pt-6 slide">
                <div className="text-1 fs-2 pb-3">Admin Dashboard</div>
                <div className="text-2 fs-4">
                  Manage <span className="fw-bold">Lex Net Platform</span>
                </div>
                <div className="text-3 fst-italic fw-light">
                  "The good of the people is the greatest law." - Marcus Tullius
                  Cicero
                </div>
              </div>

              {/* Admin actions buttons */}
              <div className="horizontal-btn d-none d-md-flex justify-content-center align-items-end w-100 h-100">
                <div className="col flex-grow-1">
                  <Link to="/ContentModeration">
                    <button
                      className="btn btn-outline-dark btn-lg type-button p-4 w-100 fw-bold"
                      aria-label="Content Moderation"
                    >
                      <span className="p-3">
                        <FontAwesomeIcon icon={faUsers} size="1x" />
                      </span>
                      Content Moderation
                    </button>
                  </Link>
                </div>
                <div className="col flex-grow-1">
                  <Link to="/LawyerVerification">
                    <button
                      className="btn btn-outline-dark btn-lg type-button p-4 w-100 fw-bold"
                      aria-label="Lawyer Verfication"
                    >
                      <span className="p-3">
                        <FontAwesomeIcon icon={faUserCheck} size="1x" />
                      </span>
                      Lawyer Verification
                    </button>
                  </Link>
                </div>
                <div className="col flex-grow-1">
                  <Link to="/Platform">
                    <button
                      className="btn btn-outline-dark btn-lg type-button p-4 w-100 fw-bold"
                      aria-label="Platform"
                    >
                      <span className="p-3">
                        <FontAwesomeIcon icon={faLaptopCode} size="1x" />
                      </span>
                      Platform
                    </button>
                  </Link>
                </div>
                <div className="col flex-grow-1">
                  <Link to="/ReportsAnalytics">
                    <button
                      className="btn btn-outline-dark btn-lg type-button p-4 w-100 fw-bold"
                      aria-label="Reports Analytics"
                    >
                      <span className="p-3">
                        <FontAwesomeIcon icon={faChartLine} size="1x" />
                      </span>
                      Reports Analytics
                    </button>
                  </Link>
                </div>
                <div className="col flex-grow-1">
                  <Link to="/UserManagement">
                    <button
                      className="btn btn-outline-dark btn-lg type-button p-4 w-100 fw-bold"
                      aria-label="User Management"
                    >
                      <span className="p-3">
                        <FontAwesomeIcon icon={faUserCog} size="1x" />
                      </span>
                      User Management
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Buttons for small screens */}
            <div className="mobile-btn d-md-none d-flex justify-content-between pt-2">
              <Link to="/ContentModeration">
                <button
                  className="btn btn-outline-dark type-button p-2 mb-1 btn-md me-1"
                  aria-label="Conetent Moderation"
                >
                  <span className="p-3">
                    <FontAwesomeIcon icon={faUsers} size="1x" />
                  </span>
                  Content Moderation
                </button>
              </Link>
              <Link to="/LawyerVerification">
                <button
                  className="btn btn-outline-dark type-button p-2 mb-1 btn-md me-1"
                  aria-label="Lawyer Verification"
                >
                  <span className="p-3">
                    <FontAwesomeIcon icon={faUserCheck} size="1x" />
                  </span>
                  Lawyer Verification
                </button>
              </Link>
              <Link to="/Platform">
                <button
                  className="btn btn-outline-dark type-button p-2 btn-md"
                  aria-label="Platfrom"
                >
                  <span className="p-3">
                    <FontAwesomeIcon icon={faLaptopCode} size="1x" />
                  </span>
                  Platform
                </button>
              </Link>
              <Link to="/ReportsAnalytics">
                <button
                  className="btn btn-outline-dark type-button p-2 btn-md"
                  aria-label="Reports Analytics"
                >
                  <span className="p-3">
                    <FontAwesomeIcon icon={faChartLine} size="1x" />
                  </span>
                  Reports Analytics
                </button>
              </Link>
              <Link to="/UserManagement">
                <button
                  className="btn btn-outline-dark type-button p-2 btn-md"
                  aria-label="UserManagement"
                >
                  <span className="p-3">
                    <FontAwesomeIcon icon={faUserCog} size="1x" />
                  </span>
                  User Management
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* ADMIN SERVICES SECTION */}
        <section className="card py-5 px-3 border-0">
          <div className="row">
            <div className="col-lg-7">
              <div className="card-body">
                <h6 className="guide-text mb-4">ADMINISTRATION</h6>
                <h5 className="lh-base text-center pb-4">
                  Manage your platform
                </h5>
                <p className="text-separator fw-normal">
                  As an administrator, you have full control over the platform's
                  users, lawyers, and cases. Monitor activity, manage legal
                  issues, and ensure smooth operation.
                </p>
              </div>
            </div>
            <div className="col-lg-5 d-flex align-items-center justify-content-center">
              <div>
                <img
                  src="/assets/admin-dashboard.webp"
                  className="intro-img img-fluid d-block rounded-2"
                  alt="Admin dashboard"
                  style={{ maxHeight: "300px" }}
                />
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>

      <style>
        {`
          .admin-dashboard-page {
            font-size: 0.9rem;
            max-width: 100%;
          }
          .hero-section {
            background-image: url("/assets/admin.jpg");
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
          .text-1, .text-2 {
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

export default AdminDashboard;
