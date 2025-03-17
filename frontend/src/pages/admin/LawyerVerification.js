import React, { useEffect, useState } from "react";
import axios from "axios";
import Footer from "../../components/footer/footer-admin";
import Navbar from "../../components/navbar/navbar-admin";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminIconPanel from "../../components/AdminIconPanel";

const LawyerVerification = () => {
  const [unverifiedLawyers, setUnverifiedLawyers] = useState([]);
  const [verifiedLawyers, setVerifiedLawyers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [unverifiedRes, verifiedRes] = await Promise.all([
          axios.get("https://lexnet-backend.onrender.com/api/lawyers/unverified"),
          axios.get("https://lexnet-backend.onrender.com/api/lawyers/verified")
        ]);
        
        console.log("Raw unverified lawyer data:", unverifiedRes.data[0]);
        
        // Transform the data to handle both fullName and fullname
        const transformedUnverified = unverifiedRes.data.map(lawyer => ({
          ...lawyer,
          fullname: lawyer.fullName || lawyer.fullname || 'Unknown' // Handle both cases
        }));

        const transformedVerified = verifiedRes.data.map(lawyer => ({
          ...lawyer,
          fullname: lawyer.fullName || lawyer.fullname || 'Unknown' // Handle both cases
        }));
        
        if (Array.isArray(unverifiedRes.data)) {
          setUnverifiedLawyers(transformedUnverified);
        }
        
        if (Array.isArray(verifiedRes.data)) {
          setVerifiedLawyers(transformedVerified);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchVerifiedLawyers = async () => {
    try {
      const response = await axios.get(
        "https://lexnet-backend.onrender.com/api/lawyers/verified"
      );
      if (Array.isArray(response.data)) {
        // Transform the data to handle both fullName and fullname
        const transformedData = response.data.map(lawyer => ({
          ...lawyer,
          fullname: lawyer.fullName || lawyer.fullname || 'Unknown' // Handle both cases
        }));
        setVerifiedLawyers(transformedData);
      } else {
        console.error("Expected array but got:", typeof response.data);
        setVerifiedLawyers([]);
      }
    } catch (error) {
      console.error("Error fetching verified lawyers:", error);
      setVerifiedLawyers([]);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`https://lexnet-backend.onrender.com/api/lawyers/approve/${id}`);
      setUnverifiedLawyers((prevLawyers) =>
        prevLawyers.filter((lawyer) => lawyer._id !== id)
      );
      await fetchVerifiedLawyers();
      toast.success('Lawyer approved successfully!', {
        position: "top-right",
        style: {
          background: 'linear-gradient(45deg, #ffffff, #f5f5f5)',
          color: '#333333',
        }
      });
    } catch (error) {
      console.error("Error approving lawyer:", error);
      toast.error('Failed to approve lawyer.', {
        position: "top-right",
        style: {
          background: 'linear-gradient(45deg, #ffffff, #f5f5f5)',
          color: '#333333',
        }
      });
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.delete(`https://lexnet-backend.onrender.com/api/lawyers/reject/${id}`);
      setUnverifiedLawyers((prevLawyers) =>
        prevLawyers.filter((lawyer) => lawyer._id !== id)
      );
      toast.info('Lawyer rejected successfully!', {
        position: "top-right",
        style: {
          background: 'linear-gradient(45deg, #ffffff, #f5f5f5)',
          color: '#333333',
        }
      });
    } catch (error) {
      console.error("Error rejecting lawyer:", error);
      toast.error('Failed to reject lawyer.', {
        position: "top-right",
        style: {
          background: 'linear-gradient(45deg, #ffffff, #f5f5f5)',
          color: '#333333',
        }
      });
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const action = currentStatus === 'active' ? 'deactivate' : 'activate';
      const response = await axios.put(`https://lexnet-backend.onrender.com/api/lawyers/${action}/${id}`);
      
      if (response.data.success) {
        await fetchVerifiedLawyers(); // Refresh the list
        toast.success(`Lawyer ${action}d successfully!`);
      } else {
        throw new Error(response.data.message || `Failed to ${action} lawyer`);
      }
    } catch (error) {
      console.error(`Error ${currentStatus === 'active' ? 'deactivating' : 'activating'} lawyer:`, error);
      toast.error(`Failed to ${currentStatus === 'active' ? 'deactivate' : 'activate'} lawyer.`);
    }
  };

  // Filter lawyers based on the search term
  const filteredUnverifiedLawyers = unverifiedLawyers.filter(
    (lawyer) => {
      const searchString = searchTerm.toLowerCase();
      const nameToSearch = (lawyer.fullname || '').toLowerCase();
      return nameToSearch.includes(searchString);
    }
  );

  const filteredVerifiedLawyers = verifiedLawyers.filter(
    (lawyer) => {
      const searchString = searchTerm.toLowerCase();
      const nameToSearch = (lawyer.fullname || '').toLowerCase();
      return nameToSearch.includes(searchString);
    }
  );

  return (
    <>
      <div className="lawyer-verification-container">
        <Navbar />
        <AdminIconPanel />
        <div className="main-content">
          <div className="lawyer-verification">
            <div className="header-container">
              <div className="header-content">
                <h1>Lawyer Verification</h1>
                <p className="subtitle">Manage and verify lawyer registrations</p>
                <div className="stats-container">
                  <div className="stat-box">
                    <span className="stat-number">{unverifiedLawyers.length}</span>
                    <span className="stat-label">Pending</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-number">{verifiedLawyers.length}</span>
                    <span className="stat-label">Verified</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="content-section">
              <input
                type="text"
                placeholder="Search Lawyers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />

              {isLoading ? (
                <div className="loading">Loading...</div>
              ) : (
                <>
                  <section className="unverified-section">
                    <h2>Unverified Lawyers ({filteredUnverifiedLawyers.length})</h2>
                    {filteredUnverifiedLawyers.length === 0 ? (
                      <p className="no-results">No unverified lawyers found.</p>
                    ) : (
                      <div className="lawyers-grid">
                        {filteredUnverifiedLawyers.map((lawyer) => (
                          <div key={lawyer._id} className="lawyer-card">
                            <div className="lawyer-info">
                              <img
                                src={`https://lexnet-backend.onrender.com/uploads/${lawyer.profilePicture}`}
                                alt={lawyer.fullname}
                                className="profile-pic"
                                onError={(e) => {
                                  e.target.src = '/assets/default-avatar.png';
                                }}
                              />
                              <h3>{lawyer.fullname}</h3>
                              <p>{lawyer.email}</p>
                              <p>AEN: {lawyer.AEN}</p>
                              <p>Specialization: {lawyer.specialization}</p>
                            </div>
                            <div className="document-links">
                              <a
                                href={`https://lexnet-backend.onrender.com/uploads/${lawyer.lawDegreeCertificate}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="doc-link"
                              >
                                View Law Degree
                              </a>
                              <a
                                href={`https://lexnet-backend.onrender.com/uploads/${lawyer.barCouncilCertificate}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="doc-link"
                              >
                                View Bar Council Certificate
                              </a>
                            </div>
                            <div className="action-buttons">
                              <button
                                onClick={() => handleApprove(lawyer._id)}
                                className="approve-btn"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(lawyer._id)}
                                className="reject-btn"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="verified-section">
                    <h2>Verified Lawyers ({filteredVerifiedLawyers.length})</h2>
                    {filteredVerifiedLawyers.length === 0 ? (
                      <p className="no-results">No verified lawyers found.</p>
                    ) : (
                      <div className="lawyers-grid">
                        {filteredVerifiedLawyers.map((lawyer) => (
                          <div key={lawyer._id} className={`lawyer-card ${lawyer.visibleToClients ? 'active' : 'inactive'}`}>
                            <div className="lawyer-info">
                              <img
                                src={`https://lexnet-backend.onrender.com/uploads/${lawyer.profilePicture}`}
                                alt={lawyer.fullname}
                                className="profile-pic"
                                onError={(e) => {
                                  e.target.src = '/assets/default-avatar.png';
                                }}
                              />
                              <h3>{lawyer.fullname}</h3>
                              <p>{lawyer.email}</p>
                              <p>AEN: {lawyer.AEN}</p>
                              <p>Specialization: {lawyer.specialization}</p>
                              <div className="status-container">
                                <span className={`status-badge ${lawyer.visibleToClients ? 'active' : 'inactive'}`}>
                                  {lawyer.visibleToClients ? '✓ Active' : '⊘ Inactive'}
                                </span>
                                <button
                                  onClick={() => handleToggleStatus(lawyer._id, lawyer.visibleToClients ? 'active' : 'inactive')}
                                  className={`toggle-status-btn ${lawyer.visibleToClients ? 'deactivate' : 'activate'}`}
                                >
                                  {lawyer.visibleToClients ? 'Deactivate' : 'Activate'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
      <ToastContainer />
      <style jsx="true">{`
        .lawyer-verification-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f5f7fa;
        }

        .main-content {
          margin-left: 60px;
          padding: 20px;
          flex: 1;
        }

        .lawyer-verification {
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        .header-container {
          background: linear-gradient(135deg, #1a237e, #0d47a1);
          padding: 40px;
          border-radius: 15px;
          margin-bottom: 30px;
          color: white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header-content {
          text-align: center;
        }

        .header-content h1 {
          font-size: 2.5rem;
          margin-bottom: 15px;
          font-weight: 600;
        }

        .subtitle {
          font-size: 1.1rem;
          opacity: 0.9;
          margin-bottom: 25px;
        }

        .stats-container {
          display: flex;
          justify-content: center;
          gap: 30px;
        }

        .stat-box {
          background: rgba(255, 255, 255, 0.1);
          padding: 20px 40px;
          border-radius: 10px;
          backdrop-filter: blur(5px);
        }

        .stat-number {
          display: block;
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 1rem;
          opacity: 0.9;
        }

        .content-section {
          background: white;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .search-input {
          width: 100%;
          padding: 15px 25px;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          font-size: 1rem;
          margin-bottom: 30px;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          border-color: #1a237e;
          box-shadow: 0 0 0 2px rgba(26, 35, 126, 0.1);
          outline: none;
        }

        .lawyers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 25px;
          margin-top: 25px;
        }

        .lawyer-card {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .lawyer-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .profile-pic {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: 20px;
          border: 3px solid #f5f7fa;
        }

        .lawyer-info h3 {
          font-size: 1.2rem;
          margin-bottom: 10px;
          color: #2c3e50;
        }

        .lawyer-info p {
          color: #666;
          margin-bottom: 8px;
          font-size: 0.95rem;
        }

        .doc-link {
          display: block;
          padding: 10px;
          margin: 8px 0;
          background: #f8f9fa;
          border-radius: 8px;
          text-decoration: none;
          color: #1a237e;
          transition: background-color 0.2s ease;
        }

        .doc-link:hover {
          background: #e8eaf6;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .approve-btn, .reject-btn {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .approve-btn {
          background: #4caf50;
          color: white;
        }

        .reject-btn {
          background: #f44336;
          color: white;
        }

        .approve-btn:hover {
          background: #43a047;
        }

        .reject-btn:hover {
          background: #e53935;
        }

        .status-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .status-badge.active {
          background: #4caf50;
          color: white;
        }

        .status-badge.inactive {
          background: #f44336;
          color: white;
        }

        .toggle-status-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .toggle-status-btn.deactivate {
          background: #ff5252;
          color: white;
        }

        .toggle-status-btn.deactivate:hover {
          background: #d32f2f;
        }

        .toggle-status-btn.activate {
          background: #4caf50;
          color: white;
        }

        .toggle-status-btn.activate:hover {
          background: #388e3c;
        }

        .lawyer-card.inactive {
          opacity: 0.8;
          background: #f8f8f8;
          border: 1px solid #ddd;
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 50px;
            padding: 15px;
          }

          .header-container {
            padding: 30px 20px;
          }

          .header-content h1 {
            font-size: 2rem;
          }

          .stats-container {
            flex-direction: column;
            gap: 15px;
          }

          .stat-box {
            padding: 15px 30px;
          }

          .lawyers-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
};

export default LawyerVerification;

  



