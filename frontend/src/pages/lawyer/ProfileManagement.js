import React, { useState } from "react";

const ProfileManagement = () => {
  const [profileData, setProfileData] = useState({
    name: "",
    contact: "",
    biography: "",
    expertise: [],
    fee: "",
    availability: "",
    credentials: null,
  });

  const [expertiseOptions] = useState([
    "Family Law",
    "Criminal Defense",
    "Corporate Law",
    "Intellectual Property",
    "Immigration Law",
  ]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setProfileData((prevData) => ({
      ...prevData,
      [name]: type === "file" ? files[0] : value,
    }));
  };

  const handleExpertiseChange = (e) => {
    const value = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setProfileData((prevData) => ({ ...prevData, expertise: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Submit the profileData to the backend
    console.log(profileData);
    alert("Profile updated successfully!");
  };

  return (
    <div style={styles.profilePage}>
      <div style={styles.profileContainer}>
        <h2 style={styles.profileTitle}>Profile Management</h2>
        <form onSubmit={handleSubmit}>
          {/* Personal Details */}
          <div style={styles.formGroup}>
            <label htmlFor="name" style={styles.formLabel}>
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={profileData.name}
              onChange={handleChange}
              required
              style={styles.formInput}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="contact" style={styles.formLabel}>
              Contact Information
            </label>
            <input
              type="text"
              id="contact"
              name="contact"
              value={profileData.contact}
              onChange={handleChange}
              required
              style={styles.formInput}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="biography" style={styles.formLabel}>
              Biography
            </label>
            <textarea
              id="biography"
              name="biography"
              value={profileData.biography}
              onChange={handleChange}
              required
              style={styles.formTextArea}
            />
          </div>

          {/* Expertise Selection */}
          <div style={styles.formGroup}>
            <label htmlFor="expertise" style={styles.formLabel}>
              Areas of Expertise
            </label>
            <select
              id="expertise"
              name="expertise"
              multiple
              value={profileData.expertise}
              onChange={handleExpertiseChange}
              style={styles.formSelect}
            >
              {expertiseOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Fee Management */}
          <div style={styles.formGroup}>
            <label htmlFor="fee" style={styles.formLabel}>
              Service Fee (in USD)
            </label>
            <input
              type="number"
              id="fee"
              name="fee"
              value={profileData.fee}
              onChange={handleChange}
              required
              style={styles.formInput}
            />
          </div>

          {/* Availability Settings */}
          <div style={styles.formGroup}>
            <label htmlFor="availability" style={styles.formLabel}>
              Availability (e.g., Mon-Fri, 9 AM - 5 PM)
            </label>
            <input
              type="text"
              id="availability"
              name="availability"
              value={profileData.availability}
              onChange={handleChange}
              required
              style={styles.formInput}
            />
          </div>

          {/* Credentials Upload */}
          <div style={styles.formGroup}>
            <label htmlFor="credentials" style={styles.formLabel}>
              Upload Legal Credentials
            </label>
            <input
              type="file"
              id="credentials"
              name="credentials"
              onChange={handleChange}
              style={styles.formInput}
            />
          </div>

          <button type="submit" style={styles.btnSubmit}>
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
};

// Styles
const styles = {
  profilePage: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    // backgroundImage: "url('/assets/profile-bg.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  profileContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    maxWidth: "600px",
    width: "100%",
  },
  profileTitle: {
    textAlign: "center",
    color: "#2d6da5",
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "2rem",
  },
  formGroup: {
    marginBottom: "1.5rem",
  },
  formLabel: {
    display: "block",
    fontSize: "1rem",
    fontWeight: "500",
    marginBottom: "0.5rem",
    color: "#333",
  },
  formInput: {
    width: "100%",
    padding: "0.9rem",
    border: "1px solid #c2b697",
    borderRadius: "6px",
    fontSize: "1rem",
    backgroundColor: "#f9f9f9",
    transition: "border-color 0.3s ease",
  },
  formTextArea: {
    width: "100%",
    padding: "0.9rem",
    border: "1px solid #c2b697",
    borderRadius: "6px",
    fontSize: "1rem",
    backgroundColor: "#f9f9f9",
    height: "100px",
    resize: "vertical",
  },
  formSelect: {
    width: "100%",
    padding: "0.9rem",
    border: "1px solid #c2b697",
    borderRadius: "6px",
    fontSize: "1rem",
    backgroundColor: "#f9f9f9",
  },
  btnSubmit: {
    display: "block",
    width: "100%",
    padding: "0.9rem",
    backgroundColor: "#2d6da5",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
};

export default ProfileManagement;
