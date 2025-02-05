import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import { navbarStyles } from "./navbar-styles";

const Navbar = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const userName = sessionStorage.getItem("name");
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  const handleLogout = async () => {
    // First, clear all sessionStorage items
    sessionStorage.clear();
    // Or if you prefer to remove specific items:
    // sessionStorage.removeItem("name");
    // sessionStorage.removeItem("role");
    // sessionStorage.removeItem("userid");
    // sessionStorage.removeItem("token");

    // Close the dropdown
    setShowDropdown(false);

    // Force navigation to home page
    window.location.href = "/";
    // Alternative approach:
    // navigate("/", { replace: true });
  };

  const links = [
    { path: "/admindashboard", name: "Dashboard" },
    { path: "/aboutus", name: "About Us", state: { from: "admin" } },
    { path: "/contact", name: "Contact", state: { from: "admin" } },
    {
      path: "#",
      name: (
        <div className="user-menu-container">
          <div
            className="user-icon-wrapper"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            title={userName}
          >
            <FaUser className="user-icon" />
          </div>
          {showDropdown && (
            <div className="dropdown-menu show" ref={dropdownRef}>
              <div className="dropdown-header">
                <FaUser className="dropdown-user-icon" />
                <span>{userName}</span>
              </div>

              <div className="dropdown-divider"></div>
              <div className="dropdown-item logout-item" onClick={handleLogout}>
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      ),
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
                      padding: "0 0 5px 0",
                      fontWeight: "normal",
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
    </div>
  );
};

// Styles
const styles = {
  navbar: {
    backgroundColor: "transparent",
    transition: "all 0.3s ease",
  },
};

// Append CSS styles to the document
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = navbarStyles;
document.head.appendChild(styleSheet);

export default Navbar;
