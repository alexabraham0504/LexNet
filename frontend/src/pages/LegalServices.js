import React from "react";
import { Helmet } from "react-helmet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGavel,
  faScaleBalanced,
  faTruck,
  faPeopleLine,
  faBriefcase,
  faScroll,
} from "@fortawesome/free-solid-svg-icons";

const LegalServices = () => {
  return (
    <>
      <div className="legal-services">
        <Helmet>
          <title>
            Legal Services | Lawyer Bucharest | Law and Insolvency Office Alina Marin
          </title>

          <meta
            name="description"
            content="We offer legal consultancy and specialized assistance in a range of practice areas, including civil law, criminal law, enforcement, family law, labor law, commercial and corporate law."
          />
        </Helmet>
        <div>
          <h6 className="guide-text ms-3 mt-4">LEGAL SERVICES</h6>
          <div className="pt-4 text-center">
            <h5 className="fw-bold text-center pb-1">
              Comprehensive Legal Services
            </h5>
            <h6 className="fw-bold subtitle lh-lg text-center px-5 pb-4">
              We offer legal consultancy and specialized assistance in a range of practice areas
            </h6>
          </div>
          <div className="row g-5 px-5 pt-4 ">
            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="card h-100 ">
                <div class="civil card-img-top">
                  <div class="overlay"></div>
                </div>
                <div className="card-body text-center text-white py-4">
                  <FontAwesomeIcon
                    icon={faScaleBalanced}
                    size="2x"
                    className="law-icon pb-3"
                  />
                  <h6 className="card-title pb-2">CIVIL LAW</h6>
                  <p className="card-text mx-1">
                    Legal consultancy, assistance, and representation in court, drafting lawsuits. We help you resolve legal issues efficiently.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="card h-100">
                <div class="criminal card-img-top">
                  <div class="overlay"></div>
                </div>
                <div className="card-body text-center text-white py-4">
                  <FontAwesomeIcon
                    icon={faGavel}
                    size="2x"
                    className="law-icon pb-3"
                  />
                  <h6 className="card-title pb-2">CRIMINAL LAW</h6>
                  <p className="card-text mx-1">
                    Legal assistance and representation in criminal investigations and in court, drafting complaints and appeals against criminal actions and decisions, drafting rehabilitation requests.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="card h-100">
                <div class="enforcement card-img-top">
                  <div class="overlay"></div>
                </div>
                <div className="card-body text-center text-white py-4">
                  <FontAwesomeIcon
                    icon={faTruck}
                    size="2x"
                    className="law-icon pb-3"
                  />
                  <h6 className="card-title pb-2">ENFORCEMENT</h6>
                  <p className="card-text mx-1">
                    In enforcement matters, services are provided regardless of whether you are a creditor or debtor. Inaction can have serious consequences in these procedures, for both parties.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="card h-100">
                <div class="family card-img-top">
                  <div class="overlay"></div>
                </div>
                <div className="card-body text-center text-white py-4">
                  <FontAwesomeIcon
                    icon={faPeopleLine}
                    size="2x"
                    className="pb-3 law-icon"
                  />
                  <h6 className="card-title pb-2">
                    FAMILY LAW - DIVORCE AND ASSETS
                  </h6>
                  <p className="card-text mx-1">
                    Legal assistance and representation in divorce, asset division, parental authority, child support, and visitation rights.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="card h-100">
                <div class="labor card-img-top">
                  <div class="overlay"></div>
                </div>
                <div className="card-body text-center text-white py-4">
                  <FontAwesomeIcon
                    icon={faBriefcase}
                    size="2x"
                    className="law-icon pb-3"
                  />
                  <h6 className="card-title pb-2">LABOR LAW</h6>
                  <p className="card-text mx-1">
                    We offer professional legal services, including drafting appeals against dismissal decisions, disciplinary sanctions, forcing employers to pay wages, and preparing legal opinions on labor law.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="card h-100">
                <div class="business card-img-top">
                  <div class="overlay"></div>
                </div>
                <div className="card-body text-center text-white py-4">
                  <FontAwesomeIcon
                    icon={faScroll}
                    size="2x"
                    className="law-icon pb-3"
                  />
                  <h6 className="card-title pb-2">
                    COMMERCIAL AND CORPORATE LAW
                  </h6>
                  <p className="card-text mx-1">
                    Formation of companies at the Trade Register, changing registered office, opening/closing work points, drafting incorporation acts, and general meeting resolutions.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="container py-4 ">
            <p className="more-services py-4">
              Other areas where we provide consultancy, assistance, and representation in court or before other state institutions: DEBT RECOVERY, PENSIONS AND OTHER SOCIAL SECURITY RIGHTS, HOMEOWNERS ASSOCIATIONS, FINES COMPLAINTS, CAR ACCIDENT COMPENSATION, drafting applications and other documents specific to legal activities.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LegalServices;
