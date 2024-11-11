import React, { useEffect, useState } from "react";
import axios from "axios";
import Footer from "../../components/footer/footer-admin";
import Navbar from "../../components/navbar/navbar-admin";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const LawyerVerification = () => {
  const [unverifiedLawyers, setUnverifiedLawyers] = useState([]);
  const [verifiedLawyers, setVerifiedLawyers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUnverifiedLawyers();
    fetchVerifiedLawyers();
  }, []);

  const fetchUnverifiedLawyers = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/lawyers/unverified"
      );
      setUnverifiedLawyers(response.data);
    } catch (error) {
      console.error("Error fetching unverified lawyers:", error);
    }
  };

  const fetchVerifiedLawyers = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/lawyers/verified"
      );
      setVerifiedLawyers(response.data);
    } catch (error) {
      console.error("Error fetching verified lawyers:", error);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`http://localhost:3000/api/lawyers/approve/${id}`);
      setUnverifiedLawyers((prevLawyers) =>
        prevLawyers.filter((lawyer) => lawyer._id !== id)
      );
      toast.success("Lawyer approved successfully!", {
        position: "top-right",
        style: {
          background: "linear-gradient(45deg, #ffffff, #f5f5f5)",
          color: "#333333",
        },
      });
      fetchVerifiedLawyers();
    } catch (error) {
      console.error("Error approving lawyer:", error);
      toast.error("Failed to approve lawyer.", {
        position: "top-right",
        style: {
          background: "linear-gradient(45deg, #ffffff, #f5f5f5)",
          color: "#333333",
        },
      });
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/lawyers/reject/${id}`);
      setUnverifiedLawyers((prevLawyers) =>
        prevLawyers.filter((lawyer) => lawyer._id !== id)
      );
      toast.info("Lawyer rejected successfully!", {
        position: "top-right",
        style: {
          background: "linear-gradient(45deg, #ffffff, #f5f5f5)",
          color: "#333333",
        },
      });
    } catch (error) {
      console.error("Error rejecting lawyer:", error);
      toast.error("Failed to reject lawyer.", {
        position: "top-right",
        style: {
          background: "linear-gradient(45deg, #ffffff, #f5f5f5)",
          color: "#333333",
        },
      });
    }
  };

  const handleToggleVisibility = async (id) => {
    try {
      await axios.put(
        `http://localhost:3000/api/lawyers/toggle-visibility/${id}`
      );
      toast.success("Visibility status updated successfully!", {
        position: "top-right",
        style: {
          background: "linear-gradient(45deg, #ffffff, #f5f5f5)",
          color: "#333333",
        },
      });
      fetchVerifiedLawyers();
    } catch (error) {
      console.error("Error toggling lawyer visibility:", error);
      toast.error("Failed to update visibility status.", {
        position: "top-right",
        style: {
          background: "linear-gradient(45deg, #ffffff, #f5f5f5)",
          color: "#333333",
        },
      });
    }
  };

  // Filter lawyers based on the search term
  const filteredUnverifiedLawyers = unverifiedLawyers.filter(
    (lawyer) =>
      lawyer.fullname &&
      lawyer.fullname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVerifiedLawyers = verifiedLawyers.filter(
    (lawyer) =>
      lawyer.fullname &&
      lawyer.fullname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const PageHeader = () => (
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
  );

  return (
    <div>
      <Navbar />
      <div className="header-container">
        <div className="pattern-overlay"></div>
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
      <div className="lawyer-verification">
        <div style={{ padding: "20px" }}>
          <h1>Lawyer Verification</h1>
          <input
            type="text"
            placeholder="Search Lawyers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Unverified Lawyers Table */}
          <h2>Unverified Lawyers</h2>
          <table className="lawyer-table">
            <thead>
              <tr>
                <th>Profile Picture</th>
                <th>Name</th>
                <th>Email</th>
                <th>AEN</th>
                <th>Specialization</th>
                <th>Location</th>
                <th>Law Degree Certificate</th>
                <th>Bar Council Certificate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnverifiedLawyers.map((lawyer) => (
                <tr key={lawyer._id}>
                  <td>
                    {lawyer.profilePicture ? (
                      <img
                        src={`http://localhost:3000/uploads/${lawyer.profilePicture}`}
                        alt="Profile"
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "50%",
                        }}
                      />
                    ) : (
                      "No Image"
                    )}
                  </td>

                  <td>{lawyer.fullname}</td>
                  <td>{lawyer.email}</td>
                  <td>{lawyer.AEN}</td>
                  <td>{lawyer.specialization}</td>
                  <td>{lawyer.location}</td>
                  <td>
                    {lawyer.lawDegreeCertificate ? (
                      <a
                        href={`http://localhost:3000/uploads/${lawyer.lawDegreeCertificate}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    ) : (
                      "Not Uploaded"
                    )}
                  </td>
                  <td>
                    {lawyer.barCouncilCertificate ? (
                      <a
                        href={`http://localhost:3000/uploads/${lawyer.barCouncilCertificate}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    ) : (
                      "Not Uploaded"
                    )}
                  </td>
                  <td>
                    <button onClick={() => handleApprove(lawyer._id)}>
                      ✓ Approve
                    </button>
                    <button onClick={() => handleReject(lawyer._id)}>
                      ✕ Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Verified Lawyers Table */}
          <h2>Verified Lawyers</h2>
          <table className="lawyer-table">
            <thead>
              <tr>
                <th>Profile Picture</th>
                <th>Name</th>
                <th>Email</th>
                <th>AEN</th>
                <th>Specialization</th>
                <th>Location</th>
                <th>Visibility Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVerifiedLawyers.map((lawyer) => (
                <tr key={lawyer._id}>
                  <td>
                    {lawyer.profilePicture ? (
                      <img
                        src={`http://localhost:3000/uploads/${lawyer.profilePicture}`}
                        alt="Profile"
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "50%",
                        }}
                      />
                    ) : (
                      "No Image"
                    )}
                  </td>
                  <td>{lawyer.fullname}</td>
                  <td>{lawyer.email}</td>
                  <td>{lawyer.AEN}</td>
                  <td>{lawyer.specialization}</td>
                  <td>{lawyer.location}</td>
                  <td>
                    <span
                      className={`status-indicator ${
                        lawyer.visibleToClients
                          ? "status-visible"
                          : "status-hidden"
                      }`}
                    >
                      {lawyer.visibleToClients ? "Visible" : "Not Visible"}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleToggleVisibility(lawyer._id)}>
                      {lawyer.visibleToClients ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <style jsx>{`
          .lawyer-verification {
            padding: 20px;
          }
          input {
            padding: 12px 20px;
            margin: 20px 0;
            width: 80%;
            border: 2px solid #e0e0e0;
            border-radius: 25px;
            font-size: 14px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          }
          input:focus {
            outline: none;
            border-color: #2196f3;
            box-shadow: 0 2px 8px rgba(33, 150, 243, 0.2);
          }
          .lawyer-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            margin: 20px 0;
          }
          .lawyer-table thead {
            background: linear-gradient(135deg, #1a237e, #0d47a1);
          }
          .lawyer-table th {
            padding: 18px 15px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 3px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
            position: relative;
          }
          .lawyer-table th:after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(to right, #2196f3, transparent);
            transform: scaleX(0);
            transition: transform 0.3s ease;
          }
          .lawyer-table th:hover:after {
            transform: scaleX(1);
          }
          .lawyer-table td {
            padding: 16px 15px;
            font-size: 14px;
            color: #333;
            border-bottom: 1px solid #eef2f7;
            vertical-align: middle;
          }
          .lawyer-table tbody tr {
            transition: all 0.3s ease;
          }
          .lawyer-table tbody tr:hover {
            background-color: #f8faff;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
          }
          .lawyer-table tbody tr:nth-child(even) {
            background-color: #fafbff;
          }
          .lawyer-table th:first-child,
          .lawyer-table td:first-child {
            padding-left: 25px;
          }
          .lawyer-table th:last-child,
          .lawyer-table td:last-child {
            padding-right: 25px;
          }
          .lawyer-table td img {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #fff;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
            transition: transform 0.3s ease;
          }
          .lawyer-table td img:hover {
            transform: scale(1.1);
          }
          .lawyer-table td a {
            color: #2196f3;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
          }
          .lawyer-table td a:hover {
            color: #1565c0;
            text-decoration: underline;
          }
          @media (max-width: 1024px) {
            .lawyer-table {
              display: block;
              overflow-x: auto;
              white-space: nowrap;
            }
            .lawyer-table th,
            .lawyer-table td {
              padding: 12px 10px;
            }
            .lawyer-table th {
              font-size: 13px;
            }
            .lawyer-table td {
              font-size: 13px;
            }
          }
          .status-indicator {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
          }
          .status-visible {
            background-color: #e3fcef;
            color: #00875a;
          }
          .status-hidden {
            background-color: #fff1f0;
            color: #de350b;
          }
          button {
            padding: 10px 20px;
            margin: 0 8px;
            border: none;
            border-radius: 12px;
            font-weight: 500;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 120px;
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          }
          /* Approve button */
          button:nth-child(1) {
            background: #ffffff;
            color: #00875a;
            border: 2px solid #00875a;
          }
          button:nth-child(1):hover {
            background: #00875a;
            color: white;
            box-shadow: 0 5px 15px rgba(0, 135, 90, 0.3);
          }
          /* Reject button */
          button:nth-child(2) {
            background: #ffffff;
            color: #e34935;
            border: 2px solid #e34935;
          }
          button:nth-child(2):hover {
            background: #e34935;
            color: white;
            box-shadow: 0 5px 15px rgba(227, 73, 53, 0.3);
          }
          /* Toggle visibility button (for verified lawyers) */
          button:only-child {
            background: #ffffff;
            color: #0052cc;
            border: 2px solid #0052cc;
          }
          button:only-child:hover {
            background: #0052cc;
            color: white;
            box-shadow: 0 5px 15px rgba(0, 82, 204, 0.3);
          }
          /* Common button hover effects */
          button:hover {
            transform: translateY(-2px);
          }
          button:active {
            transform: translateY(0);
          }
          /* Add ripple effect */
          button::after {
            content: "";
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            pointer-events: none;
            background-image: radial-gradient(
              circle,
              rgba(255, 255, 255, 0.3) 10%,
              transparent 10.01%
            );
            background-repeat: no-repeat;
            background-position: 50%;
            transform: scale(10, 10);
            opacity: 0;
            transition: transform 0.5s, opacity 1s;
          }
          button:active::after {
            transform: scale(0, 0);
            opacity: 0.3;
            transition: 0s;
          }
          /* Disable button styles */
          button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
          }
          /* Add icon space if needed */
          button svg {
            margin-right: 8px;
            font-size: 16px;
          }
          /* Responsive adjustments */
          @media (max-width: 768px) {
            button {
              min-width: 100px;
              padding: 8px 16px;
              font-size: 12px;
            }
          }
          .header-container {
            background: linear-gradient(
                rgba(26, 35, 126, 0.95),
                /* Dark blue with opacity */ rgba(13, 71, 161, 0.95)
                  /* Lighter blue with opacity */
              ),
              url("https://images.unsplash.com/photo-1575505586569-646b2ca898fc")
                center/cover;
            padding: 60px 0;
            margin-bottom: 40px;
            position: relative;
            overflow: hidden;
          }

          /* For the main content area */
          .lawyer-verification {
            background: linear-gradient(
                rgba(255, 255, 255, 0.95),
                rgba(255, 255, 255, 0.95)
              ),
              url("https://images.unsplash.com/photo-1575505586569-646b2ca898fc")
                fixed center/cover;
            padding: 2rem;
            min-height: 100vh;
          }

          /* Add a subtle pattern overlay */
          .pattern-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url('data:image/svg+xml,%3Csvg width="20" height="20" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M0 0h20v20H0z" fill="%23ffffff" fill-opacity="0.05"/%3E%3C/svg%3E');
            opacity: 0.1;
            pointer-events: none;
          }

          .header-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            position: relative;
            z-index: 1;
          }

          h1 {
            color: #ffffff;
            font-size: 3.2rem;
            font-weight: 700;
            margin: 0;
            padding: 0;
            font-family: "Poppins", sans-serif;
            letter-spacing: 1px;
            text-transform: uppercase;
            position: relative;
            display: inline-block;
          }

          h1::after {
            content: "";
            position: absolute;
            bottom: -10px;
            left: 0;
            width: 80px;
            height: 4px;
            background: #2196f3;
            border-radius: 2px;
            box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);
          }

          .subtitle {
            color: rgba(255, 255, 255, 0.9);
            font-size: 1.1rem;
            margin: 20px 0;
            font-weight: 400;
            letter-spacing: 0.5px;
          }

          .stats-container {
            display: flex;
            gap: 30px;
            margin-top: 30px;
          }

          .stat-box {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 15px 25px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
          }

          .stat-box:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.15);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          }

          .stat-number {
            display: block;
            color: #ffffff;
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 5px;
            font-family: "Poppins", sans-serif;
          }

          .stat-label {
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          /* Responsive styles */
          @media (max-width: 768px) {
            .header-container {
              padding: 30px 0;
            }

            h1 {
              font-size: 2.5rem;
            }

            .subtitle {
              font-size: 1rem;
            }

            .stats-container {
              flex-direction: column;
              gap: 15px;
            }

            .stat-box {
              padding: 12px 20px;
            }

            .stat-number {
              font-size: 1.8rem;
            }
          }
        `}</style>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        limit={3}
      />
      <Footer />
    </div>
  );
};

export default LawyerVerification;
