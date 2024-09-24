import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faEnvelope, faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <div className="banner w-100 py-2">
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
