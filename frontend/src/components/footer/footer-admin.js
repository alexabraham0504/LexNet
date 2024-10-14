import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLocationDot, faPhone } from "@fortawesome/free-solid-svg-icons";

const Footer = () => {
  return (
    <footer style={styles.footer}>
      <div className="container">
        <div className="row justify-content-center py-4">
          {/* Logo Section */}
          <div className="col-md-4 ps-4 mx-auto text-center">
            <div className="navbar-brand d-flex align-items-center">
              <img
                src="/assets/LOGO2.png"
                className="img-fluid logo-image"
                alt="scales of justice logo"
                style={styles.logoImage}
              />
              <h2 className="logo-title" style={styles.logoText}>Lex Net</h2>
            </div>
            <p className="content pt-3 px-3" style={styles.content}>
              Our Site can guide you through legal and financial challenges. We are dedicated to protecting your interests and providing personalized solutions.
            </p>
          </div>

          {/* Contact Section */}
          <div className="col-md-4 text-center">
            <h6 className="pb-2" style={styles.contactHeader}>Contact</h6>
            <div className="d-flex align-items-center justify-content-center flex-column">
              <span className="d-flex align-items-center">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="contact-icon"
                  title="alex@gmail.com"
                  style={styles.contactIcon}
                />
                <span className="fw-light px-2">alex@gmail.com</span>
              </span>
              <div className="mt-3">
                <span className="d-flex align-items-center">
                  <FontAwesomeIcon
                    icon={faPhone}
                    className="contact-icon"
                    title="+91 703474393"
                    style={styles.contactIcon}
                  />
                  <span className="px-2 fw-light">+91 703 437 4393</span>
                </span>
              </div>
              <div className="mt-3">
                <span className="d-flex align-items-center">
                  <FontAwesomeIcon
                    icon={faLocationDot}
                    className="contact-icon"
                    title="Kanjirappally"
                    style={styles.contactIcon}
                  />
                  <span className="px-2 fw-light">Kanjirappally, Kottayam, KERALA</span>
                </span>
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div className="col-md-4 text-center mt-4 mt-md-0">
            <h6 className="pb-2" style={styles.scheduleHeader}>Schedule</h6>
            <p className="fw-light">
              Monday – Friday: 9AM – 5PM <br /> Saturday – Sunday: Closed
            </p>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div>
        <div style={styles.copyright}>
          <hr />
          <p className="copyright mb-0">©2024 Lex Net</p>
        </div>
      </div>
    </footer>
  );
};

// Styles
const styles = {
  footer: {
    backgroundColor: "#02182b", // Midnight blue
    color: "#e7eaef", // Text color
    fontSize: "0.8rem",
    padding: "20px 0",
  },
  logoImage: {
    maxWidth: "50px",
  },
  logoText: {
    maxWidth: "15px",
    marginLeft: ".5rem",
  },
  content: {
    color: "#c2b697", // Content color
  },
  contactIcon: {
    color: "#be7413", // Contact icon color
    fontSize: "large",
  },
  scheduleHeader: {
    color: "#c2b697", // Schedule header color
  },
  contactHeader: {
    color: "#c2b697", // Contact header color
  },
    container: {
        maxWidth:'100%',
        position: 'relative' // Change if you want fixed positioning
    },
  
  copyright: {
    fontSize: "1.0rem",
    color: "rgb(222, 217, 217)",
    backgroundColor: "#343a40", // Dark background for copyright section
    textAlign: "center",
    padding: "5px 1",
  },
};

export default Footer;
