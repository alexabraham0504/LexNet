import React, { useEffect, useState } from "react";
import axios from "axios";
import Footer from "../../components/footer/footer-admin";
import Navbar from "../../components/navbar/navbar-admin";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import "@fontsource/poppins";
import "@fontsource/roboto";
import styled from "styled-components";

const StyledContainer = styled.div`
  background: #f6f9fc;
  min-height: 100vh;
  padding: 2rem 4rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const DashboardHeader = styled(motion.div)`
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 20px;
  padding: 2.5rem;
  margin-bottom: 2rem;
  color: white;
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.15);

  h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    font-weight: 700;
  }

  .subtitle {
    font-size: 1.1rem;
    opacity: 0.9;
  }

  .stats-container {
    display: flex;
    gap: 2rem;
    margin-top: 1.5rem;
  }

  .stat-box {
    background: rgba(255, 255, 255, 0.1);
    padding: 1rem 2rem;
    border-radius: 12px;
    backdrop-filter: blur(10px);

    .stat-number {
      font-size: 1.8rem;
      font-weight: 700;
      display: block;
    }

    .stat-label {
      font-size: 0.9rem;
      opacity: 0.9;
    }
  }
`;

const SearchInput = styled(motion.input)`
  width: 100%;
  max-width: 500px;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  font-size: 1rem;
  background: white;
  margin: 1rem 0 2rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);

  &:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    outline: none;
  }
`;

const TableSection = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);

  h2 {
    color: #1e293b;
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #6366f1;
  }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 0.75rem;

  th {
    background: #f8fafc;
    color: #475569;
    font-weight: 600;
    text-align: left;
    padding: 1rem;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  td {
    padding: 1rem;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    font-size: 0.875rem;
    color: #1e293b;
  }

  tr {
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
  }
`;

const ActionButton = styled(motion.button)`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;

  &.approve {
    background: #10b981;
    color: white;
    &:hover {
      background: #059669;
    }
  }

  &.reject {
    background: #ef4444;
    color: white;
    &:hover {
      background: #dc2626;
    }
  }

  &.toggle-active {
    background: #6366f1;
    color: white;
    &:hover {
      background: #4f46e5;
    }
  }

  &.toggle-inactive {
    background: #94a3b8;
    color: white;
    &:hover {
      background: #64748b;
    }
  }
`;

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
        "http://localhost:5000/api/lawyers/unverified"
      );
      console.log("Unverified lawyers response:", response.data); // Debug log
      setUnverifiedLawyers(response.data);
    } catch (error) {
      console.error("Error fetching unverified lawyers:", error);
    }
  };

  const fetchVerifiedLawyers = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/lawyers/verified"
      );
      console.log("Verified lawyers response:", response.data); // Debug log
      setVerifiedLawyers(response.data);
    } catch (error) {
      console.error("Error fetching verified lawyers:", error);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/lawyers/approve/${id}`);
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
      await axios.delete(`http://localhost:5000/api/lawyers/reject/${id}`);
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

  const handleToggleVisibility = async (id, currentStatus) => {
    try {
      await axios.put(
        `http://localhost:5000/api/lawyers/toggle-visibility/${id}`
      );
      setVerifiedLawyers((prevLawyers) =>
        prevLawyers.map((lawyer) =>
          lawyer._id === id
            ? { ...lawyer, visibleToClients: !lawyer.visibleToClients }
            : lawyer
        )
      );

      toast.success(
        `Lawyer ${currentStatus ? "deactivated" : "activated"} successfully!`,
        {
          position: "top-right",
          style: {
            background: "linear-gradient(45deg, #ffffff, #f5f5f5)",
            color: "#333333",
          },
        }
      );
    } catch (error) {
      console.error("Error toggling lawyer visibility:", error);
      toast.error("Failed to update status.", {
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

  const styles = {
    container: {
      padding: "2rem",
      fontFamily: "Poppins, sans-serif",
      background: "linear-gradient(to right, #f8f9fa, #e9ecef)",
      minHeight: "100vh",
    },
    searchInput: {
      width: "100%",
      maxWidth: "400px",
      padding: "12px 20px",
      margin: "20px 0",
      borderRadius: "30px",
      border: "2px solid #e0e0e0",
      fontSize: "16px",
      transition: "all 0.3s ease",
      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
      "&:focus": {
        outline: "none",
        borderColor: "#4a90e2",
        boxShadow: "0 4px 10px rgba(74,144,226,0.2)",
      },
    },
    section: {
      background: "#ffffff",
      borderRadius: "15px",
      padding: "2rem",
      marginBottom: "2rem",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      transition: "transform 0.3s ease",
      "&:hover": {
        transform: "translateY(-5px)",
      },
    },
    sectionTitle: {
      color: "#2c3e50",
      fontSize: "24px",
      fontWeight: "600",
      marginBottom: "1.5rem",
      borderBottom: "2px solid #4a90e2",
      paddingBottom: "10px",
    },
    table: {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: "0 10px",
    },
    tableRow: {
      transition: "all 0.3s ease",
      "&:hover": {
        transform: "scale(1.01)",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
      },
    },
    tableHeader: {
      backgroundColor: "#f8f9fa",
      color: "#2c3e50",
      padding: "15px",
      fontWeight: "600",
      textAlign: "left",
      borderBottom: "2px solid #4a90e2",
      fontSize: "14px",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    tableCell: {
      padding: "15px",
      backgroundColor: "#ffffff",
      borderBottom: "1px solid #e0e0e0",
      fontSize: "14px",
      lineHeight: "1.5",
      color: "#333",
      verticalAlign: "middle",
    },
    actionButtons: {
      display: "flex",
      gap: "10px",
      justifyContent: "center",
    },
    approveButton: {
      padding: "8px 20px",
      borderRadius: "25px",
      border: "none",
      background: "linear-gradient(45deg, #2ecc71, #27ae60)",
      color: "white",
      cursor: "pointer",
      transition: "all 0.3s ease",
      fontSize: "14px",
      fontWeight: "500",
      boxShadow: "0 2px 10px rgba(46,204,113,0.2)",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 4px 15px rgba(46,204,113,0.4)",
      },
    },
    rejectButton: {
      padding: "8px 20px",
      borderRadius: "25px",
      border: "none",
      background: "linear-gradient(45deg, #e74c3c, #c0392b)",
      color: "white",
      cursor: "pointer",
      transition: "all 0.3s ease",
      fontSize: "14px",
      fontWeight: "500",
      boxShadow: "0 2px 10px rgba(231,76,60,0.2)",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 4px 15px rgba(231,76,60,0.4)",
      },
    },
    toggleButtonActive: {
      padding: "8px 20px",
      borderRadius: "25px",
      border: "none",
      background: "linear-gradient(45deg, #3498db, #2980b9)",
      color: "white",
      cursor: "pointer",
      transition: "all 0.3s ease",
      fontSize: "14px",
      fontWeight: "500",
      boxShadow: "0 2px 10px rgba(52,152,219,0.2)",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 4px 15px rgba(52,152,219,0.4)",
      },
    },
    toggleButtonInactive: {
      padding: "8px 20px",
      borderRadius: "25px",
      border: "none",
      background: "linear-gradient(45deg, #95a5a6, #7f8c8d)",
      color: "white",
      cursor: "pointer",
      transition: "all 0.3s ease",
      fontSize: "14px",
      fontWeight: "500",
      boxShadow: "0 2px 10px rgba(52,152,219,0.2)",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 4px 15px rgba(52,152,219,0.4)",
      },
    },
    certificatesSection: {
      marginTop: "15px",
      padding: "15px",
      backgroundColor: "#f8f9fa",
      borderRadius: "6px",
    },
    certificateList: {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    },
    certificate: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px",
      backgroundColor: "#ffffff",
      borderRadius: "4px",
      border: "1px solid #dee2e6",
    },
    certificateInfo: {
      flex: 1,
    },
    certificateName: {
      fontWeight: "500",
      color: "#212529",
      display: "block",
    },
    certificateDate: {
      fontSize: "12px",
      color: "#6c757d",
      display: "block",
      marginTop: "2px",
    },
    certificateDescription: {
      fontSize: "14px",
      color: "#495057",
      margin: "5px 0 0",
    },
    viewButton: {
      padding: "5px 10px",
      backgroundColor: "#007bff",
      color: "#ffffff",
      textDecoration: "none",
      borderRadius: "4px",
      fontSize: "14px",
      "&:hover": {
        backgroundColor: "#0056b3",
      },
    },
    profileImage: {
      width: "50px",
      height: "50px",
      borderRadius: "50%",
      objectFit: "cover",
      border: "2px solid #e0e0e0",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
  };

  const PageHeader = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="header-container"
      style={{
        background: "linear-gradient(45deg, #4a90e2, #63b3ed)",
        padding: "2rem",
        borderRadius: "15px",
        color: "white",
        marginBottom: "2rem",
      }}
    >
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
    </motion.div>
  );

  const UnverifiedLawyersTable = () => (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.tableHeader}>Profile</th>
          <th style={styles.tableHeader}>Name</th>
          <th style={styles.tableHeader}>Email</th>
          <th style={styles.tableHeader}>Phone</th>
          <th style={styles.tableHeader}>Specialization</th>
          <th style={styles.tableHeader}>Required Documents</th>
          <th style={styles.tableHeader}>Additional Certificates</th>
          <th style={styles.tableHeader}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredUnverifiedLawyers.map((lawyer) => (
          <motion.tr
            key={lawyer._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={styles.tableRow}
          >
            <td style={styles.tableCell}>
              <img
                src={
                  lawyer.profilePicture
                    ? `http://localhost:5000/uploads/${lawyer.profilePicture}`
                    : "default-profile.png"
                }
                alt={lawyer.fullname}
                style={styles.profileImage}
                onError={(e) => {
                  e.target.src = "/default-profile.png";
                  e.target.onerror = null;
                }}
              />
            </td>
            <td style={styles.tableCell}>{lawyer.fullname}</td>
            <td style={styles.tableCell}>{lawyer.email}</td>
            <td style={styles.tableCell}>{lawyer.phone}</td>
            <td style={styles.tableCell}>{lawyer.specialization}</td>
            <td style={styles.tableCell}>
              <div style={styles.documentLinks}>
                {lawyer.lawDegreeCertificate && (
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    href={`http://localhost:5000/uploads/${lawyer.lawDegreeCertificate}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.documentLink}
                  >
                    Law Degree
                  </motion.a>
                )}
                {lawyer.barCouncilCertificate && (
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    href={`http://localhost:5000/uploads/${lawyer.barCouncilCertificate}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.documentLink}
                  >
                    Bar Council
                  </motion.a>
                )}
              </div>
            </td>
            <td style={styles.tableCell}>
              {Array.isArray(lawyer.additionalCertificates) &&
                lawyer.additionalCertificates.map((cert, index) => (
                  <motion.a
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    href={`http://localhost:5000/uploads/${cert.file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.documentLink}
                  >
                    {cert.name || `Certificate ${index + 1}`}
                  </motion.a>
                ))}
            </td>
            <td style={styles.tableCell}>
              <div style={styles.actionButtons}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleApprove(lawyer._id)}
                  style={styles.approveButton}
                >
                  Approve
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleReject(lawyer._id)}
                  style={styles.rejectButton}
                >
                  Reject
                </motion.button>
              </div>
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  );

  const VerifiedLawyersTable = () => (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.tableHeader}>Profile</th>
          <th style={styles.tableHeader}>Name</th>
          <th style={styles.tableHeader}>Email</th>
          <th style={styles.tableHeader}>Phone</th>
          <th style={styles.tableHeader}>Specialization</th>
          <th style={styles.tableHeader}>Certificates</th>
          <th style={styles.tableHeader}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredVerifiedLawyers.map((lawyer) => (
          <motion.tr
            key={lawyer._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={styles.tableRow}
          >
            <td style={styles.tableCell}>
              <img
                src={
                  lawyer.profilePicture
                    ? `http://localhost:5000/uploads/${lawyer.profilePicture}`
                    : "/default-profile.png"
                }
                alt={lawyer.fullname}
                style={styles.profileImage}
                onError={(e) => {
                  e.target.src = "/default-profile.png";
                  e.target.onerror = null;
                }}
              />
            </td>
            <td style={styles.tableCell}>{lawyer.fullname}</td>
            <td style={styles.tableCell}>{lawyer.email}</td>
            <td style={styles.tableCell}>{lawyer.phone}</td>
            <td style={styles.tableCell}>{lawyer.specialization}</td>
            <td style={styles.tableCell}>
              <div style={styles.certificatesSection}>
                <h4 style={styles.sectionTitle}>Required Certificates</h4>
                <div style={styles.certificateList}>
                  {lawyer.lawDegreeCertificate && (
                    <div style={styles.certificate}>
                      <span>Law Degree Certificate</span>
                      <a
                        href={`http://localhost:5000/uploads/${lawyer.lawDegreeCertificate}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.viewButton}
                      >
                        View
                      </a>
                    </div>
                  )}
                  {lawyer.barCouncilCertificate && (
                    <div style={styles.certificate}>
                      <span>Bar Council Certificate</span>
                      <a
                        href={`http://localhost:5000/uploads/${lawyer.barCouncilCertificate}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.viewButton}
                      >
                        View
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Certificates */}
              {Array.isArray(lawyer.additionalCertificates) &&
                lawyer.additionalCertificates.length > 0 && (
                  <div style={styles.certificatesSection}>
                    <h4 style={styles.sectionTitle}>Additional Certificates</h4>
                    <div style={styles.certificateList}>
                      {lawyer.additionalCertificates.map((cert, index) => (
                        <div key={cert._id || index} style={styles.certificate}>
                          <div style={styles.certificateInfo}>
                            <span style={styles.certificateName}>
                              {cert.name || "Additional Certificate"}
                            </span>
                            {cert.uploadDate && (
                              <span style={styles.certificateDate}>
                                {new Date(cert.uploadDate).toLocaleDateString()}
                              </span>
                            )}
                            {cert.description && (
                              <p style={styles.certificateDescription}>
                                {cert.description}
                              </p>
                            )}
                          </div>
                          <a
                            href={`http://localhost:5000/uploads/${cert.file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.viewButton}
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </td>
            <td style={styles.tableCell}>
              <div style={styles.actionButtons}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    handleToggleVisibility(lawyer._id, lawyer.visibleToClients)
                  }
                  style={
                    lawyer.visibleToClients
                      ? styles.toggleButtonActive
                      : styles.toggleButtonInactive
                  }
                >
                  {lawyer.visibleToClients ? "Deactivate" : "Activate"}
                </motion.button>
              </div>
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <>
      <Navbar />
      <StyledContainer>
        <DashboardHeader
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Lawyer Verification Dashboard</h1>
          <p className="subtitle">Manage and verify lawyer registrations</p>
          <div className="stats-container">
            <div className="stat-box">
              <span className="stat-number">{unverifiedLawyers.length}</span>
              <span className="stat-label">Pending Verification</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{verifiedLawyers.length}</span>
              <span className="stat-label">Verified Lawyers</span>
            </div>
          </div>
        </DashboardHeader>

        <SearchInput
          type="text"
          placeholder="Search lawyers by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          whileFocus={{ scale: 1.01 }}
        />

        <TableSection
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2>Pending Verification</h2>
          <StyledTable>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Profile</th>
                <th style={styles.tableHeader}>Name</th>
                <th style={styles.tableHeader}>Email</th>
                <th style={styles.tableHeader}>Phone</th>
                <th style={styles.tableHeader}>Specialization</th>
                <th style={styles.tableHeader}>Required Documents</th>
                <th style={styles.tableHeader}>Additional Certificates</th>
                <th style={styles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnverifiedLawyers.map((lawyer) => (
                <motion.tr
                  key={lawyer._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  style={styles.tableRow}
                >
                  <td style={styles.tableCell}>
                    <img
                      src={
                        lawyer.profilePicture
                          ? `http://localhost:5000/uploads/${lawyer.profilePicture}`
                          : "default-profile.png"
                      }
                      alt={lawyer.fullname}
                      style={styles.profileImage}
                      onError={(e) => {
                        e.target.src = "/default-profile.png";
                        e.target.onerror = null;
                      }}
                    />
                  </td>
                  <td style={styles.tableCell}>{lawyer.fullname}</td>
                  <td style={styles.tableCell}>{lawyer.email}</td>
                  <td style={styles.tableCell}>{lawyer.phone}</td>
                  <td style={styles.tableCell}>{lawyer.specialization}</td>
                  <td style={styles.tableCell}>
                    <div style={styles.documentLinks}>
                      {lawyer.lawDegreeCertificate && (
                        <motion.a
                          whileHover={{ scale: 1.05 }}
                          href={`http://localhost:5000/uploads/${lawyer.lawDegreeCertificate}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.documentLink}
                        >
                          Law Degree
                        </motion.a>
                      )}
                      {lawyer.barCouncilCertificate && (
                        <motion.a
                          whileHover={{ scale: 1.05 }}
                          href={`http://localhost:5000/uploads/${lawyer.barCouncilCertificate}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.documentLink}
                        >
                          Bar Council
                        </motion.a>
                      )}
                    </div>
                  </td>
                  <td style={styles.tableCell}>
                    {Array.isArray(lawyer.additionalCertificates) &&
                      lawyer.additionalCertificates.map((cert, index) => (
                        <motion.a
                          key={index}
                          whileHover={{ scale: 1.05 }}
                          href={`http://localhost:5000/uploads/${cert.file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.documentLink}
                        >
                          {cert.name || `Certificate ${index + 1}`}
                        </motion.a>
                      ))}
                  </td>
                  <td style={styles.tableCell}>
                    <div style={styles.actionButtons}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleApprove(lawyer._id)}
                        style={styles.approveButton}
                      >
                        Approve
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleReject(lawyer._id)}
                        style={styles.rejectButton}
                      >
                        Reject
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </StyledTable>
        </TableSection>

        <TableSection
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2>Verified Lawyers</h2>
          <StyledTable>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Profile</th>
                <th style={styles.tableHeader}>Name</th>
                <th style={styles.tableHeader}>Email</th>
                <th style={styles.tableHeader}>Phone</th>
                <th style={styles.tableHeader}>Specialization</th>
                <th style={styles.tableHeader}>Certificates</th>
                <th style={styles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVerifiedLawyers.map((lawyer) => (
                <motion.tr
                  key={lawyer._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  style={styles.tableRow}
                >
                  <td style={styles.tableCell}>
                    <img
                      src={
                        lawyer.profilePicture
                          ? `http://localhost:5000/uploads/${lawyer.profilePicture}`
                          : "/default-profile.png"
                      }
                      alt={lawyer.fullname}
                      style={styles.profileImage}
                      onError={(e) => {
                        e.target.src = "/default-profile.png";
                        e.target.onerror = null;
                      }}
                    />
                  </td>
                  <td style={styles.tableCell}>{lawyer.fullname}</td>
                  <td style={styles.tableCell}>{lawyer.email}</td>
                  <td style={styles.tableCell}>{lawyer.phone}</td>
                  <td style={styles.tableCell}>{lawyer.specialization}</td>
                  <td style={styles.tableCell}>
                    <div style={styles.certificatesSection}>
                      <h4 style={styles.sectionTitle}>Required Certificates</h4>
                      <div style={styles.certificateList}>
                        {lawyer.lawDegreeCertificate && (
                          <div style={styles.certificate}>
                            <span>Law Degree Certificate</span>
                            <a
                              href={`http://localhost:5000/uploads/${lawyer.lawDegreeCertificate}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={styles.viewButton}
                            >
                              View
                            </a>
                          </div>
                        )}
                        {lawyer.barCouncilCertificate && (
                          <div style={styles.certificate}>
                            <span>Bar Council Certificate</span>
                            <a
                              href={`http://localhost:5000/uploads/${lawyer.barCouncilCertificate}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={styles.viewButton}
                            >
                              View
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Additional Certificates */}
                    {Array.isArray(lawyer.additionalCertificates) &&
                      lawyer.additionalCertificates.length > 0 && (
                        <div style={styles.certificatesSection}>
                          <h4 style={styles.sectionTitle}>
                            Additional Certificates
                          </h4>
                          <div style={styles.certificateList}>
                            {lawyer.additionalCertificates.map(
                              (cert, index) => (
                                <div
                                  key={cert._id || index}
                                  style={styles.certificate}
                                >
                                  <div style={styles.certificateInfo}>
                                    <span style={styles.certificateName}>
                                      {cert.name || "Additional Certificate"}
                                    </span>
                                    {cert.uploadDate && (
                                      <span style={styles.certificateDate}>
                                        {new Date(
                                          cert.uploadDate
                                        ).toLocaleDateString()}
                                      </span>
                                    )}
                                    {cert.description && (
                                      <p style={styles.certificateDescription}>
                                        {cert.description}
                                      </p>
                                    )}
                                  </div>
                                  <a
                                    href={`http://localhost:5000/uploads/${cert.file}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={styles.viewButton}
                                  >
                                    View
                                  </a>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </td>
                  <td style={styles.tableCell}>
                    <div style={styles.actionButtons}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          handleToggleVisibility(
                            lawyer._id,
                            lawyer.visibleToClients
                          )
                        }
                        style={
                          lawyer.visibleToClients
                            ? styles.toggleButtonActive
                            : styles.toggleButtonInactive
                        }
                      >
                        {lawyer.visibleToClients ? "Deactivate" : "Activate"}
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </StyledTable>
        </TableSection>
      </StyledContainer>
      <Footer />
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
        theme="light"
      />
    </>
  );
};

export default LawyerVerification;
