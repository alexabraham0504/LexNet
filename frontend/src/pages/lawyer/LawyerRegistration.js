import React, { useState, useEffect } from "react";
import axios from "axios";
import Footer from "../../components/footer/footer-lawyer";
import Navbar from "../../components/navbar/navbar-lawyer";
import '@fontsource/poppins';
import '@fontsource/roboto';
import LawyerIconPanel from '../../components/LawyerIconPanel';

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

        console.log("Lawyer data received:", response.data); // Debug log
        console.log("Profile picture path:", response.data.profilePicture); // Debug log

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
    try {
      setIsLoading(true);
      setError("");

      // Validate required fields
      const requiredFields = ['fullname', 'phone', 'AEN', 'fees'];
      const missingFields = requiredFields.filter(field => !lawyerData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      // Get email from session storage
      const userEmail = sessionStorage.getItem("email");
      if (!userEmail) {
        throw new Error("User email not found. Please login again.");
      }

      // Validate required certificates for new registration
      if (!lawyerData.id && (!lawyerData.lawDegreeCertificate || !lawyerData.barCouncilCertificate)) {
        throw new Error("Law Degree Certificate and Bar Council Certificate are required for registration");
      }

      const formData = new FormData();

      // Append basic fields
      formData.append('fullname', lawyerData.fullname);
      formData.append('email', userEmail);
      formData.append('phone', lawyerData.phone);
      formData.append('AEN', lawyerData.AEN);
      formData.append('specialization', lawyerData.specialization || '');
      formData.append('location', lawyerData.location || '');
      formData.append('fees', lawyerData.fees);
      formData.append('availability', lawyerData.availability);
      formData.append('visibleToClients', lawyerData.visibleToClients);

      // Append files if they exist and are new
      if (lawyerData.profilePicture instanceof File) {
        formData.append('profilePicture', lawyerData.profilePicture);
      }
      if (lawyerData.lawDegreeCertificate instanceof File) {
        formData.append('lawDegreeCertificate', lawyerData.lawDegreeCertificate);
      }
      if (lawyerData.barCouncilCertificate instanceof File) {
        formData.append('barCouncilCertificate', lawyerData.barCouncilCertificate);
      }

      const response = await axios.post(
        'http://localhost:5000/api/lawyers/register',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        alert(response.data.message);
        setLawyerData(prev => ({
          ...prev,
          ...response.data.lawyer,
          id: response.data.lawyer._id
        }));
      } else {
        throw new Error(response.data.message);
      }

    } catch (error) {
      console.error('Error saving lawyer profile:', error);
      setError(error.response?.data?.message || error.message || 'Failed to save lawyer profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to get the correct image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath instanceof File) return URL.createObjectURL(imagePath);
    return `http://localhost:5000/uploads/${imagePath}`;
  };

  return (
    <div style={styles.pageContainer}>
      <Navbar />
      <LawyerIconPanel />
      <div style={styles.profileContainer}>
        <h2 style={styles.heading}>Lawyer Profile</h2>

        {error && <div style={styles.errorMessage}>{error}</div>}

        <div style={styles.verificationStatus}>
          Verification Status: {lawyerData.verificationStatus}
        </div>

        <div style={styles.profileImageWrapper}>
          <div style={styles.profileImageContainer}>
            {lawyerData.profilePicture ? (
              <img
                src={getImageUrl(lawyerData.profilePicture)}
                alt="Profile"
                style={styles.profileImage}
                onError={(e) => {
                  console.error("Error loading image:", e);
                  e.target.src = "path/to/fallback/image.jpg"; // Optional: Add a fallback image
                }}
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

      <style jsx="true">{`
        @media (max-width: 768px) {
          .profileContainer {
            margin-left: 50px;
            padding: 15px;
            width: 95%;
            left: 25px;
          }
        }
      `}</style>
    </div>
  );
};

const styles = {
  pageContainer: {
    background: 'linear-gradient(135deg, #f6f9fc 0%, #eef5fe 100%)',
    minHeight: '100vh',
    fontFamily: 'Poppins, sans-serif',
    padding: '20px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  profileContainer: {
    maxWidth: '1100px',
    margin: '20px auto',
    padding: '40px',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
    backdropFilter: 'blur(10px)',
    width: '90%',
    position: 'relative',
    left: '30px'
  },
  heading: {
    textAlign: 'center',
    color: '#1a237e',
    fontSize: '2.5rem',
    fontWeight: '600',
    marginBottom: '40px',
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: '-10px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100px',
      height: '4px',
      background: 'linear-gradient(90deg, #1a237e, #3949ab)',
      borderRadius: '2px',
    },
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '30px',
    marginBottom: '40px',
  },
  formGroup: {
    marginBottom: '25px',
    position: 'relative',
  },
  label: {
    display: 'block',
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#333',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '1rem',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    transition: 'all 0.3s ease',
    backgroundColor: '#fff',
    '&:focus': {
      outline: 'none',
      borderColor: '#3949ab',
      boxShadow: '0 0 0 3px rgba(57, 73, 171, 0.1)',
    },
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '1rem',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    transition: 'all 0.3s ease',
    backgroundColor: '#fff',
    cursor: 'pointer',
    '&:focus': {
      outline: 'none',
      borderColor: '#3949ab',
      boxShadow: '0 0 0 3px rgba(57, 73, 171, 0.1)',
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
    background: '#f8f9fa',
    padding: '30px',
    borderRadius: '15px',
    marginBottom: '30px',
  },
  certificateTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: '20px',
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
    background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)',
    color: '#fff',
    padding: '15px 40px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1.1rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 20px rgba(57, 73, 171, 0.3)',
    },
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
    background: '#fff',
    padding: '30px',
    borderRadius: '15px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
    marginTop: '40px',
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
    background: '#f8f9fa',
    borderRadius: '10px',
    marginBottom: '15px',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateX(5px)',
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
    },
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
  errorMessage: {
    background: '#ffebee',
    color: '#c62828',
    padding: '15px 20px',
    borderRadius: '10px',
    marginBottom: '30px',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  verificationBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: '500',
    marginBottom: '30px',
    background: (props) => 
      props === 'Approved' 
        ? 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)'
        : 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
    color: '#fff',
  },
};

export default LawyerRegistration;
