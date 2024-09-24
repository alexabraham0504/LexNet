import React from "react";
import Header from "./Header";
import { NavLink } from "react-router-dom";

const Navbar = () => {
  return (
    <>
      <div className="nav">
        <Header />
        <nav className="navbar navbar-dark w-100 navbar-expand-md slide-in">
          <div className="container-xxl">
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
            {/* toggle button for mobile nav */}
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#main-nav"
              aria-controls="main-nav"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            {/* navbar links */}
            <div
              className="collapse navbar-collapse justify-content-end align-center"
              id="main-nav"
            >
              <ul className="navbar-nav">
                <li className="nav-item mx-3 mb-2">
                  <NavLink
                    to="/"
                    style={({ isActive }) => ({
                      textDecoration: "none",
                      color: isActive ? "#c2b697" : "#fff",
                      borderBottom: isActive ? "1px solid #c2b697" : "none",
                      paddingBottom: isActive ? "5px" : "0",
                    })}
                  >
                    Home
                  </NavLink>
                </li>
                <li className="nav-item mx-3 mb-2">
                  <NavLink
                    to="/law-office"
                    style={({ isActive }) => ({
                      textDecoration: "none",
                      color: isActive ? "#c2b697" : "#fff",
                      borderBottom: isActive ? "1px solid #c2b697" : "none",
                      paddingBottom: isActive ? "5px" : "0",
                    })}
                  >
                    Law Office
                  </NavLink>
                </li>
                <li className="nav-item mx-3 mb-2">
                  <NavLink
                    to="/insolvency"
                    style={({ isActive }) => ({
                      textDecoration: "none",
                      color: isActive ? "#c2b697" : "#fff",
                      borderBottom: isActive ? "1px solid #c2b697" : "none",
                      paddingBottom: isActive ? "5px" : "0",
                    })}
                  >
                    Insolvency
                  </NavLink>
                </li>
                <li className="nav-item mx-3 mb-2">
                  <NavLink
                    to="/useful-info"
                    style={({ isActive }) => ({
                      textDecoration: "none",
                      color: isActive ? "#c2b697" : "#fff",
                      borderBottom: isActive ? "1px solid #c2b697" : "none",
                      paddingBottom: isActive ? "5px" : "0",
                    })}
                  >
                    Useful Info
                  </NavLink>
                </li>
                <li className="nav-item mx-3 mb-2">
                  <NavLink
                    to="/contact"
                    style={({ isActive }) => ({
                      textDecoration: "none",
                      color: isActive ? "#c2b697" : "#fff",
                      borderBottom: isActive ? "1px solid #c2b697" : "none",
                      paddingBottom: isActive ? "5px" : "0",
                    })}
                  >
                    Contact
                  </NavLink>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Navbar;
