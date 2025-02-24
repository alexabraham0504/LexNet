import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Navbar from '../../components/navbar/navbar-client';
import ClientSidebar from '../../components/sidebar/ClientSidebar';
import Footer from '../../components/footer/footer-admin';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faEnvelope,
  faPhone,
  faGavel,
  faMapMarkerAlt,
  faLanguage,
  faMoneyBill,
  faBriefcase,
  faUniversity,
  faCertificate,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import './LawyerProfile.css';

const LawyerProfile = () => {
  const { lawyerId } = useParams();
  const [lawyer, setLawyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLawyerProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/lawyers/${lawyerId}`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        setLawyer(response.data);
      } catch (err) {
        setError('Failed to fetch lawyer profile');
        toast.error('Error loading lawyer profile');
      } finally {
        setLoading(false);
      }
    };

    fetchLawyerProfile();
  }, [lawyerId]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!lawyer) return <div className="not-found">Lawyer not found</div>;

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-content">
        <ClientSidebar />
        <div className="main-content">
          <div className="lawyer-profile-container">
            <div className="profile-header">
              <div className="profile-image">
                <img
                  src={lawyer.profilePicture ? 
                    `http://localhost:5000/uploads/${lawyer.profilePicture}` : 
                    '/default-lawyer-avatar.png'
                  }
                  alt={lawyer.fullName}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/default-lawyer-avatar.png';
                  }}
                />
              </div>
              <div className="profile-basic-info">
                <h1>{lawyer.fullName}</h1>
                <p className="specialization">{lawyer.specialization}</p>
                <p className="experience">{lawyer.yearsOfExperience} Years of Experience</p>
              </div>
            </div>

            <div className="profile-sections">
              <section className="contact-info">
                <h2><FontAwesomeIcon icon={faUser} /> Contact Information</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <FontAwesomeIcon icon={faEnvelope} />
                    <p>{lawyer.email}</p>
                  </div>
                  <div className="info-item">
                    <FontAwesomeIcon icon={faPhone} />
                    <p>{lawyer.phone}</p>
                  </div>
                  <div className="info-item">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    <p>{lawyer.location?.address}</p>
                  </div>
                </div>
              </section>

              <section className="professional-info">
                <h2><FontAwesomeIcon icon={faGavel} /> Professional Details</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>AEN Number:</strong>
                    <p>{lawyer.AEN}</p>
                  </div>
                  <div className="info-item">
                    <strong>Law Firm:</strong>
                    <p>{lawyer.lawFirm || 'Independent Practice'}</p>
                  </div>
                  <div className="info-item">
                    <strong>Practicing Courts:</strong>
                    <p>{lawyer.practicingCourts?.join(', ')}</p>
                  </div>
                </div>
              </section>

              <section className="fees-section">
                <h2><FontAwesomeIcon icon={faMoneyBill} /> Fee Structure</h2>
                <div className="fees-grid">
                  <div className="fee-item">
                    <span>Consultation</span>
                    <p>{lawyer.consultationFees}</p>
                  </div>
                  <div className="fee-item">
                    <span>Video Call</span>
                    <p>{lawyer.videoCallFees}</p>
                  </div>
                  <div className="fee-item">
                    <span>Case Handling</span>
                    <p>{lawyer.caseHandlingFees}</p>
                  </div>
                  <div className="fee-item">
                    <span>Case Details</span>
                    <p>{lawyer.caseDetailsFees}</p>
                  </div>
                </div>
              </section>

              <section className="languages">
                <h2><FontAwesomeIcon icon={faLanguage} /> Languages Spoken</h2>
                <div className="languages-list">
                  {lawyer.languagesSpoken?.map((language, index) => (
                    <span key={index} className="language-tag">{language}</span>
                  ))}
                </div>
              </section>

              <section className="bio">
                <h2><FontAwesomeIcon icon={faUser} /> About</h2>
                <p>{lawyer.bio || 'No bio available'}</p>
              </section>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default LawyerProfile; 