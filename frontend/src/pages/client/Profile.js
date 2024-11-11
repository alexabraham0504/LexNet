import React, { useEffect, useState } from "react";
import axios from "axios";
import Footer from "../../components/footer/footer-admin";
// import Header from "../../components/header/header-admin";
import Navbar from "../../components/navbar/navbar-client";

const Profile = () => {
  const [profileData, setProfileData] = useState({
    id: null, // Add an ID field to check if profile exists
    fullname: "",
    email: "",
    location: "",
    legalNeeds: "",
    profilePicture: null, // Initial value is null
  });
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // State to manage loading

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/profile");
        const data = response.data || {
          id: null, // If no profile exists, id will remain null
          fullname: "",
          email: "",
          location: "",
          legalNeeds: "",
          profilePicture: null,
        };

        setProfileData(data);

        if (data.id) {
          setEditMode(false); // Profile exists, set to view mode
        } else {
          setEditMode(true); // No profile exists, set to edit mode to create a new one
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false); // Set loading to false after fetching
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setProfileData((prevData) => ({
      ...prevData,
      profilePicture: file,
    }));
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("fullname", profileData.fullname);
    formData.append("email", profileData.email);
    formData.append("location", profileData.location);
    formData.append("legalNeeds", profileData.legalNeeds);
    if (profileData.profilePicture) {
      formData.append("profilePicture", profileData.profilePicture);
    }

    try {
      if (!profileData.id) {
        const response = await axios.post(
          "http://localhost:5000/api/profile",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        alert("Profile created successfully!");
        setProfileData((prevData) => ({
          ...prevData,
          id: response.data.profile._id,
        }));
      } else {
        await axios.put("http://localhost:5000/api/profile", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        alert("Profile updated successfully!");
      }
      setEditMode(false); // Exit edit mode after saving
    } catch (error) {
      console.error("Error saving profile:", error);
      alert(`Failed to ${!profileData.id ? "create" : "update"} profile.`);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>; // Show loading while fetching profile
  }

  return (
    <div>
      <Navbar />

      <div style={styles.profileContainer}>
        <h2 style={styles.heading}>
          {!profileData.id ? "Create Profile" : "Edit Profile"}
        </h2>
        <div style={styles.profileContent}>
          <div style={styles.leftColumn}>
            <div style={styles.profileImageContainer}>
              {profileData.profilePicture ? (
                typeof profileData.profilePicture === "string" ? (
                  <img
                    src={profileData.profilePicture}
                    alt="Profile"
                    style={styles.profileImage}
                  />
                ) : (
                  <img
                    src={URL.createObjectURL(profileData.profilePicture)}
                    alt="Profile"
                    style={styles.profileImage}
                  />
                )
              ) : (
                <div style={styles.placeholderImage}>No Image</div>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Choose File</label>
              <input
                type="file"
                onChange={handleFileChange}
                disabled={!editMode}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.rightColumn}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                name="fullname"
                value={profileData.fullname}
                onChange={handleChange}
                disabled={!editMode}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleChange}
                disabled={!editMode}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Location</label>
              <input
                type="text"
                name="location"
                value={profileData.location}
                onChange={handleChange}
                disabled={!editMode}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Legal Needs</label>
              <textarea
                name="legalNeeds"
                value={profileData.legalNeeds}
                onChange={handleChange}
                disabled={!editMode}
                style={styles.textarea}
              ></textarea>
            </div>

            {editMode ? (
              <button onClick={handleSave} style={styles.saveButton}>
                {profileData.id ? "Save Changes" : "Create Profile"}
              </button>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                style={styles.editButton}
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

// CSS-in-JS Styling...

const styles = {
  profileContainer: {
    width: "800px",
    margin: "0 auto",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "10px",
    backgroundColor: "#f9f9f9",
  },
  heading: {
    textAlign: "center",
    marginBottom: "20px",
  },
  profileContent: {
    display: "flex",
    flexDirection: "row", // Landscape mode
    justifyContent: "space-between",
  },
  leftColumn: {
    width: "40%", // Adjust width for left column
  },
  rightColumn: {
    width: "55%", // Adjust width for right column
  },
  formGroup: {
    marginBottom: "15px",
  },
  label: {
    display: "block",
    marginBottom: "5px",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
  textarea: {
    width: "100%",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    minHeight: "100px",
  },
  saveButton: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  editButton: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  profileImageContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "15px",
  },
  profileImage: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
  },
  placeholderImage: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    backgroundColor: "#ccc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    color: "#fff",
  },
};

export default Profile;
