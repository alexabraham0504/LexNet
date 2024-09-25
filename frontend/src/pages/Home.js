import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faFileCircleCheck,
  faCommentsDollar,
  faGavel,
} from "@fortawesome/free-solid-svg-icons";

const Home = () => {
  return (
    <>
      <div className="home-page">
        <Helmet>
          <title>
            Lex Net
          </title>
          <meta
            name="description"
            content="Our Site, led by Lex Net, offers consultancy, assistance, and representation for legal or  issues and debt recovery before courts and public authorities."
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
                  Legal Consulting 
                  <span className="fw-bold">
                    <br></br> Kanjirappally{" "}
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
                  Are you facing a legal  issue?
                </h5>

                <p className="text-separator fw-normal">
                  Our Site, led by Lex Net, offers
                  consultancy, assistance, and representation for legal or
                  insolvency issues and debt recovery before courts and public
                  authorities. We aim to stand by your side to find the best
                  solutions for your problems .
                  
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

                  <h5 className="lh-base text-center pb-3">
                    Client Functions
                  </h5>
                  <div className="row mt-3 gx-3 flex-column flex-md-row ">
                    <div className="col-md-6">
                      <h5 className="color text-center pb-4">
                        IPCLookup
                      </h5>
                      <div className="d-flex align-items-center">
                        {/* <img
                          src="/assets/barou.webp"
                          className="barou img-fluid mx-auto d-block rounded-2"
                          alt="Bar Association Logo"
                          width="150"
                          height="150"
                        /> */}
                      </div>
                      <p className="pt-4 px-2">
                      IPCLookup refers to identifying relevant sections of the Indian Penal Code (IPC) for specific crimes. It helps legal professionals and citizens find applicable laws and penalties, ensuring proper legal interpretation and action under the IPC, India's primary criminal code.
                      </p>
                      <div className="py-3 text-center">
                        <Link to="/law-office">
                          <button
                            type="button"
                            className="btn btn-outline-dark mb-4"
                            aria-label="Learn More"
                          >
                            Learn More...
                          </button>
                        </Link>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <h5 className="color text-center pb-4">
                        LegalServices
                      </h5>
                      <div className="d-flex align-items-center">
                        {/* <img
                          src="/assets/unpir.webp"
                          className="unpir img-fluid mx-auto d-block rounded-2"
                          alt="UNPIR Logo"
                          width="150"
                          height="150"
                        /> */}
                      </div>
                      <p className="pt-4 px-2">
                         The SearchLawyers React component lets users search for lawyers by location, expertise, and fees, sending a GET request via axios and displaying results dynamically.

                        Legal services involve professional assistance from lawyers for handling legal issues like court representation, advice, contracts, and dispute resolution.
                      </p>
                      <div className="py-3 text-center">
                        <Link to="/insolvency">
                          <button
                            type="button"
                            className="btn btn-outline-dark mb-4"
                            aria-label="Learn More"
                          >
                            Learn More...
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
                  We understand the complexities of legal matters and the stress
                  it brings. With professionalism and dedication, we guide our
                  clients through the legal landscape to achieve the best
                  outcomes.
                </p>
              </div>
            </div>
          <div className="col col-md-5 order-md-2 mt-5">
          <div className="square container d-flex flex-column justify-content-center align-items-center py-5 w-50 border border-white border-4 fw-bold">
            {/* <div>
                 <FontAwesomeIcon icon={faGavel} size="2x" />
           </div> */}
                {/* <div>
                </div> */}
                <div>
                  {/* <div>
                    // src="/assets/office-law-people.jpg"
                    //  className="img-fluid d-block rounded-2"
                          alt="Legal office consultation"
                        style={{ maxHeight: "300px" }} 
                  </div> */}


                </div>
          </div>
              </div>

          </div>
        </section>
      </div>
    </>
  );
};

export default Home;
