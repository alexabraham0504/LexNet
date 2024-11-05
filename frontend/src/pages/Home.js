import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faFileCircleCheck,
  faCommentsDollar,
  // faGavel,
} from "@fortawesome/free-solid-svg-icons";
import Footer from "../components/footer/home-footer";
import Navbar from "../components/navbar/navbar-admin";
import Header from "../components/header/home-header";
// import "./Home.css"; // Ensure this path is correct

const Home = () => {
  return (
    <>
      <div className="home-page">
        <Header />
        <Navbar />
        <Helmet>
          <title>Lex Net-Home</title>
          <meta
            name="description"
            content="Our Site, led by Lex Net, offers consultancy, assistance, and representation for legal issues and debt recovery before courts and public authorities."
          />
        </Helmet>
        {/* HERO=========== */}
        <div className="container-fluid">
          <div className="row">
            <div className="hero-section">
              <div className="hero-overlay"></div>
              <div className="text-container d-flex flex-column justify-content-start align-items-start pt-6 slide">
                <div className="text-1 fs-2 pb-3">Lex Net</div>
                <div className="text-2 fs-4">
                  Legal Consulting and Services
                  <span className="fw-bold">
                    <br /> Kanjirappally{" "}
                  </span>
                </div>
                <div className="text-3 fst-italic fw-light">
                  "There is no true justice where there is no truth, and justice
                  cannot be found where there is no truth." -{" "}
                  <span>Lucius Annaeus Seneca.</span>
                </div>
              </div>
              {/* horizontal buttons */}
              <div className="horizontal-btn d-none d-md-flex justify-content-center align-items-end w-100 h-100">
                <div className="col flex-grow-1">
                  <Link to="/contact">
                    <button
                      id="horizontal1"
                      className="btn btn-outline-dark btn-lg type-button p-4 w-100 fw-bold"
                      aria-label="Schedule Appointment"
                    >
                      <span className="p-3">
                        <FontAwesomeIcon icon={faCalendarCheck} size="1x" />
                      </span>
                      Schedule Appointment
                    </button>
                  </Link>
                </div>
                <div className="col flex-grow-1">
                  <Link to="/contact">
                    <button
                      className="btn btn-lg btn-outline-dark type-button p-4 w-100 fw-bold"
                      aria-label="Request Evaluation"
                    >
                      <span className="p-3">
                        <FontAwesomeIcon icon={faFileCircleCheck} size="1x" />
                      </span>
                      Request Evaluation
                    </button>
                  </Link>
                </div>
                <div className="col flex-grow-1">
                  <Link to="/useful-info">
                    <button
                      className="btn btn-lg btn-outline-dark type-button p-4 w-100 fw-bold"
                      aria-label="Fees"
                    >
                      <span className="p-3">
                        <FontAwesomeIcon icon={faCommentsDollar} size="1x" />
                      </span>
                      Fees
                    </button>
                  </Link>
                </div>
              </div>
            </div>
            {/* small screens buttons */}
            <div className="mobile-btn d-md-none d-flex justify-content-between pt-2">
              <Link to="/contact">
                <button
                  id="small"
                  className="btn btn-outline-dark type-button p-2 mb-1 btn-md me-1"
                  aria-label="Schedule Appointment"
                >
                  <span className="p-3">
                    <FontAwesomeIcon icon={faCalendarCheck} size="1x" />
                  </span>
                  Schedule Appointment
                </button>
              </Link>
              <Link to="/contact">
                <button
                  className="btn btn-outline-dark type-button p-2 mb-1 btn-md me-1"
                  aria-label="Request Evaluation"
                >
                  <span className="p-3">
                    <FontAwesomeIcon icon={faFileCircleCheck} size="1x" />
                  </span>
                  Request Evaluation
                </button>
              </Link>
              <Link to="/useful-info">
                <button
                  className="btn btn-outline-dark type-button p-2 btn-md"
                  aria-label="Fees"
                >
                  <span className="p-3">
                    <FontAwesomeIcon icon={faCommentsDollar} size="1x" />
                  </span>
                  Fees
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* FACING A LEGAL ISSUE========= */}
        <section className="card py-5 px-3 border-0">
          <div className="row">
            <div className="col-lg-7">
              <div className="card-body">
                <h6 className="guide-text mb-4">INTRO</h6>
                <h5 className="lh-base text-center pb-4">
                  Are you facing a legal issue?
                </h5>
                <p className="text-separator fw-normal">
                  Our Site, led by Lex Net, offers consultancy, assistance, and
                  representation for legal issues and debt recovery before
                  courts and public authorities. We aim to stand by your side to
                  find the best solutions for your problems.
                </p>
              </div>
            </div>
            <div className="col-lg-5 d-flex align-items-center justify-content-center">
              <div>
                <img
                  src="/assets/law-justice.webp"
                  className="intro-img img-fluid d-block rounded-2"
                  alt="a gavel, scales of justice, and law books"
                  style={{ maxHeight: "300px" }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES========= */}
        <div className="">
          <div className="row">
            <div className="col">
              <div className="services-section ">
                <div className="services-overlay "></div>
                <div className="services-content container mt-3">
                  <h6 className=" guide-text">SERVICES</h6>
                  <h5 className="lh-base text-center pb-3">Functions</h5>
                  <div className="row mt-3 gx-3 flex-column flex-md-row ">
                    <div className="col-md-6">
                      <h5 className="color text-center pb-4"></h5>
                      <p className="pt-4 px-2"></p>
                      <div className="py-3 text-center">
                        <Link to="/law-office">
                          <button
                            type="button"
                            className="btn btn-outline-dark mb-4"
                            aria-label="Learn More"
                          >
                            View More...
                          </button>
                        </Link>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <h5 className="color text-center pb-4"></h5>
                      <p className="pt-4 px-2"></p>
                      <div className="py-3 text-center">
                        <Link to="/SearchLawyers">
                          <button
                            type="button"
                            className="btn btn-outline-dark mb-4"
                            aria-label="Learn More"
                          >
                            View More...
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WHO WE ARE */}
        <section className="card py-4 px-3 border-0">
          <div className="row">
            <div className="col-lg-7">
              <div className="card-body">
                <h6 className="guide-text mb-4">ABOUT US</h6>
                <h5 className="lh-base text-center pb-4">
                  Why choose Lex Net?
                </h5>
                <p className="text-separator fw-normal">
                  We understand the complexities of legal matters and are
                  committed to providing you with the best support possible.
                </p>
              </div>
            </div>
            <div className="col-lg-5 d-flex align-items-center justify-content-center">
              <div>
                <image
                  src="/assets/about-us.webp"
                  className="intro-img img-fluid d-block rounded-2"
                  alt="about us image"
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

export default Home;
