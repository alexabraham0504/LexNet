import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faEnvelope,
  faLocationDot,
  // faAngleUp,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";

// import WhatsAppWidget from "react-whatsapp-chat-widget";
// import "react-whatsapp-chat-widget/index.css";

const Footer = () => {
  return (
    <>
      <footer>
        <div className="container">
          <div className="row justify-content-center py-4">
            {/* Logo Section */}
            <div className="col-md-4 ps-4 mx-auto text-center">
              <span className="">
                 {/* logo and text aligned */}
            <div className="navbar-brand d-flex align-items-center">
              <img
                src="/assets/LOGO2.png"
                className="img-fluid logo-image"
                alt="scales of justice logo"
                width="70"
                height="70"
              />
              <h2 className="logo-title">Lex Net</h2>
            </div>
            
              </span>
              <p className="content pt-3 px-3">
                Our Site can guide you through legal and financial challenges. We are dedicated to protecting your interests and providing personalized solutions.
              </p>
            </div>

            {/* Contact Section */}
            <div className="col-md-4 text-center">
              <h6 className="pb-2">Contact</h6>
              <div className="d-flex align-items-center justify-content-center flex-column">
                <span className="d-flex align-items-center">
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="contact-icon"
                    title="alex@gmail.com"
                  />
                  <span className="fw-light px-2">alex@gmail.com</span>
                </span>
              </div>
              <div className="mt-3 d-flex align-items-center justify-content-center flex-column">
                <span className="d-flex align-items-center">
                  <FontAwesomeIcon
                    icon={faPhone}
                    className="contact-icon"
                    title="+91 703474393"
                  />
                  <span className="px-2 fw-light">+91 703 437 4393</span>
                </span>
              </div>
              <div className="mt-3 d-flex align-items-center justify-content-center flex-column">
                <span className="d-flex align-items-center">
                  <FontAwesomeIcon
                    icon={faLocationDot}
                    className="contact-icon"
                    title="Kanjirappally"
                  />
                  <span className="px-2 fw-light">Kanjirappally, Kottayam, KERALA</span>
                </span>
              </div>
            </div>

            {/* Schedule Section */}
            <div className="col-md-4 text-center mt-4 mt-md-0">
              <div>
                <h6 className="pb-2">Schedule</h6>
                <p className="fw-light">
                  Monday – Friday: 9AM – 5PM <br /> Saturday – Sunday: Closed
                </p>
                {/* <a href="/sitemap.xml" className="">
                  Sitemap
                </a> */}
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Widget */}
        {/* <div>
          <WhatsAppWidget
            phoneNo="+40769935716"
            position="right"
            iconSize="50"
            iconColor="white"
            iconBgColor="#25D366"
            headerIcon="assets/LOGO2.png"
            headerTxtColor="white"
            headerBgColor="#02182b"
            headerTitle="Law and Insolvency Office"
            headerCaption="Online"
            bodyBgColor="#bbb"
            chatPersonName="Support"
            chatMessage={
              <>
                Hello,
                <br />
                <br /> How can we assist you?
              </>
            }
            footerBgColor="#999"
            btnBgColor="#c2b697"
            btnTxtColor="black"
          />
        </div> */}

        {/* Copyright */}
        <div>
          <div className="bg-dark d-flex align-items-center justify-content-center">
            <hr></hr>
            <p className="copyright mb-0">©2024 Lex Net</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
