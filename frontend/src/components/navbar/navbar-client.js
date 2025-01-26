import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";

const Navbar_Client = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const userName = sessionStorage.getItem("name");

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

  const handleLogout = () => {
    sessionStorage.clear();
    setShowDropdown(false);
    window.location.href = "/";
  };

  const links = [
    { path: "/clientdashboard", name: "Dashboard" },
    { path: "/aboutus", name: "About Us", state: { from: "client" } },
    { path: "/contact", name: "Contact", state: { from: "client" } },

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
              <NavLink
                to="/profile"
                className="dropdown-item"
                onClick={() => setShowDropdown(false)}
              >
                <span>My Profile</span>
              </NavLink>

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
    <>
      <div className="nav">
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
    </>
  );
};

// Styles
const styles = {
  navbar: {
    backgroundColor: "#02182b", // Midnight blue
  },
};

// CSS styles as a string for the Navbar component
const navbarStyles = `
  .nav {
    font-size: 1.1rem;
    font-weight: 500;
    width: 100%;
  }

  .nav .logo-image {
    max-width: 70px;
  }

  .navbar-nav .nav-item .nav-link {
    color: white;
  }

  .navbar-nav .nav-item .nav-link:hover {
    color: #c2b697;
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background-color: #02182b !important;
    border: 1px solid #a69d82;
    border-radius: 8px;
    padding: 8px 0;
    min-width: 220px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    z-index: 1050;
    display: none;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
  }

  .dropdown-menu.show {
    display: block;
    opacity: 1;
    visibility: visible;
    background-color: #02182b !important;
  }

  .dropdown-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    color: #c2b697 !important;
    font-weight: 600;
    border-bottom: 1px solid rgba(166, 157, 130, 0.2);
    margin-bottom: 8px;
    background-color: #02182b !important;
  }

  .dropdown-header .dropdown-user-icon {
    font-size: 16px;
    margin-right: 10px;
    color: #c2b697 !important;
  }

  .dropdown-item {
    color: #c2b697 !important;
    padding: 10px 16px;
    text-decoration: none;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.95rem;
    background-color: transparent !important;
  }

  .dropdown-item:hover {
    background-color: rgba(166, 157, 130, 0.1) !important;
    color: #fff !important;
  }

  .dropdown-divider {
    height: 1px;
    background-color: rgba(166, 157, 130, 0.2);
    margin: 8px 0;
  }

  .logout-item {
    color: #c2b697 !important;
  }

  .logout-item:hover {
    background-color: rgba(166, 157, 130, 0.1) !important;
    color: #fff !important;
  }

  .dropdown-menu a {
    color: #c2b697 !important;
    text-decoration: none;
  }

  .dropdown-menu a:hover {
    color: #fff !important;
  }
`;

// Append CSS styles to the document
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = navbarStyles;
document.head.appendChild(styleSheet);

export default Navbar_Client;
