import React, { useState, useEffect } from "react";
import axios from "axios";
import Footer from "../../components/footer/footer-lawyer";
import Navbar from "../../components/navbar/navbar-lawyer";

const LawyerRegistration = () => {
  const [lawyerData, setLawyerData] = useState({
    id: null,
    fullname: "",
    email: "",
    phone: "",
    AEN: "",
    specialization: "",
    location: "",
    availability: "Available",
    fees: "",
    profilePicture: null,
    lawDegreeCertificate: null,
    barCouncilCertificate: null,
    visibleToClients: false,
    verificationStatus: "Pending",
  });

  const [isLoading, setIsLoading] = useState(false);

  // Fetch lawyer data when component mounts
  useEffect(() => {
    const fetchLawyerData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/lawyers/me"
        );
        setLawyerData((prevData) => ({
          ...prevData,
          ...response.data,
          verificationStatus: response.data.isVerified ? "Approved" : "Pending",
        }));
      } catch (error) {
        console.error("Error fetching lawyer data:", error);
      }
    };
    fetchLawyerData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLawyerData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const { name } = e.target;
    setLawyerData((prevData) => ({
      ...prevData,
      [name]: file,
    }));
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("fullname", lawyerData.fullname);
    formData.append("email", lawyerData.email);
    formData.append("phone", lawyerData.phone);
    formData.append("AEN", lawyerData.AEN);
    formData.append("specialization", lawyerData.specialization);
    formData.append("location", lawyerData.location);
    formData.append("availability", lawyerData.availability);
    formData.append("fees", lawyerData.fees);

    if (lawyerData.profilePicture) {
      formData.append("profilePicture", lawyerData.profilePicture);
    }
    if (lawyerData.lawDegreeCertificate) {
      formData.append("lawDegreeCertificate", lawyerData.lawDegreeCertificate);
    }
    if (lawyerData.barCouncilCertificate) {
      formData.append(
        "barCouncilCertificate",
        lawyerData.barCouncilCertificate
      );
    }
    formData.append("visibleToClients", lawyerData.visibleToClients);

    setIsLoading(true);

    try {
      if (!lawyerData.id) {
        await axios.post(
          "http://localhost:3000/api/lawyers/register",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        alert(
          "Lawyer profile created successfully! Your profile is under review."
        );
      } else {
        await axios.put(
          "http://localhost:3000/api/lawyers/register",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        alert("Lawyer profile updated successfully!");
      }
    } catch (error) {
      console.error("Error saving lawyer profile:", error);
      alert("Failed to save lawyer profile.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Navbar />
      <div style={styles.profileContainer}>
        <h2 style={styles.heading}>Lawyer Registration</h2>

        <div style={styles.verificationStatus}>
          Verification Status: {lawyerData.verificationStatus}
        </div>

        <div style={styles.profileImageWrapper}>
          <div style={styles.profileImageContainer}>
            {lawyerData.profilePicture ? (
              <img
                src={
                  typeof lawyerData.profilePicture === "string"
                    ? lawyerData.profilePicture
                    : URL.createObjectURL(lawyerData.profilePicture)
                }
                alt="Profile"
                style={styles.profileImage}
              />
            ) : (
              <div style={styles.placeholderImage}>No Image</div>
            )}
          </div>
          <div style={styles.formGroup}>
            <label style={styles.profilePictureLabel}>
              Choose Profile Picture
            </label>
            <input
              type="file"
              name="profilePicture"
              onChange={handleFileChange}
              style={styles.input}
            />
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div style={styles.gridContainer}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                name="fullname"
                value={lawyerData.fullname}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                value={lawyerData.email}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Phone</label>
              <input
                type="tel"
                name="phone"
                value={lawyerData.phone}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Advocate Enrollment Number</label>
              <input
                type="text"
                name="AEN"
                value={lawyerData.AEN}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Specialization</label>
              <input
                type="text"
                name="specialization"
                value={lawyerData.specialization}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Location</label>
              <input
                type="text"
                name="location"
                value={lawyerData.location}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Availability</label>
              <select
                name="availability"
                value={lawyerData.availability}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="Available">Available</option>
                <option value="Not Available">Not Available</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Fees</label>
              <input
                type="number"
                name="fees"
                value={lawyerData.fees}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Upload Law Degree Certificate</label>
              <input
                type="file"
                name="lawDegreeCertificate"
                onChange={handleFileChange}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Upload Bar Council Certificate</label>
              <input
                type="file"
                name="barCouncilCertificate"
                onChange={handleFileChange}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label>
              <input
                type="checkbox"
                name="visibleToClients"
                checked={lawyerData.visibleToClients}
                onChange={handleChange}
              />
              Make profile visible to prospective clients
            </label>
          </div>

          <div style={styles.saveButtonContainer}>
            <button type="submit" style={styles.saveButton}>
              {lawyerData.id ? "Save Changes" : "Register"}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
};

const styles = {
  profileContainer: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "20px",
  },
  heading: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "24px",
    color: "#007bff",
  },
  verificationStatus: {
    textAlign: "center",
    fontSize: "18px",
    marginBottom: "20px",
    color: "green",
  },
  profileImageWrapper: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  },
  profileImageContainer: {
    marginRight: "20px",
    border: "2px solid #ddd",
    padding: "10px",
  },
  profileImage: {
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  placeholderImage: {
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    backgroundColor: "#ddd",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "16px",
    color: "#555",
  },
  formGroup: {
    marginBottom: "15px",
  },
  profilePictureLabel: {
    fontSize: "14px",
    fontWeight: "bold",
  },
  label: {
    fontSize: "14px",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: "10px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "4px",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "20px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
  },
  saveButtonContainer: {
    display: "flex",
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: "#007bff",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "16px",
  },
};

export default LawyerRegistration;
