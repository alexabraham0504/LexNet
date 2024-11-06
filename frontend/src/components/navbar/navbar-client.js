import React from "react";
import { NavLink, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  const links = [
    { path: "/clientdashboard", name: "Dashboard" },
    { 
      path: "/aboutus", 
      name: "Aboutus",
      state: { from: 'client' }
    },
    { 
      path: "/contact", 
      name: "Contact",
      state: { from: 'client' }
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
`;

// Append CSS styles to the document
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = navbarStyles;
document.head.appendChild(styleSheet);

export default Navbar;
