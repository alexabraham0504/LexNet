import React, { useEffect, useState } from "react";
import axios from "axios";
import Footer from "../../components/footer/footer-admin";
import Navbar from "../../components/navbar/navbar-admin";

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
      alert("Lawyer approved successfully!");
      fetchVerifiedLawyers(); // Refresh the verified lawyers list
    } catch (error) {
      console.error("Error approving lawyer:", error);
      alert("Failed to approve lawyer.");
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/lawyers/reject/${id}`);
      setUnverifiedLawyers((prevLawyers) =>
        prevLawyers.filter((lawyer) => lawyer._id !== id)
      );
      alert("Lawyer rejected successfully!");
    } catch (error) {
      console.error("Error rejecting lawyer:", error);
      alert("Failed to reject lawyer.");
    }
  };

  const handleToggleVisibility = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/lawyers/toggle-visibility/${id}`
      );
      fetchVerifiedLawyers(); // Refresh the verified lawyers list after toggling visibility
    } catch (error) {
      console.error("Error toggling lawyer visibility:", error);
      alert("Failed to toggle lawyer visibility.");
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

  return (
    <div>
      <Navbar />

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
                        src={`http://localhost:5000/uploads/${lawyer.profilePicture}`}
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
                        href={`http://localhost:5000/uploads/${lawyer.lawDegreeCertificate}`}
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
                        href={`http://localhost:5000/uploads/${lawyer.barCouncilCertificate}`}
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
                      Approve
                    </button>
                    <button onClick={() => handleReject(lawyer._id)}>
                      Reject
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
                        src={`http://localhost:5000/uploads/${lawyer.profilePicture}`}
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
                  <td>{lawyer.visibleToClients ? "Visible" : "Not Visible"}</td>
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
            padding: 10px;
            margin: 20px 0;
            width: 80%;
          }
          .lawyer-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th,
          td {
            padding: 12px;
            border: 1px solid #ddd;
            text-align: center;
          }
          th {
            background-color: #f2f2f2;
          }
          tr:hover {
            background-color: #f1f1f1;
          }
          button {
            padding: 8px 12px;
            margin-right: 5px;
            cursor: pointer;
          }
          button:hover {
            background-color: #e0e0e0;
          }
        `}</style>
      </div>
      <Footer />
    </div>
  );
};

export default LawyerVerification;
