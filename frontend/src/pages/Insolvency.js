import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

const Insolvency = () => {
  return (
    <>
      <div className="insolvency-page">
        <Helmet>
          <title>
            Insolvency Services | Lawyer Bucharest | Law and Insolvency Office Alina Marin
          </title>
          <meta
            name="description"
            content="We offer consultancy and representation services in insolvency procedures, including judicial liquidation, filing for insolvency proceedings, debtor company analysis, company formation, debt recovery, legal consultancy, and assistance with the application and enforcement of legal regulations."
          />
        </Helmet>

        <div className="container py-5">
          <h6 className="guide-text ms-3 mt-4">INSOLVENCY SERVICES</h6>
          <h5 className="fw-bold text-center pb-1">
            Consultancy and representation services in insolvency
          </h5>
          <h6 className="fw-bold subtitle lh-lg text-center px-5 pb-5">
            We provide specialized assistance in insolvency procedures, from evaluating available options to the completion of the process
          </h6>

          {/* Card for Services */}
          <div className="card">
            <div className="card-img-top insolvency"></div> {/* Ensure CSS is in place */}
            <div className="card-body">
              <div className="card-text text-white py-5">
                <ul className="my-list pt-3">
                  <li>Judicial liquidation / bankruptcy proceedings;</li>
                  <li>
                    Drafting actions regarding requests to initiate insolvency proceedings and representing clients in court, for debtors approved/communicated by UAT;
                  </li>
                  <li>
                    Preparing an analysis of debtor companies by checking recom and the Insolvency Bulletin (BPI subscription available), aimed at identifying companies that have entered insolvency proceedings.
                  </li>
                  <li>Company formation, branches, and work points establishment.</li>
                  <li>
                    Modifying share capital, converting debts into shares, analyzing legal requirements for mergers, dissolutions, demergers, and winding up of companies;
                  </li>
                  <li>Commercial contracts and resolving all contractual issues.</li>
                  <li>
                    Debt recovery:
                    <ul>
                      <li>Notifications, Payment Orders, Small Claim Requests</li>
                      <li>Proof of Debt Claims</li>
                      <li>Representing clients in both common law courts and specialized courts.</li>
                    </ul>
                  </li>
                  <li>Preparing monthly reports on performed activities.</li>
                  <li>Analyzing, preparing, and approving responses to petitioners.</li>
                  <li>Analyzing, preparing, and approving notifications/addresses to individuals/legal entities.</li>
                  <li>Analyzing and approving other legal documents with legal connotations.</li>
                  <li>Drafting requests and any other documents specific to a lawyer's activities.</li>
                  <li>Legal consultancy and assistance regarding the application and enforcement of legal regulations.</li>
                </ul>
              </div>
              <Link to="/contact" className="link">
                <button
                  className="btn btn-outline-dark my-4"
                  type="button"
                  aria-label="Request an Evaluation"
                >
                  Request an Evaluation
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Insolvency;
