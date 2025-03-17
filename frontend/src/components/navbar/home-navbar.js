import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { navbarStyles } from "./navbar-styles";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show navbar at the top of the page
      if (currentScrollY < 50) {
        setScrolled(false);
        setHidden(false);
        setLastScrollY(currentScrollY);
        return;
      }

      // Always show navbar at the bottom of the page
      if ((window.innerHeight + currentScrollY) >= document.documentElement.scrollHeight) {
        setHidden(false);
        setScrolled(true);
        setLastScrollY(currentScrollY);
        return;
      }

      // Handle scroll direction for other positions
      if (currentScrollY > lastScrollY) {
        // Scrolling down
        setHidden(true);
      } else {
        // Scrolling up
        setHidden(false);
      }

      setScrolled(currentScrollY > 50);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]);

  const links = [
    { path: "/", name: "Home" },
    { 
      path: "/aboutus", 
      name: "Aboutus",
      state: { from: 'home' }
    },
    { 
      path: "/contact", 
      name: "Contact",
      state: { from: 'home' }
    },
  ];

  return (
    <div className={`nav ${scrolled ? "scrolled" : ""} ${hidden ? "hidden" : ""}`}>
      <nav
        className="navbar navbar-dark w-100 navbar-expand-md slide-in"
        style={styles.navbar}
      >
        <div className="container-xxl">
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
          <div
            className="collapse navbar-collapse justify-content-end align-center"
            id="main-nav"
          >
            <ul className="navbar-nav">
              {links.map(({ path, name, state }, index) => (
                <li className="nav-item mx-3 mb-2" key={index}>
                  <NavLink
                    to={path}
                    state={state}
                    style={({ isActive }) => ({
                      textDecoration: "none",
                      color: isActive ? "#c2b697" : "#fff",
                      borderBottom: isActive ? "1px solid #c2b697" : "none",
                      paddingBottom: isActive ? "5px" : "0",
                    })}
                  >
                    {name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
      
      <style>
        {`
          .nav {
            position: relative;
            z-index: 100;
            width: 100%;
            background-color: #02182b;
          }
          
          .nav.scrolled {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            animation: slideDown 0.3s ease-in-out;
          }
          
          .nav.hidden {
            transform: translateY(-100%);
            transition: transform 0.3s ease-in-out;
          }
          
          @keyframes slideDown {
            from {
              transform: translateY(-100%);
            }
            to {
              transform: translateY(0);
            }
          }
          
          .logo-title {
            color: white;
            margin-left: 10px;
            font-size: 1.5rem;
          }
          
          /* Ensure navbar is below header when not scrolled */
          body {
            padding-top: 0 !important;
          }
        `}
      </style>
    </div>
  );
};

// Styles
const styles = {
  navbar: {
    backgroundColor: "#02182b",
    transition: "all 0.3s ease",
  },
};

export default Navbar;
