import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers,
  faUserCheck,
  faLaptopCode,
  faChartLine,
  faUserCog,
  faChevronLeft,
  faChevronRight,
  faChevronDown
} from '@fortawesome/free-solid-svg-icons';

const AdminSidebar = ({ onToggle }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const location = useLocation();
  const isDashboard = location.pathname === '/admin-dashboard';

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    if (onToggle) {
      onToggle(!isCollapsed);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.admin-sidebar') && !event.target.closest('.toggle-button')) {
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
          <Link to="/ContentModeration" className="collapsed-item" title="Content Moderation">
            <FontAwesomeIcon icon={faUsers} />
          </Link>
          <Link to="/LawyerVerification" className="collapsed-item" title="Lawyer Verification">
            <FontAwesomeIcon icon={faUserCheck} />
          </Link>
          <Link to="/Platform" className="collapsed-item" title="Platform">
            <FontAwesomeIcon icon={faLaptopCode} />
          </Link>
          <Link to="/ReportsAnalytics" className="collapsed-item" title="Reports & Analytics">
            <FontAwesomeIcon icon={faChartLine} />
          </Link>
          <Link to="/UserManagement" className="collapsed-item" title="User Management">
            <FontAwesomeIcon icon={faUserCog} />
          </Link>
        </div>
      )}

      {/* Main sidebar */}
      <div className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="workspace-selector">
          <img src="/assets/logo.png" alt="Logo" className="sidebar-logo" />
          <span className="workspace-text">Admin Panel</span>
          <FontAwesomeIcon icon={faChevronDown} className="workspace-arrow" />
        </div>

        <div className="sidebar-menu">
          <Link to="/ContentModeration" className="menu-item">
            <FontAwesomeIcon icon={faUsers} className="menu-icon" />
            <span className="menu-text">Content Moderation</span>
          </Link>
          
          <Link to="/LawyerVerification" className="menu-item">
            <FontAwesomeIcon icon={faUserCheck} className="menu-icon" />
            <span className="menu-text">Lawyer Verification</span>
          </Link>
          
          <Link to="/Platform" className="menu-item">
            <FontAwesomeIcon icon={faLaptopCode} className="menu-icon" />
            <span className="menu-text">Platform</span>
          </Link>

          <Link to="/ReportsAnalytics" className="menu-item">
            <FontAwesomeIcon icon={faChartLine} className="menu-icon" />
            <span className="menu-text">Reports & Analytics</span>
          </Link>

          <Link to="/UserManagement" className="menu-item">
            <FontAwesomeIcon icon={faUserCog} className="menu-icon" />
            <span className="menu-text">User Management</span>
          </Link>
        </div>

        <div className="teams-section">
          <div className="section-title">QUICK STATS</div>
          <div className="team-items">
            <div className="team-item">
              <span className="team-dot pending"></span>
              <span className="team-text">Pending Verifications</span>
            </div>
            <div className="team-item">
              <span className="team-dot reports"></span>
              <span className="team-text">Active Reports</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .admin-sidebar {
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

        /* ... rest of your styles ... */

        .team-dot.pending {
          background: #ffd700;
        }

        .team-dot.reports {
          background: #ff4444;
        }

        @media (max-width: 768px) {
          .admin-sidebar {
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

export default AdminSidebar; 