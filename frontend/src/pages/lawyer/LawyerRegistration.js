import React, { useState, useEffect } from "react";
import axios from "axios";
import Footer from "../../components/footer/footer-lawyer";
import Navbar from "../../components/navbar/navbar-lawyer";
import '@fontsource/poppins';
import '@fontsource/roboto';

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
    additionalCertificates: [],
  });

  const [newCertificate, setNewCertificate] = useState({
    file: null,
    description: "",
    name: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const userEmail = sessionStorage.getItem("email");
    console.log("Logged in user's email:", userEmail);
  }, []);

  // Fetch lawyer data when component mounts
  useEffect(() => {
    const fetchLawyerData = async () => {
      try {
        const userEmail = sessionStorage.getItem("email");
        if (!userEmail) return;

        const response = await axios.get(
          `http://localhost:5000/api/lawyers/user-details/${userEmail}`
        );

        setLawyerData((prevData) => ({
          ...prevData,
          ...response.data,
          id: response.data._id,
          verificationStatus: response.data.isVerified ? "Approved" : "Pending",
        }));
      } catch (error) {
        console.error("Error fetching lawyer data:", error);
        setError("Failed to fetch user data");
      }
    };

    fetchLawyerData();
  }, []);

  // Render loading state
  if (isLoading) {
    return <div>Loading user data...</div>;
  }

  // Render error state
  if (error) {
    return <div>Error: {error}</div>;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "fees") {
      // Remove any non-numeric characters and leading zeros
      const numericValue = value.replace(/[^0-9]/g, "").replace(/^0+/, "");
      setLawyerData((prevData) => ({
        ...prevData,
        [name]: numericValue,
      }));
    } else {
      setLawyerData((prevData) => ({
        ...prevData,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const { name } = e.target;

    // Prevent changing certificates if they already exist
    if (
      (name === "lawDegreeCertificate" && lawyerData.lawDegreeCertificate) ||
      (name === "barCouncilCertificate" && lawyerData.barCouncilCertificate)
    ) {
      return;
    }

    setLawyerData((prevData) => ({
      ...prevData,
      [name]: file,
    }));
  };

  const handleAdditionalCertificateChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("Selected file:", file);
      setNewCertificate((prev) => ({
        ...prev,
        file: file,
        name: file.name,
      }));
    }
  };

  const handleDescriptionChange = (e) => {
    setNewCertificate((prev) => ({
      ...prev,
      description: e.target.value,
    }));
  };

  const handleAddCertificate = async () => {
    if (!lawyerData.id) {
      alert(
        "Please save your profile first before adding additional certificates."
      );
      return;
    }

    if (!newCertificate.file) {
      alert("Please select a certificate file");
      return;
    }

    const formData = new FormData();
    formData.append("certificate", newCertificate.file);
    formData.append("description", newCertificate.description || "");
    formData.append("name", newCertificate.file.name);

    try {
      console.log("Sending certificate data:", {
        lawyerId: lawyerData.id,
        file: newCertificate.file,
        description: newCertificate.description,
        name: newCertificate.file.name,
      });

      const response = await axios.post(
        `http://localhost:5000/api/lawyers/add-certificate/${lawyerData.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Certificate upload response:", response.data);

      // Update the local state with the new certificates array
      setLawyerData((prev) => ({
        ...prev,
        additionalCertificates: response.data.additionalCertificates,
      }));

      // Reset the form
      setNewCertificate({
        file: null,
        description: "",
        name: "",
      });

      // Reset the file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = "";
      }

      // Refresh the lawyer data
      const refreshResponse = await axios.get(
        `http://localhost:5000/api/lawyers/user-details/${lawyerData.email}`
      );

      setLawyerData((prev) => ({
        ...prev,
        ...refreshResponse.data,
      }));

      alert("Certificate added successfully!");
    } catch (error) {
      console.error("Error adding certificate:", error);
      alert(error.response?.data?.message || "Failed to add certificate.");
    }
  };

  const handleRemoveCertificate = async (certificateId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/lawyers/remove-certificate/${lawyerData.id}/${certificateId}`
      );

      setLawyerData((prev) => ({
        ...prev,
        additionalCertificates: prev.additionalCertificates.filter(
          (cert) => cert._id !== certificateId
        ),
      }));

      alert("Certificate removed successfully!");
    } catch (error) {
      console.error("Error removing certificate:", error);
      alert("Failed to remove certificate.");
    }
  };

  const handleSave = async () => {
    const formData = new FormData();

    // Append all form fields
    Object.keys(lawyerData).forEach((key) => {
      if (
        key !== "id" &&
        key !== "verificationStatus" &&
        lawyerData[key] !== null
      ) {
        if (key === "additionalCertificates") {
          // Skip additionalCertificates as they're handled separately
          return;
        }

        if (
          key === "profilePicture" ||
          key === "lawDegreeCertificate" ||
          key === "barCouncilCertificate"
        ) {
          // Only append files if they're newly selected
          if (lawyerData[key] instanceof File) {
            formData.append(key, lawyerData[key]);
          }
        } else {
          formData.append(key, lawyerData[key]);
        }
      }
    });

    // Handle additional certificates
    if (newCertificate.file) {
      formData.append("additionalCertificates", newCertificate.file);
      formData.append(
        "certificateDescriptions",
        JSON.stringify([newCertificate.description])
      );
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/lawyers/register",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const message = response.data.lawyer.isVerified
        ? "Profile updated successfully!"
        : "Profile submitted for verification!";

      alert(message);

      // Update the local state with the response data
      setLawyerData((prevData) => ({
        ...prevData,
        ...response.data.lawyer,
        verificationStatus: response.data.lawyer.isVerified
          ? "Approved"
          : "Pending",
      }));

      // Reset new certificate form
      setNewCertificate({
        file: null,
        description: "",
        name: "",
      });
    } catch (error) {
      console.error("Error saving lawyer profile:", error);
      alert("Failed to save lawyer profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
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
                id="fullname"
                name="fullname"
                value={lawyerData.fullname}
                onChange={handleChange}
                style={styles.input}
                required
                readOnly={lawyerData.verificationStatus === "Approved"}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={lawyerData.email}
                onChange={handleChange}
                style={styles.input}
                required
                readOnly={lawyerData.verificationStatus === "Approved"}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={lawyerData.phone}
                onChange={handleChange}
                style={styles.input}
                required
                readOnly={lawyerData.verificationStatus === "Approved"}
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
                readOnly={lawyerData.verificationStatus === "Approved"}
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
                readOnly={lawyerData.verificationStatus === "Approved"}
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
                readOnly={lawyerData.verificationStatus === "Approved"}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Availability</label>
              <select
                name="availability"
                value={lawyerData.availability}
                onChange={handleChange}
                style={styles.input}
                readOnly={lawyerData.verificationStatus === "Approved"}
              >
                <option value="Available">Available</option>
                <option value="Not Available">Not Available</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Fees (₹)</label>
              <input
                type="text"
                name="fees"
                value={
                  lawyerData.fees ? lawyerData.fees.replace(/[^0-9]/g, "") : ""
                }
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter amount in Rupees"
                required
                pattern="[0-9]*"
                readOnly={lawyerData.verificationStatus === "Approved"}
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Law Degree Certificate</label>
              {lawyerData.lawDegreeCertificate ? (
                <div style={styles.certificateDisplay}>
                  <span style={styles.certificateText}>
                    Certificate uploaded ✓
                  </span>
                  <a
                    href={`http://localhost:5000/uploads/${lawyerData.lawDegreeCertificate}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.viewLink}
                  >
                    View Certificate
                  </a>
                </div>
              ) : (
                <input
                  type="file"
                  name="lawDegreeCertificate"
                  onChange={handleFileChange}
                  style={styles.input}
                  required
                />
              )}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Bar Council Certificate</label>
              {lawyerData.barCouncilCertificate ? (
                <div style={styles.certificateDisplay}>
                  <span style={styles.certificateText}>
                    Certificate uploaded ✓
                  </span>
                  <a
                    href={`http://localhost:5000/uploads/${lawyerData.barCouncilCertificate}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.viewLink}
                  >
                    View Certificate
                  </a>
                </div>
              ) : (
                <input
                  type="file"
                  name="barCouncilCertificate"
                  onChange={handleFileChange}
                  style={styles.input}
                  required
                />
              )}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label>
              <input
                type="checkbox"
                name="visibleToClients"
                checked={lawyerData.visibleToClients}
                onChange={handleChange}
                readOnly={lawyerData.verificationStatus === "Approved"}
              />
              Make profile visible to prospective clients
            </label>
          </div>

          {/* Additional Certificates Section */}
          <div style={styles.additionalCertificatesSection}>
            <h3 style={styles.subHeading}>Additional Certificates</h3>

            {/* Display existing additional certificates */}
            <div style={styles.certificatesList}>
              {lawyerData.additionalCertificates.map((cert, index) => (
                <div key={cert._id || index} style={styles.certificateItem}>
                  <div style={styles.certificateInfo}>
                    <span style={styles.certificateName}>
                      {cert.name || "Certificate"}
                    </span>
                    <span style={styles.certificateDate}>
                      {new Date(cert.uploadDate).toLocaleDateString()}
                    </span>
                    <p style={styles.certificateDescription}>
                      {cert.description}
                    </p>
                  </div>
                  <div style={styles.certificateActions}>
                    <a
                      href={`http://localhost:5000/uploads/${cert.file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.viewLink}
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleRemoveCertificate(cert._id)}
                      style={styles.removeButton}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new certificate form */}
            <div style={styles.addCertificateForm}>
              <h4 style={styles.formSubHeading}>Add New Certificate</h4>
              {!lawyerData.id ? (
                <div style={styles.warningMessage}>
                  Please save your profile first to add additional certificates.
                </div>
              ) : (
                <>
                  <div style={styles.formGroup}>
                    <input
                      type="file"
                      onChange={handleAdditionalCertificateChange}
                      style={styles.input}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <textarea
                      placeholder="Certificate Description"
                      value={newCertificate.description}
                      onChange={handleDescriptionChange}
                      style={styles.textarea}
                    />
                  </div>
                  <button
                    onClick={handleAddCertificate}
                    style={styles.addButton}
                    disabled={!newCertificate.file}
                  >
                    Add Certificate
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={styles.saveButtonContainer}>
            <button
              type="submit"
              style={{
                ...styles.saveButton,
                ...(lawyerData.id
                  ? styles.updateButton
                  : styles.registerButton),
              }}
              disabled={isLoading}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 40px 0 rgba(31, 38, 135, 0.37)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 8px 32px 0 rgba(31, 38, 135, 0.37)";
              }}
            >
              <div style={styles.buttonContent}>
                {isLoading ? (
                  <span style={{ opacity: 0.8 }}>Processing...</span>
                ) : (
                  <span>{lawyerData.id ? "Update" : "Register"}</span>
                )}
              </div>
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
};

const styles = {
  pageContainer: {
    background: 'linear-gradient(135deg, #f6f9fc, #e9ecef)',
    minHeight: '100vh',
    fontFamily: 'Poppins, sans-serif',
  },
  profileContainer: {
    maxWidth: '900px',
    margin: '40px auto',
    padding: '40px',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.8))',
    backdropFilter: 'blur(10px)',
    '-webkit-backdrop-filter': 'blur(10px)',
    borderRadius: '30px',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  },
  heading: {
    textAlign: 'center',
    fontSize: '32px',
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: '30px',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  verificationStatus: {
    textAlign: 'center',
    fontSize: '18px',
    marginBottom: '30px',
    padding: '10px 20px',
    borderRadius: '50px',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))',
    border: '1px solid rgba(0, 128, 0, 0.2)',
    color: '#2e7d32',
    fontWeight: '500',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '30px',
    marginBottom: '40px',
  },
  formGroup: {
    marginBottom: '25px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    fontSize: '15px',
    border: '2px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    '&:focus': {
      borderColor: '#2196F3',
      boxShadow: '0 0 0 3px rgba(33, 150, 243, 0.1)',
      outline: 'none',
    },
  },
  profileImageWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '40px',
    marginBottom: '40px',
    padding: '20px',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6))',
    borderRadius: '15px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
  },
  profileImageContainer: {
    position: 'relative',
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '3px solid #fff',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
    color: '#1976d2',
    fontSize: '16px',
    fontWeight: '500',
  },
  certificateSection: {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6))',
    padding: '25px',
    borderRadius: '15px',
    marginBottom: '30px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
  },
  certificateTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: '15px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  certificateDisplay: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '8px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
  },
  certificateText: {
    color: '#2e7d32',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  viewLink: {
    color: '#1976d2',
    textDecoration: 'none',
    padding: '8px 15px',
    borderRadius: '6px',
    border: '1px solid #1976d2',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#1976d2',
      color: '#fff',
    },
  },
  saveButtonContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '30px',
    marginBottom: '40px',
    padding: '20px',
    position: 'relative',
    zIndex: 1,
  },
  saveButton: {
    padding: '15px 40px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.4s ease',
    position: 'relative',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    '-webkit-backdrop-filter': 'blur(10px)',
  },
  registerButton: {
    background:
      'linear-gradient(135deg, rgba(76, 175, 80, 0.4), rgba(56, 142, 60, 0.7))',
    backdropFilter: 'blur(10px)',
    '-webkit-backdrop-filter': 'blur(10px)',
    border: '2px solid rgba(76, 175, 80, 0.3)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  },
  updateButton: {
    background:
      'linear-gradient(135deg, rgba(255, 152, 0, 0.4), rgba(245, 124, 0, 0.7))',
    backdropFilter: 'blur(10px)',
    '-webkit-backdrop-filter': 'blur(10px)',
    border: '2px solid rgba(255, 152, 0, 0.3)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  },
  buttonContent: {
    position: 'relative',
    zIndex: 1,
  },
  additionalCertificatesSection: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  subHeading: {
    fontSize: '20px',
    color: '#2196f3',
    marginBottom: '20px',
  },
  certificatesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '30px',
  },
  certificateItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  certificateInfo: {
    flex: 1,
  },
  certificateName: {
    fontWeight: '600',
    color: '#333',
    marginRight: '15px',
  },
  certificateDate: {
    color: '#666',
    fontSize: '14px',
  },
  certificateDescription: {
    margin: '5px 0 0',
    color: '#666',
    fontSize: '14px',
  },
  certificateActions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  addCertificateForm: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '6px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  formSubHeading: {
    fontSize: '16px',
    color: '#333',
    marginBottom: '15px',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    minHeight: '100px',
    resize: 'vertical',
  },
  addButton: {
    backgroundColor: '#28a745',
    color: '#ffffff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    '&:hover': {
      backgroundColor: '#218838',
    },
    '&:disabled': {
      backgroundColor: '#6c757d',
      cursor: 'not-allowed',
    },
  },
  removeButton: {
    backgroundColor: '#dc3545',
    color: '#ffffff',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    '&:hover': {
      backgroundColor: '#c82333',
    },
  },
  warningMessage: {
    padding: '10px 15px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeeba',
    borderRadius: '4px',
    color: '#856404',
    marginBottom: '15px',
  },
  profilePictureLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
  },
};

export default LawyerRegistration;
