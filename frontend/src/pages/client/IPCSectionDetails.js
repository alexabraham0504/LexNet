import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faGavel, faBookOpen, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import Navbar from '../../components/navbar/navbar-client';
import ClientSidebar from '../../components/sidebar/ClientSidebar';
import './IPCSectionDetails.css';

const IPCSectionDetails = () => {
  const { sectionNumber } = useParams();
  const navigate = useNavigate();
  const [sectionDetails, setSectionDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSectionDetails = () => {
      try {
        const savedDetails = localStorage.getItem('selectedIPCSection');
        if (savedDetails) {
          setSectionDetails(JSON.parse(savedDetails));
        }
      } catch (error) {
        console.error('Error loading section details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSectionDetails();
  }, [sectionNumber]);

  return (
    <div className="ipc-details-page">
      <Navbar />
      <div className="content-wrapper">
        <ClientSidebar />
        <div className="main-content">
          <div className="container">
            <button 
              className="btn btn-outline-primary mb-4"
              onClick={() => navigate(-1)}
            >
              <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
              Back to Analysis
            </button>

            {loading ? (
              <div className="loading-spinner">Loading...</div>
            ) : sectionDetails ? (
              <div className="section-details-card">
                <div className="section-header">
                  <h2>
                    <FontAwesomeIcon icon={faGavel} className="me-3" />
                    IPC Section {sectionNumber}
                  </h2>
                </div>

                <div className="section-content">
                  <div className="info-block">
                    <h4>
                      <FontAwesomeIcon icon={faBookOpen} className="me-2" />
                      Definition
                    </h4>
                    <p>{sectionDetails.description}</p>
                  </div>

                  <div className="info-block">
                    <h4>
                      <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                      Evidence Found
                    </h4>
                    <div className="evidence-block">
                      {sectionDetails.evidence}
                    </div>
                  </div>

                  <div className="info-block">
                    <h4>Analysis</h4>
                    <p>{sectionDetails.analysis}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="error-message">
                Section details not found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPCSectionDetails; 