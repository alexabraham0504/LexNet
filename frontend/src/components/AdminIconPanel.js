import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faUserCheck,
  faLaptopCode,
  faChartLine,
  faUserCog,
} from '@fortawesome/free-solid-svg-icons';

const AdminIconPanel = () => {
  return (
    <div className="admin-icon-panel">
      <Link to="/ContentModeration" className="icon-link" title="Content Moderation">
        <FontAwesomeIcon icon={faUsers} />
      </Link>
      <Link to="/LawyerVerification" className="icon-link" title="Lawyer Verification">
        <FontAwesomeIcon icon={faUserCheck} />
      </Link>
      <Link to="/Platform" className="icon-link" title="Platform">
        <FontAwesomeIcon icon={faLaptopCode} />
      </Link>
      <Link to="/ReportsAnalytics" className="icon-link" title="Reports Analytics">
        <FontAwesomeIcon icon={faChartLine} />
      </Link>
      <Link to="/UserManagement" className="icon-link" title="User Management">
        <FontAwesomeIcon icon={faUserCog} />
      </Link>

      <style jsx="true">{`
        .admin-icon-panel {
          position: fixed;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          background: rgb(0, 0, 0);
          padding: 1rem 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          width: 60px;
          border-radius: 0 12px 12px 0;
          box-shadow: 2px 0 8px rgba(255, 254, 254, 0.1);
          z-index: 1001;
        }

        .icon-link {
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

        .icon-link:hover {
          background: rgba(244, 5, 5, 0.1);
          transform: translateX(2px);
        }

        @media (max-width: 768px) {
          .admin-icon-panel {
            width: 50px;
          }

          .icon-link {
            width: 35px;
            height: 35px;
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminIconPanel; 