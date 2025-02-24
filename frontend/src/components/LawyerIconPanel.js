import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaCalendarAlt, FaUserCog, FaComments, FaClipboardList, FaGavel } from 'react-icons/fa';

const LawyerIconPanel = () => {
  const location = useLocation();

  return (
    <div className="icon-panel">
      <Link 
        to="/lawyerdashboard" 
        className={`icon-link ${location.pathname === '/lawyerdashboard' ? 'active' : ''}`} 
        title="Home"
      >
        <FaHome className="icon" />
      </Link>
      <Link 
        to="/lawyeravailability" 
        className={`icon-link ${location.pathname === '/lawyeravailability' ? 'active' : ''}`} 
        title="Availability"
      >
        <FaCalendarAlt className="icon" />
      </Link>
      <Link 
        to="/lawyerregistration" 
        className={`icon-link ${location.pathname === '/lawyerregistration' ? 'active' : ''}`} 
        title="Profile"
      >
        <FaUserCog className="icon" />
      </Link>
      <Link 
        to="/message" 
        className={`icon-link ${location.pathname === '/message' ? 'active' : ''}`} 
        title="Messages"
      >
        <FaComments className="icon" />
      </Link>
      <Link 
        to="/ipc-sections" 
        className={`icon-link ${location.pathname === '/ipc-sections' ? 'active' : ''}`} 
        title="IPC Sections"
      >
        <FaGavel className="icon" />
      </Link>

      <style jsx="true">{`
        .icon-panel {
          position: fixed;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 60px;
          background: rgb(0, 0, 0);
          padding: 20px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          border-radius: 0 10px 10px 0;
          box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);
          z-index: 100;
        }

        .icon-link {
          color: white;
          padding: 10px;
          border-radius: 8px;
          transition: all 0.3s ease;
          display: flex;
          justify-content: center;
          align-items: center;
          text-decoration: none;
        }

        .icon-link:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateX(5px);
        }

        .icon-link.active {
          background: rgba(255, 255, 255, 0.3);
          color: #4caf50;
        }

        .icon {
          font-size: 24px;
        }

        @media (max-width: 768px) {
          .icon-panel {
            width: 50px;
            padding: 15px 0;
          }

          .icon {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default LawyerIconPanel; 