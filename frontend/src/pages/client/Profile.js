import React, { useState } from "react";

const Profile = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    legalPreferences: "",
    notificationPreferences: {
      email: false,
      sms: false,
      app: false,
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      notificationPreferences: {
        ...prevData.notificationPreferences,
        [name]: checked,
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Profile updated:", formData);
  };

  return (
    <div style={styles.profileContainer}>
      <h2 style={styles.header}>Manage Profile</h2>
      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label}>First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Legal Preferences</label>
          <input
            type="text"
            name="legalPreferences"
            value={formData.legalPreferences}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Notification Preferences</label>
          <div style={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                name="email"
                checked={formData.notificationPreferences.email}
                onChange={handleNotificationChange}
              />
              Email
            </label>
            <label>
              <input
                type="checkbox"
                name="sms"
                checked={formData.notificationPreferences.sms}
                onChange={handleNotificationChange}
              />
              SMS
            </label>
            <label>
              <input
                type="checkbox"
                name="app"
                checked={formData.notificationPreferences.app}
                onChange={handleNotificationChange}
              />
              App Notifications
            </label>
          </div>
        </div>
        <button type="submit" style={styles.button}>
          Update Profile
        </button>
      </form>
    </div>
  );
};

// Styles
const styles = {
  profileContainer: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "2rem",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  header: {
    textAlign: "center",
    marginBottom: "1.5rem",
    color: "#2d6da5",
  },
  formGroup: {
    marginBottom: "1rem",
  },
  label: {
    display: "block",
    fontWeight: "bold",
    marginBottom: "0.5rem",
    color: "#333",
  },
  input: {
    width: "100%",
    padding: "0.8rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
  },
  checkboxGroup: {
    display: "flex",
    gap: "1rem",
  },
  button: {
    width: "100%",
    padding: "0.8rem",
    backgroundColor: "#2d6da5",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    cursor: "pointer",
  },
};

export default Profile;
