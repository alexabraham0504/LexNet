import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faGavel, 
  faFileAlt,
  faChevronLeft,
  faChevronRight 
} from '@fortawesome/free-solid-svg-icons';

const ClientSidebar = ({ onToggle }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const location = useLocation();
  const isDashboard = location.pathname === '/client-dashboard';

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    if (onToggle) {
      onToggle(!isCollapsed);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.client-sidebar') && !event.target.closest('.toggle-button')) {
        setIsCollapsed(true);
        if (onToggle) {
          onToggle(true);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onToggle]);

  if (isDashboard) return null;

  return (
    <>
      <button 
        className={`toggle-button ${isCollapsed ? 'collapsed' : ''}`}
        onClick={handleToggle}
        aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        <FontAwesomeIcon icon={isCollapsed ? faChevronRight : faChevronLeft} />
      </button>

      <div className={`client-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-buttons">
          <Link to="/LawyerSearch" className="sidebar-button" title="Search">
            <button className="btn btn-lg btn-outline-dark type-button w-100 fw-bold">
              <span className="icon-container">
                <FontAwesomeIcon icon={faSearch} size="1x" />
              </span>
              <span className="button-text">Search</span>
            </button>
          </Link>
          
          <Link to="/IPC" className="sidebar-button" title="IPC">
            <button className="btn btn-lg btn-outline-dark type-button w-100 fw-bold">
              <span className="icon-container">
                <FontAwesomeIcon icon={faGavel} size="1x" />
              </span>
              <span className="button-text">IPC</span>
            </button>
          </Link>
          
          <Link to="/lawyeravailabilityclient" className="sidebar-button" title="Case Details">
            <button className="btn btn-lg btn-outline-dark type-button w-100 fw-bold">
              <span className="icon-container">
                <FontAwesomeIcon icon={faFileAlt} size="1x" />
              </span>
              <span className="button-text">Case Details</span>
            </button>
          </Link>
        </div>
      </div>

      <style jsx="true">{`
        .toggle-button {
          position: fixed;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 25px;
          height: 50px;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-left: none;
          border-radius: 0 25px 25px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          z-index: 1000;
        }

        .toggle-button.collapsed {
          left: 0;
        }

        .toggle-button:hover {
          width: 30px;
          background: #f8f9fa;
        }

        .client-sidebar {
          width: 280px;
          height: 100vh;
          background: white;
          position: fixed;
          left: 0;
          top: 0;
          padding-top: 100px;
          z-index: 999;
          border-right: 1px solid rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
          box-shadow: 2px 0 5px rgba(0, 0, 0, 0.05);
          transform: translateX(${isCollapsed ? '-100%' : '0'});
        }

        .client-sidebar.collapsed {
          transform: translateX(-100%);
        }

        .sidebar-buttons {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1.5rem;
        }

        .sidebar-button {
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .type-button {
          padding: 1.2rem !important;
          transition: all 0.3s ease !important;
          background: white;
          border: 1px solid #dee2e6 !important;
          color: #495057;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .type-button:hover {
          transform: translateX(10px);
          background: #f8f9fa;
          color: #212529;
          border-color: #212529 !important;
        }

        .icon-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          flex-shrink: 0;
        }

        .button-text {
          white-space: nowrap;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .toggle-button {
            width: 20px;
            height: 40px;
          }

          .client-sidebar {
            width: 240px;
          }

          .type-button {
            padding: 0.8rem !important;
          }
        }
      `}</style>
    </>
  );
};

export default ClientSidebar; 