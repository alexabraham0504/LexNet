import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
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
    try {
      sessionStorage.setItem("isLoggingOut", "true");
      
      if (authLogout) {
        authLogout();
      }
      
      sessionStorage.clear();
      
      setShowDropdown(false);
      
      window.location.replace('/');
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = '/';
    }
  };

  const links = [
    { path: "/lawyerdashboard", name: "Dashboard" },
    { path: "/aboutus", name: "About Us", state: { from: "lawyer" } },
    { path: "/contact", name: "Contact", state: { from: "lawyer" } },
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
                to="/lawyerregistration"
                className="dropdown-item"
                onClick={() => setShowDropdown(false)}
              >
                <span>My Profile</span>
              </NavLink>
              {/* <NavLink
                to="/settings"
                className="dropdown-item"
                onClick={() => setShowDropdown(false)}
              >
                <span>Settings</span>
              </NavLink> */}
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
                {links.map(({ path, name, state, onClick }, index) => (
                  <li className="nav-item mx-3 mb-2" key={index}>
                    <NavLink
                      to={path}
                      state={state}
                      onClick={onClick}
                      style={({ isActive }) => ({
                        textDecoration: "none",
                        color:
                          name === `Hi, ${userName}`
                            ? "#a69d82"
                            : name === "Logout"
                            ? "#000"
                            : isActive
                            ? "#c2b697"
                            : "#fff",
                        borderBottom:
                          isActive && path !== "#" && name !== "Logout"
                            ? "1px solid #c2b697"
                            : "none",
                        padding:
                          name === "Logout"
                            ? "8px 20px"
                            : isActive
                            ? "0 0 5px 0"
                            : "0",
                        fontWeight:
                          name === `Hi, ${userName}` ? "bold" : "normal",
                        cursor: path === "#" ? "default" : "pointer",
                        backgroundColor:
                          name === "Logout" ? "#a69d82" : "transparent",
                        borderRadius: name === "Logout" ? "5px" : "0",
                        display: "inline-block",
                        transition: "background-color 0.3s ease",
                        border: name === "Logout" ? "none" : "none",
                        ...(name === "Logout" && {
                          ":hover": {
                            backgroundColor: "#8b8370",
                          },
                        }),
                      })}
                      className={name === "Logout" ? "logout-btn" : ""}
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
    width: '100%', // Full width
  }

  .nav .logo-image {
    max-width: 70px;
  }

  .nav .slide-in {
    backgroundColor: "#02182b", // Midnight blue
    padding-top: 0;
    animation: slide-in 0.8s ease-out;
  }

  @keyframes slide-in {
    from {
      transform: translateY(-70%);
    }
    to {
      transform: translateY(0);
    }
  }

  .navbar-nav .nav-item .nav-link {
    color: white; /* Button text color */
  }

  .navbar-nav .nav-item .nav-link:hover {
    color: #c2b697; /* Hover color for buttons */
  }

  .user-menu-container {
    position: relative;
    display: inline-block;
    z-index: 9999;
  }

  .user-icon-wrapper {
    position: relative;
    padding: 8px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .user-icon-wrapper:hover {
    background-color: rgba(166, 157, 130, 0.1);
  }

  .user-icon {
    color: #a69d82;
    font-size: 20px;
    display: block;
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background-color: #02182b;
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
  }

  .dropdown-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    color: #a69d82;
    font-weight: 600;
    border-bottom: 1px solid rgba(166, 157, 130, 0.2);
    margin-bottom: 8px;
  }

  .dropdown-header .dropdown-user-icon {
    font-size: 16px;
    margin-right: 10px;
  }

  .dropdown-item {
    color: #fff !important;
    padding: 10px 16px;
    text-decoration: none;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.95rem;
    background-color: transparent;
  }

  .dropdown-item:hover {
    background-color: rgba(166, 157, 130, 0.1);
    color: #c2b697 !important;
  }

  .dropdown-divider {
    height: 1px;
    background-color: rgba(166, 157, 130, 0.2);
    margin: 8px 0;
  }

  .logout-item {
    color: #ff6b6b !important;
  }

  .logout-item:hover {
    background-color: rgba(255, 107, 107, 0.1);
  }
`;

// Append CSS styles to the document
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = navbarStyles;
document.head.appendChild(styleSheet);

export default Navbar;
