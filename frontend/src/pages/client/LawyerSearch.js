import React, { useEffect, useState } from "react";
import axios from "axios";
import Footer from "../../components/footer/footer-client";
import Navbar from "../../components/navbar/navbar-client";

const LawyerSearch = () => {
  const [verifiedLawyers, setVerifiedLawyers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchVerifiedLawyers();
  }, []);

  // Fetch verified lawyers from backend
  const fetchVerifiedLawyers = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/lawyers/verified"
       
      );
      const activeVerifiedLawyers = response.data.filter(
        (lawyer) => lawyer.isVerified && lawyer.visibleToClients
      );
      setVerifiedLawyers(activeVerifiedLawyers);
    } catch (error) {
      console.error("Error fetching verified lawyers:", error);
    }
  };

  // Filter lawyers based on search term
  const filteredLawyers = verifiedLawyers.filter((lawyer) => {
    const searchTermLower = searchTerm.toLowerCase( `http://localhost:5000/api/lawyers/verified?search=${searchTerm}`);
    return (
      (lawyer.fullname &&
        lawyer.fullname.toLowerCase().includes(searchTermLower)) ||
      (lawyer.specialization &&
        lawyer.specialization.toLowerCase().includes(searchTermLower)) ||
      (lawyer.location &&
        lawyer.location.toLowerCase().includes(searchTermLower))
    );
  });

  return (
    <div>
      <Navbar />

      <div className="lawyer-search-container">
        <h1>Search for Verified Lawyers</h1>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search lawyers by name, specialization, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredLawyers.length > 0 ? (
          <div className="lawyer-list">
            {filteredLawyers.map((lawyer) => (
              <div key={lawyer._id} className="lawyer-card">
                <div className="profile-section">
                  {lawyer.profilePicture ? (
                    <img
                      src={`http://localhost:5000/uploads/${lawyer.profilePicture}`}
                      alt={`${lawyer.fullname}'s profile`}
                      className="profile-picture"
                    />
                  ) : (
                    <div className="no-profile-picture">No Image</div>
                  )}
                </div>
                <div className="info-section">
                  <h3>{lawyer.fullname}</h3>
                  <p>
                    <strong>Specialization:</strong> {lawyer.specialization}
                  </p>
                  <p>
                    <strong>Location:</strong> {lawyer.location}
                  </p>
                  <p>
                    <strong>Email:</strong> {lawyer.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-results">No lawyers found.</p>
        )}

        <Footer />

        <style jsx>{`
          .lawyer-search-container {
            padding: 50px 20px;
            text-align: center;
          }

          h1 {
            font-size: 2.4rem;
            margin-bottom: 30px;
            color: #333;
          }

          .search-bar {
            margin-bottom: 30px;
          }

          input {
            padding: 12px 20px;
            width: 70%;
            border: 1px solid #ccc;
            border-radius: 30px;
            font-size: 1rem;
          }

          input:focus {
            outline: none;
            border-color: #007bff;
          }

          .lawyer-list {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 20px;
            margin-top: 20px;
          }

          .lawyer-card {
            background: #fff;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            padding: 20px;
            width: 300px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .profile-section {
            margin-bottom: 20px;
          }

          .profile-picture {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #ddd;
          }

          .no-profile-picture {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background-color: #ddd;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            font-size: 1rem;
          }

          .info-section {
            text-align: left;
            width: 100%;
          }

          .info-section h3 {
            margin-bottom: 10px;
            color: #007bff;
            font-size: 1.4rem;
          }

          .info-section p {
            margin: 5px 0;
            font-size: 1rem;
            color: #555;
          }

          .no-results {
            font-size: 1.2rem;
            color: #666;
          }
        `}</style>
      </div>
    </div>
  );
};

export default LawyerSearch;
