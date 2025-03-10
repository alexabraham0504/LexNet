import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faGavel, 
  faFileAlt,
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faHome,
  faReceipt
} from '@fortawesome/free-solid-svg-icons';

const ClientSidebar = ({ onToggle }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const location = useLocation();
  const isDashboard = location.pathname === '/client-dashboard';
  const userId = sessionStorage.getItem("userid");

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

      {/* Separate collapsed menu */}
      {isCollapsed && (
        <div className="collapsed-menu">
          <Link to="/clientdashboard" className="collapsed-item" title="Dashboard">
            <FontAwesomeIcon icon={faHome} />
          </Link>
          <Link to="/client/lawyer-search" className="collapsed-item" title="Search">
            <FontAwesomeIcon icon={faSearch} />
          </Link>
          <Link to="/IPC" className="collapsed-item" title="IPC">
            <FontAwesomeIcon icon={faGavel} />
          </Link>
          <Link to={`/case-details/${userId}`} className="collapsed-item" title="Case Details">
            <FontAwesomeIcon icon={faFileAlt} />
          </Link>
          <Link to="/client/payment-receipts" className="collapsed-item" title="Payment Receipts">
            <FontAwesomeIcon icon={faReceipt} />
          </Link>
        </div>
      )}

      {/* Main sidebar */}
      <div className={`client-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="workspace-selector">
          <img src="/assets/logo.png" alt="Logo" className="sidebar-logo" />
          <span className="workspace-text">Lex Net</span>
          <FontAwesomeIcon icon={faChevronDown} className="workspace-arrow" />
        </div>

        <div className="sidebar-menu">
          <Link to="/clientdashboard" className="menu-item">
            <FontAwesomeIcon icon={faHome} className="menu-icon" />
            <span className="menu-text">Dashboard</span>
          </Link>
          
          <Link to="/client/lawyer-search" className="menu-item">
            <FontAwesomeIcon icon={faSearch} className="menu-icon" />
            <span className="menu-text">Search</span>
          </Link>
          
          <Link to="/IPC" className="menu-item">
            <FontAwesomeIcon icon={faGavel} className="menu-icon" />
            <span className="menu-text">IPC</span>
          </Link>
          
          <Link to={`/case-details/${userId}`} className="menu-item">
            <FontAwesomeIcon icon={faFileAlt} className="menu-icon" />
            <span className="menu-text">Case Details</span>
          </Link>
          
          <Link to="/client/payment-receipts" className="menu-item">
            <FontAwesomeIcon icon={faReceipt} className="menu-icon" />
            <span className="menu-text">Payment Receipts</span>
          </Link>
        </div>

        <div className="teams-section">
          <div className="section-title">TEAMS</div>
          <div className="team-items">
            <div className="team-item">
              <span className="team-dot criminal"></span>
              <span className="team-text">Criminal Law</span>
            </div>
            <div className="team-item">
              <span className="team-dot civil"></span>
              <span className="team-text">Civil Law</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .client-sidebar {
          width: ${isCollapsed ? '0' : '280px'};
          height: 100vh;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          position: fixed;
          left: 0;
          top: 0;
          z-index: 999;
          transition: all 0.3s ease;
          color: #333;
          overflow: hidden;
          border-right: 1px solid rgba(255, 255, 255, 0.2);
        }

        .collapsed-menu {
          position: fixed;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 60px;
          background: rgb(0, 0, 0);
          padding: 1rem 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          border-radius: 0 12px 12px 0;
          box-shadow: 2px 0 8px rgba(255, 254, 254, 0.1);
          z-index: 1001;
        }

        .collapsed-item {
          color: white;
          font-size: 1.2rem;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          text-decoration: none;
        }

        .collapsed-item:hover {
          background: rgba(244, 5, 5, 0.1);
          transform: translateX(2px);
        }

        .toggle-button {
          position: fixed;
          left: ${isCollapsed ? '60px' : '280px'};
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 48px;
          background: rgb(0, 0, 0);
          border: none;
          border-radius: 0 6px 6px 0;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 1000;
        }

        .workspace-selector {
          background: rgba(255, 255, 255, 0.1);
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          white-space: nowrap;
        }

        .sidebar-logo {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          flex-shrink: 0;
        }

        .workspace-text {
          flex: 1;
          font-weight: 500;
          transition: opacity 0.2s;
        }

        .workspace-arrow {
          font-size: 0.8rem;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .collapsed .workspace-text,
        .collapsed .workspace-arrow,
        .collapsed .menu-text,
        .collapsed .team-text,
        .collapsed .section-title {
          opacity: 0;
          visibility: hidden;
        }

        .sidebar-menu {
          padding: 1rem 0;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 0.8rem 1rem;
          color: #333;
          text-decoration: none;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .menu-icon {
          font-size: 1.2rem;
          width: 24px;
          text-align: center;
          flex-shrink: 0;
        }

        .menu-item:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .menu-item.active {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .teams-section {
          padding: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
        }

        .section-title {
          font-size: 0.75rem;
          color: #666;
          margin-bottom: 0.8rem;
          letter-spacing: 0.05em;
          transition: opacity 0.2s;
        }

        .team-items {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .team-item {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 0.5rem 0;
          color: #333;
          cursor: pointer;
          white-space: nowrap;
        }

        .team-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .team-dot.criminal {
          background: #ffd700;
        }

        .team-dot.civil {
          background: #4169e1;
        }

        @media (max-width: 768px) {
          .client-sidebar {
            width: ${isCollapsed ? '0' : '240px'};
          }

          .toggle-button {
            left: ${isCollapsed ? '60px' : '240px'};
          }
        }
      `}</style>
    </>
  );
};

export default ClientSidebar; 