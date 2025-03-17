import React from "react";
import { Link } from "react-router-dom";

const LoginHeader = () => {
  return (
    <div className="login-header">
      <div className="contact-info">
        <div className="location-info">
          <i className="fas fa-map-marker-alt"></i>
          <span>Kanjirappally</span>
        </div>
        <div className="email-info">
          <i className="fas fa-envelope"></i>
          <a href="mailto:alex@gmail.com">alex@gmail.com</a>
        </div>
        <div className="phone-info">
          <i className="fas fa-phone-alt"></i>
          <a href="tel:+917034374393">+91 7034374393</a>
        </div>
      </div>
      
      <style jsx>{`
        .login-header {
          background-color: #e6d8b5;
          padding: 10px 20px;
          display: flex;
          justify-content: center;
          width: 100%;
        }
        
        .contact-info {
          display: flex;
          justify-content: space-between;
          width: 100%;
          max-width: 1200px;
        }
        
        .location-info, .email-info, .phone-info {
          display: flex;
          align-items: center;
          color: #02182b;
        }
        
        .location-info i, .email-info i, .phone-info i {
          margin-right: 8px;
          color: #02182b;
        }
        
        a {
          color: #02182b;
          text-decoration: none;
        }
        
        a:hover {
          text-decoration: underline;
        }
        
        @media (max-width: 768px) {
          .contact-info {
            flex-direction: column;
            align-items: center;
          }
          
          .location-info, .email-info, .phone-info {
            margin-bottom: 5px;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginHeader; 