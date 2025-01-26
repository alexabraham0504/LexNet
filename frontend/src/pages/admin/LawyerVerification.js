import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "../../components/footer/footer-admin";
import Navbar from "../../components/navbar/navbar-admin";

// Define ActionButtons component at the top of the file, before the main component
const ActionButtons = ({ lawyer, onApprove, onReject, onToggle }) => (
  <div style={styles.actionButtons}>
    {lawyer.isVerified ? (
      <button style={styles.toggleBtn} onClick={() => onToggle(lawyer._id)}>
        {lawyer.visibleToClients ? "Deactivate" : "Activate"}
      </button>
    ) : (
      <>
        <button style={styles.approveBtn} onClick={() => onApprove(lawyer._id)}>
          Approve
        </button>
        <button style={styles.rejectBtn} onClick={() => onReject(lawyer._id)}>
          Reject
        </button>
      </>
    )}
  </div>
);

const LawyerVerification = () => {
  const [unverifiedLawyers, setUnverifiedLawyers] = useState([]);
  const [verifiedLawyers, setVerifiedLawyers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchLawyers();
  }, []);

  const fetchLawyers = async () => {
    try {
      const [unverifiedRes, verifiedRes] = await Promise.all([
        axios.get("http://localhost:5000/api/lawyers/unverified"),
        axios.get("http://localhost:5000/api/lawyers/verified"),
      ]);
      setUnverifiedLawyers(unverifiedRes.data);
      setVerifiedLawyers(verifiedRes.data);
    } catch (error) {
      console.error("Error fetching lawyers:", error);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/lawyers/approve/${id}`);
      setUnverifiedLawyers((prev) =>
        prev.filter((lawyer) => lawyer._id !== id)
      );
      fetchLawyers();
      toast.success("Lawyer approved successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error("Error approving lawyer:", error);
      toast.error("Failed to approve lawyer");
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/lawyers/reject/${id}`);
      setUnverifiedLawyers((prev) =>
        prev.filter((lawyer) => lawyer._id !== id)
      );
      toast.info("Lawyer application rejected", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error rejecting lawyer:", error);
      toast.error("Failed to reject lawyer");
    }
  };

  const handleToggleVisibility = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/lawyers/toggle-visibility/${id}`
      );
      setVerifiedLawyers((prev) =>
        prev.map((lawyer) =>
          lawyer._id === id
            ? { ...lawyer, visibleToClients: !lawyer.visibleToClients }
            : lawyer
        )
      );
      toast.success("Visibility status updated!", {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error toggling lawyer visibility:", error);
      toast.error("Failed to update visibility status");
    }
  };

  const filterLawyers = (lawyers) =>
    lawyers.filter((lawyer) =>
      lawyer.fullname?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div style={styles.container}>
      <Navbar />
      <ToastContainer />
      <div style={styles.content}>
        <h1 style={styles.heading}>Lawyer Verification Dashboard</h1>
        <p style={styles.subheading}>Manage and verify lawyer registrations</p>

        <div style={styles.stats}>
          <div style={styles.statBox}>
            <div>Pending Verification</div>
            <div>{unverifiedLawyers.length}</div>
          </div>
          <div style={styles.statBox}>
            <div>Verified Lawyers</div>
            <div>{verifiedLawyers.length}</div>
          </div>
        </div>

        <input
          type="text"
          style={styles.searchBar}
          placeholder="Search lawyers by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Pending Verification Table */}
        <div style={styles.tableContainer}>
          <h2>Pending Verification</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Profile</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>AEN</th>
                <th>Specialization</th>
                <th>Documents</th>
                <th>Additional Certificates</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filterLawyers(unverifiedLawyers).map((lawyer) => (
                <tr key={lawyer._id}>
                  <td>
                    <img
                      src={
                        lawyer.profilePicture
                          ? `http://localhost:5000/uploads/${lawyer.profilePicture}`
                          : "/default-profile.png"
                      }
                      alt={lawyer.fullname}
                      onError={(e) => (e.target.src = "/default-profile.png")}
                      style={styles.profilePic}
                    />
                  </td>
                  <td>{lawyer.fullname}</td>
                  <td>{lawyer.email}</td>
                  <td>{lawyer.phone}</td>
                  <td>{lawyer.AEN}</td>
                  <td>{lawyer.specialization}</td>
                  <td>
                    {lawyer.lawDegreeCertificate && (
                      <a
                        style={styles.documentLink}
                        href={`http://localhost:5000/uploads/${lawyer.lawDegreeCertificate}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Law Degree
                      </a>
                    )}
                    {lawyer.barCouncilCertificate && (
                      <a
                        style={styles.documentLink}
                        href={`http://localhost:5000/uploads/${lawyer.barCouncilCertificate}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Bar Council
                      </a>
                    )}
                  </td>
                  <td>
                    {lawyer.additionalCertificates &&
                      lawyer.additionalCertificates.map((cert, index) => (
                        <a
                          key={index}
                          style={styles.documentLink}
                          href={`http://localhost:5000/uploads/${cert.file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={cert.description}
                        >
                          {cert.name}
                        </a>
                      ))}
                  </td>
                  <td>
                    <ActionButtons
                      lawyer={lawyer}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onToggle={handleToggleVisibility}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Verified Lawyers Table */}
        <div style={styles.tableContainer}>
          <h2>Verified Lawyers</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Profile</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>AEN</th>
                <th>Specialization</th>
                <th>Documents</th>
                <th>Additional Certificates</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filterLawyers(verifiedLawyers).map((lawyer) => (
                <tr key={lawyer._id}>
                  <td>
                    <img
                      src={
                        lawyer.profilePicture
                          ? `http://localhost:5000/uploads/${lawyer.profilePicture}`
                          : "/default-profile.png"
                      }
                      alt={lawyer.fullname}
                      style={styles.profilePic}
                    />
                  </td>
                  <td>{lawyer.fullname}</td>
                  <td>{lawyer.email}</td>
                  <td>{lawyer.phone}</td>
                  <td>{lawyer.AEN}</td>
                  <td>{lawyer.specialization}</td>
                  <td>
                    {lawyer.lawDegreeCertificate && (
                      <a
                        style={styles.documentLink}
                        href={`http://localhost:5000/uploads/${lawyer.lawDegreeCertificate}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Law Degree
                      </a>
                    )}
                    {lawyer.barCouncilCertificate && (
                      <a
                        style={styles.documentLink}
                        href={`http://localhost:5000/uploads/${lawyer.barCouncilCertificate}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Bar Council
                      </a>
                    )}
                  </td>
                  <td>
                    {lawyer.additionalCertificates &&
                      lawyer.additionalCertificates.map((cert, index) => (
                        <a
                          key={index}
                          style={styles.documentLink}
                          href={`http://localhost:5000/uploads/${cert.file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={cert.description}
                        >
                          {cert.name}
                        </a>
                      ))}
                  </td>
                  <td>
                    <ActionButtons
                      lawyer={lawyer}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onToggle={handleToggleVisibility}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LawyerVerification;

// ===== Inline Styles =====
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(145deg, #f0f2f5, #e8eaf6)",
    padding: "30px 20px",
    fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
  },
  content: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "40px",
    backgroundColor: "white",
    borderRadius: "24px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
  },
  heading: {
    color: "#2c3e50",
    marginBottom: "20px",
    fontSize: "36px",
    fontWeight: "700",
    letterSpacing: "-0.5px",
    background: "linear-gradient(45deg, #1a237e, #3949ab)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subheading: {
    color: "#5c6bc0",
    marginBottom: "35px",
    fontSize: "20px",
    fontWeight: "500",
    letterSpacing: "0.2px",
  },
  stats: {
    display: "flex",
    gap: "30px",
    marginBottom: "50px",
    padding: "10px 0",
  },
  statBox: {
    flex: 1,
    padding: "30px",
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
    border: "1px solid rgba(228, 232, 240, 0.8)",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
      transform: "translateY(-5px)",
      boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
    },
  },
  searchBar: {
    width: "100%",
    padding: "18px 25px",
    marginBottom: "35px",
    border: "2px solid #e8eaf6",
    borderRadius: "16px",
    fontSize: "16px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    backgroundColor: "#f8f9ff",
    "&:focus": {
      outline: "none",
      borderColor: "#3f51b5",
      backgroundColor: "#ffffff",
      boxShadow: "0 0 0 4px rgba(63, 81, 181, 0.1)",
    },
  },
  tableContainer: {
    margin: "40px 0",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 12px 36px rgba(0,0,0,0.1)",
    border: "1px solid rgba(228, 232, 240, 0.8)",
    background: "#ffffff",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0",
    "& th": {
      padding: "20px 24px",
      backgroundColor: "#f8f9ff",
      color: "#2c3e50",
      fontSize: "15px",
      fontWeight: "600",
      letterSpacing: "0.5px",
      textTransform: "uppercase",
      borderBottom: "2px solid #e8eaf6",
    },
    "& td": {
      padding: "20px 24px",
      fontSize: "15px",
      color: "#4a5568",
      borderBottom: "1px solid #edf2f7",
      transition: "all 0.2s ease",
    },
    "& tr:hover td": {
      backgroundColor: "#f8f9ff",
    },
  },
  profilePic: {
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    objectFit: "cover",
    border: "3px solid #fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "scale(1.1) rotate(3deg)",
      boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
    },
  },
  documentLink: {
    display: "inline-block",
    color: "#3f51b5",
    textDecoration: "none",
    padding: "8px 16px",
    margin: "4px 8px 4px 0",
    borderRadius: "12px",
    backgroundColor: "#e8eaf6",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    border: "1px solid transparent",
    "&:hover": {
      backgroundColor: "#c5cae9",
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      border: "1px solid #3f51b5",
    },
  },
  approveBtn: {
    backgroundColor: "#4caf50",
    color: "white",
    padding: "12px 24px",
    margin: "6px",
    borderRadius: "12px",
    border: "none",
    fontSize: "14px",
    fontWeight: "600",
    letterSpacing: "0.5px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 12px rgba(76, 175, 80, 0.2)",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 6px 16px rgba(76, 175, 80, 0.3)",
      backgroundColor: "#43a047",
    },
  },
  rejectBtn: {
    backgroundColor: "#f44336",
    color: "white",
    padding: "12px 24px",
    margin: "6px",
    borderRadius: "12px",
    border: "none",
    fontSize: "14px",
    fontWeight: "600",
    letterSpacing: "0.5px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 12px rgba(244, 67, 54, 0.2)",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 6px 16px rgba(244, 67, 54, 0.3)",
      backgroundColor: "#e53935",
    },
  },
  toggleBtn: {
    backgroundColor: "#3f51b5",
    color: "white",
    padding: "12px 24px",
    borderRadius: "12px",
    border: "none",
    fontSize: "14px",
    fontWeight: "600",
    letterSpacing: "0.5px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 12px rgba(63, 81, 181, 0.2)",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 6px 16px rgba(63, 81, 181, 0.3)",
      backgroundColor: "#3949ab",
    },
  },
  actionButtons: {
    display: "flex",
    gap: "10px",
  },
};
