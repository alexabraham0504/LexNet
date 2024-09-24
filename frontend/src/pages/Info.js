import React from "react";
import { Helmet } from "react-helmet";

const Info = () => {
  return (
    <div className="info">
      <Helmet>
        <title>Useful Information | Lawyer Bucharest | Alina Marin Law Firm and Insolvency</title>
        
        <meta
          name="description"
          content="Useful information about the Legal Services and Insolvency cabinet of Alina Marin."
        />
      </Helmet>
      <div>
        <h6 className="guide-text ms-3 mt-4">USEFUL INFORMATION</h6>
        <div className="container py-5">
          <div id="accordion" className="accordion">
            {/* Fees Section */}
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingOne">
                <button
                  id="accordion-btn"
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseOne"
                  aria-expanded="false"
                  aria-controls="collapseOne"
                >
                  FEES
                </button>
              </h2>
              <div
                id="collapseOne"
                className="accordion-collapse collapse"
                aria-labelledby="headingOne"
                data-bs-parent="#accordion"
              >
                <div className="accordion-body">
                  <h5>General Principles:</h5>
                  <p>
                    The lawyer's fees are determined in accordance with the provisions of the Lawyer Profession Statute. Extracted texts from: Statute 2004 - Statute of the Lawyer Profession, 25/09/2004 published in the Official Monitor, Part I no. 45 of 13/01/2005, effective from January 13, 2005; Chapter III Professional Activity of the Lawyer; Section 2 Relations between the Lawyer and Client;
                  </p>
                  <h5>Fees for Legal Entities:</h5>
                  <p>
                    In determining fees for legal entities, we consider, in addition to the principles presented below, the possibility of developing payment methods for fees in various aspects such as:
                  </p>
                  <ul>
                    <li>fixed fee</li>
                    <li>hourly fee</li>
                    <li>fixed result fee</li>
                    <li>percentage result fee</li>
                    <li>monthly subscription</li>
                  </ul>
                  <h5>Fees for Individuals:</h5>
                  <p>
                    In determining fees for individuals, the law firm promotes, for the purpose of establishing fees, the principle of direct negotiation, which is based on the following criteria:
                  </p>
                  <ul>
                    <li>complexity of the case and the professional training level of the lawyer handling the case;</li>
                    <li>urgency of the activity;</li>
                    <li>the case and the client's financial capabilities;</li>
                    <li>history of collaboration with the client.</li>
                  </ul>
                </div>
              </div>
            </div>
            {/* Insolvency Section */}
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingTwo">
                <button
                  id="accordion-btn"
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseTwo"
                  aria-expanded="false"
                  aria-controls="collapseTwo"
                >
                  Insolvency
                </button>
              </h2>
              <div
                id="collapseTwo"
                className="accordion-collapse collapse"
                aria-labelledby="headingTwo"
                data-bs-parent="#accordion"
              >
                <div className="accordion-body">
                  <p>
                    Insolvency is the situation in which a company is unable to pay its debts to various creditors – suppliers, tax authorities, or banks.
                  </p>
                  <p>
                    Law 85/2014 describes it as "a state of the debtor's assets characterized by the insufficiency of available funds to pay certain, liquid, and due debts."
                  </p>
                  <p>
                    Insolvency does not automatically mean bankruptcy; it can be opened for the purpose of reorganizing the company based on a plan that may lead to the recovery of the business and exit from insolvency. Only when the reorganization fails can bankruptcy be triggered.
                  </p>
                </div>
              </div>
            </div>
            {/* Reorganization Section */}
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingThree">
                <button
                  id="accordion-btn"
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseThree"
                  aria-expanded="false"
                  aria-controls="collapseThree"
                >
                  Reorganization
                </button>
              </h2>
              <div
                id="collapseThree"
                className="accordion-collapse collapse"
                aria-labelledby="headingThree"
                data-bs-parent="#accordion"
              >
                <div className="accordion-body">
                  <p>
                    The reorganization of a company means its recovery under the Insolvency Law.
                  </p>
                  <p>
                    The goal of insolvency is not to reach bankruptcy and close the company, but to help it recover according to an established plan. In practice, a general insolvency procedure will be opened with the intention of reorganizing the company based on a reorganization plan. According to the provisions of Article 5 point 54 of Law no. 85/2014, reorganization is "the procedure applied to the debtor in insolvency, a legal entity, for the repayment of its debts according to the debt repayment schedule."
                  </p>
                  <p>
                    The reorganization plan involves the drafting, approval, confirmation, implementation, and compliance with a plan that may provide for:
                  </p>
                  <ul>
                    <li>operational and/or financial restructuring of the debtor;</li>
                    <li>corporate restructuring through changes in the capital structure;</li>
                    <li>limiting activity through partial or total liquidation of the debtor's assets;</li>
                  </ul>
                  <p>
                    For this procedure, the payment schedule of the claims is particularly important for participants.
                  </p>
                  <p>
                    Creditors must know what amounts they will receive from the claims they hold against the debtor's assets and when they will be paid in order to conduct their own economic analysis.
                  </p>
                  <p>
                    According to point 53 of Article 5, the debt repayment schedule is defined as "the schedule for their payment mentioned in the reorganization plan. Only if this reorganization plan and the rescue of the company fail will the bankruptcy procedure be initiated.
                  </p>
                </div>
              </div>
            </div>
            {/* Bankruptcy Section */}
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingFour">
                <button
                  id="accordion-btn"
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseFour"
                  aria-expanded="false"
                  aria-controls="collapseFour"
                >
                  Bankruptcy
                </button>
              </h2>
              <div
                id="collapseFour"
                className="accordion-collapse collapse"
                aria-labelledby="headingFour"
                data-bs-parent="#accordion"
              >
                <div className="accordion-body">
                  <p>
                    Bankruptcy intervenes as a last resort when recovery and the reorganization plan are no longer possible.
                  </p>
                  <p>
                    Bankruptcy is the second stage of the insolvency procedure that applies to the debtor for the liquidation of its assets to cover liabilities, followed by the removal of the debtor from the register in which it is registered.
                  </p>
                  <p>
                    If it is found that there are no assets in the debtor's estate or that these are insufficient to cover administrative costs, a decision may be made to dissolve the company.
                  </p>
                  <p>
                    Through the decision to enter bankruptcy, the judge will pronounce the dissolution of the debtor, a legal entity, and will order:
                  </p>
                  <ul>
                    <li>The removal of the debtor's right to administer;</li>
                    <li>Appointment of a legal liquidator in the case of general procedure;</li>
                    <li>Liquidation of the company's assets;</li>
                    <li>Dissolution of the company.</li>
                  </ul>
                </div>
              </div>
            </div>
            {/* Dissolution Section */}
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingFive">
                <button
                  id="accordion-btn"
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseFive"
                  aria-expanded="false"
                  aria-controls="collapseFive"
                >
                  Dissolution
                </button>
              </h2>
              <div
                id="collapseFive"
                className="accordion-collapse collapse"
                aria-labelledby="headingFive"
                data-bs-parent="#accordion"
              >
                <div className="accordion-body">
                  <p>
                    This means the cessation of the commercial activity of the company, meaning the firm can no longer issue invoices for activities provided in its business object, but is only preparing for the liquidation of its assets.
                  </p>
                </div>
              </div>
            </div>
            {/* Liquidation Section */}
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingSix">
                <button
                  id="accordion-btn"
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseSix"
                  aria-expanded="false"
                  aria-controls="collapseSix"
                >
                  Liquidation
                </button>
              </h2>
              <div
                id="collapseSix"
                className="accordion-collapse collapse"
                aria-labelledby="headingSix"
                data-bs-parent="#accordion"
              >
                <div className="accordion-body">
                  <p>
                    Liquidation of a company represents all operations aimed at completing the commercial operations ongoing at the time of the company’s dissolution, converting the company’s assets into cash, paying its debts, and distributing the net assets among the partners. After the final court decision of dissolution, the National Office of the Trade Register, at the company’s request, appoints a judicial liquidator registered in the Insolvency Practitioners' Table.
                  </p>
                </div>
              </div>
            </div>
            {/* Removal Section */}
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingSeven">
                <button
                  id="accordion-btn"
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseSeven"
                  aria-expanded="false"
                  aria-controls="collapseSeven"
                >
                  Removal
                </button>
              </h2>
              <div
                id="collapseSeven"
                className="accordion-collapse collapse"
                aria-labelledby="headingSeven"
                data-bs-parent="#accordion"
              >
                <div className="accordion-body">
                  <p>
                    Removal implies the complete cessation of the commercial company’s capacity to operate. One important aspect to note in the case of removal is that it does not entail the elimination of prior registrations but merely the acknowledgment of the cessation of its activities.
                  </p>
                </div>
              </div>
            </div>
            {/* Merger Section */}
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingEight">
                <button
                  id="accordion-btn"
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseEight"
                  aria-expanded="false"
                  aria-controls="collapseEight"
                >
                  Merger
                </button>
              </h2>
              <div
                id="collapseEight"
                className="accordion-collapse collapse"
                aria-labelledby="headingEight"
                data-bs-parent="#accordion"
              >
                <div className="accordion-body">
                  <p>
                    A merger is an operation by which one or more companies are dissolved without entering liquidation and transfer all their assets to another company in exchange for the distribution of shares to the shareholders of the dissolved company.
                  </p>
                </div>
              </div>
            </div>
            {/* Division Section */}
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingNine">
                <button
                  id="accordion-btn"
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseNine"
                  aria-expanded="false"
                  aria-controls="collapseNine"
                >
                  Division
                </button>
              </h2>
              <div
                id="collapseNine"
                className="accordion-collapse collapse"
                aria-labelledby="headingNine"
                data-bs-parent="#accordion"
              >
                <div className="accordion-body">
                  <p>
                    Division is the operation through which a company, after being dissolved without entering liquidation, transfers its entire assets to several companies, in exchange for distributing shares to the shareholders of the divided company.
                  </p>
                  <h5>Stages of the Merger or Division Process:</h5>
                  <h6>Stage 1</h6>
                  <ul>
                    <li>
                      Submission of the merger project and the decision of the general assembly of the merging companies (by which the examination of the project is waived)
                    </li>
                  </ul>
                  <h6>Stage 2</h6>
                  <ul>
                    <li>
                      Decisions of the general assemblies of the partners of each of the merging companies regarding the approval of the merger
                    </li>
                    <li>
                      The updated articles of incorporation of the absorbing company according to the changes made
                    </li>
                    <li>
                      Proof of publication in the Official Monitor of the Merger Project.
                    </li>
                    <li>Financial situation for the merger</li>
                    <li>Information from the fiscal record</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Info;
