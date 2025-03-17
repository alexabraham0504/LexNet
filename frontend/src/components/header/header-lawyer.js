import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faEnvelope, faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <div className="banner w-100 py-2">
      <style>
        {`
          /* HEADER ====================== */
          .banner {
            background-color: #c2b697;
            width: 100%; /* Full width */
            color: #053661;
            font-size: 0.9rem;
            font-weight: 600;
          }
          .banner-icon {
            color: #be7413;
          }
          .banner-icon:hover {
            color: #053661;
          }
          .phone-icon {
            animation: ring 12s ease-in-out infinite;
            transform-origin: 50% 50%;
          }
          @keyframes ring {
            0% {
              transform: scale(1) rotate(0deg);
            }
            10% {
              transform: scale(1.1) rotate(10deg);
            }
            20% {
              transform: scale(1) rotate(-10deg);
            }
            30% {
              transform: scale(1.1) rotate(10deg);
            }
            40% {
              transform: scale(1) rotate(-10deg);
            }
            50% {
              transform: scale(1.1) rotate(10deg);
            }
            60% {
              transform: scale(1) rotate(-10deg);
            }
            70% {
              transform: scale(1.1) rotate(10deg);
            }
            80% {
              transform: scale(1) rotate(-10deg);
            }
            90% {
              transform: scale(1.1) rotate(10deg);
            }
            100% {
              transform: scale(1) rotate(0deg);
            }
          }
        `}
      </style>
      <div className="container">
        <div className="row d-sm-flex flex-column flex-md-row justify-content-between align-items-center">
          <div className="col col-md-3 col-sm-12 text-center mb-md-0">
            <FontAwesomeIcon
              icon={faLocationDot}
              className="banner-icon pe-2"
              size="2x"
            />
            Kanjirappally
          </div>
          <div className="col col-md-3 col-sm-12 text-center mb-md-0">
            <FontAwesomeIcon
              icon={faEnvelope}
              className="banner-icon pe-2"
              size="1x"
            />
            alex@gmail.com
          </div>
          <div className="col col-md-3 col-sm-12 text-center mb-md-0">
            <FontAwesomeIcon
              icon={faPhone}
              className="banner-icon phone-icon pe-2"
              size="1x"
            />
           +91 7034374393
          </div>
          <div className="col col-md-3 col-sm-12 text-center ms-auto">
            <Link to="/login">
              <button className="btn btn-outline-light mx-2">Login</button>
            </Link>
            <Link to="/register">
              <button className="btn btn-outline-light mx-2">Register</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
