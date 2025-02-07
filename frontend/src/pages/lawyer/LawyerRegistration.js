import React, { useState, useEffect } from "react";
import axios from "axios";
import Footer from "../../components/footer/footer-lawyer";
import Navbar from "../../components/navbar/navbar-lawyer";
import '@fontsource/poppins';
import '@fontsource/roboto';
import LawyerIconPanel from '../../components/LawyerIconPanel';
import Select from 'react-select';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationPicker from '../../components/LocationPicker';
import IconButton from '@mui/material/IconButton';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBLSAPqtZQ4KhCTNP9zkM2Dke9giqwhENc';

const SPECIALIZATIONS = [
  "Civil Law",
  "Criminal Law",
  "Corporate Law",
  "Family Law",
  "Real Estate Law",
  "Intellectual Property Law",
  "Tax Law",
  "Labor and Employment Law",
  "Constitutional Law",
  "Environmental Law",
  "Immigration Law",
  "Bankruptcy Law",
  "Consumer Protection Law",
  "Human Rights Law",
  "Medical Law",
  "Maritime Law",
  "International Law",
  "Administrative Law",
  "Banking and Finance Law",
  "Competition Law",
  "Cyber Law",
  "Education Law",
  "Elder Law",
  "Entertainment Law",
  "Insurance Law",
  "Juvenile Law",
  "Media Law",
  "Military Law",
  "Patent Law",
  "Personal Injury Law",
  "Securities Law",
  "Sports Law",
  "Technology Law",
  "Telecommunications Law",
  "Transportation Law",
  "Trust and Estate Law",
  "White Collar Crime",
  "Women and Child Rights",
  "Alternative Dispute Resolution",
  "Arbitration Law",
  "Commercial Law"
];

const COURTS = [
  { value: "Supreme Court", label: "Supreme Court" },
  { value: "High Court", label: "High Court" },
  { value: "District Court", label: "District Court" },
  { value: "Sessions Court", label: "Sessions Court" },
  { value: "Family Court", label: "Family Court" },
  { value: "Consumer Court", label: "Consumer Court" },
  { value: "Labour Court", label: "Labour Court" },
  { value: "Tax Court", label: "Tax Court" },
  { value: "Criminal Court", label: "Criminal Court" },
  { value: "Civil Court", label: "Civil Court" },
];

const LANGUAGES = [
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
  { value: "Malayalam", label: "Malayalam" },
  // Add more languages as needed
];

const LawyerRegistration = () => {
  const [lawyerData, setLawyerData] = useState({
    id: null,
    fullname: "",
    email: "",
    phone: "",
    AEN: "",
    specialization: "",
    location: {
      address: "",
      lat: null,
      lng: null
    },
    officeLocation: {
      address: "",
      lat: null,
      lng: null
    },
    availability: "Available",
    fees: "",
    profilePicture: null,
    lawDegreeCertificate: null,
    barCouncilCertificate: null,
    visibleToClients: false,
    verificationStatus: "Pending",
    additionalCertificates: [],
    languagesSpoken: [],
    caseHistory: "",
    bio: "",
    officeAddress: "",
    yearsOfExperience: "",
    lawFirm: "",
    appointmentFees: "",
    consultationFees: "",
    caseDetailsFees: "",
    videoCallFees: "",
    caseHandlingFees: "",
    practicingCourts: [],
  });

  const [newCertificate, setNewCertificate] = useState({
    file: null,
    description: "",
    name: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // Add new state for fee error dialog
  const [feeErrorOpen, setFeeErrorOpen] = useState(false);
  const [feeErrorMessage, setFeeErrorMessage] = useState("");

  // Add new state for map dialog
  const [mapDialogOpen, setMapDialogOpen] = useState(false);

  // Add a new state for office location
  const [showOfficeLocationPicker, setShowOfficeLocationPicker] = useState(false);

  useEffect(() => {
    const userEmail = sessionStorage.getItem("email");
    console.log("Logged in user's email:", userEmail);
  }, []);

  // Fetch lawyer data when component mounts
  useEffect(() => {
    const fetchLawyerData = async () => {
      try {
        setIsLoading(true);
        const userEmail = sessionStorage.getItem("email");
        if (!userEmail) return;

        const response = await axios.get(
          `http://localhost:5000/api/lawyers/user-details/${userEmail}`
        );

        console.log("Received data:", response.data);

        setLawyerData((prevData) => ({
          ...prevData,
          ...response.data,
          fullname: response.data.fullname || '', // Explicitly set fullname
          id: response.data._id,
          verificationStatus: response.data.isVerified ? "Approved" : "Pending",
          location: {
            address: response.data.location?.address || '',
            lat: response.data.location?.lat || null,
            lng: response.data.location?.lng || null
          },
          officeLocation: {
            address: response.data.officeLocation?.address || '',
            lat: response.data.officeLocation?.lat || null,
            lng: response.data.officeLocation?.lng || null
          }
        }));
      } catch (error) {
        console.error("Error fetching lawyer data:", error);
        setError("Failed to fetch user data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLawyerData();
  }, []);

  // Add this useEffect to handle auto-resize when data changes
  useEffect(() => {
    const homeAddressTextarea = document.querySelector('textarea[value="' + lawyerData.location.address + '"]');
    const officeAddressTextarea = document.querySelector('textarea[value="' + lawyerData.officeLocation.address + '"]');
    
    if (homeAddressTextarea) autoResizeTextArea(homeAddressTextarea);
    if (officeAddressTextarea) autoResizeTextArea(officeAddressTextarea);
  }, [lawyerData.location.address, lawyerData.officeLocation.address]);

  // Render error state
  if (error) {
    return <div>Error: {error}</div>;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // List of immutable fields
    const immutableFields = ['fullname', 'email', 'AEN'];
    
    // If the field is immutable and already has a value, don't allow changes
    if (immutableFields.includes(name) && lawyerData[name]) {
      return;
    }

    // Handle all fee fields
    if (name.endsWith('Fees')) {
      // Remove existing commas and non-numeric characters
      const numericValue = value.replace(/[^0-9]/g, "");
      
      // Remove leading zeros
      const valueWithoutLeadingZeros = numericValue.replace(/^0+/, '');
      
      // If empty after removing zeros, set to empty string
      if (!valueWithoutLeadingZeros) {
        setLawyerData(prevData => ({
          ...prevData,
          [name]: ''
        }));
        return;
      }
      
      // Validate maximum amount
      if (valueWithoutLeadingZeros.length > 9) {
        setFeeErrorMessage(`${name.replace('Fees', ' Fees')} cannot exceed ₹99,999,999`);
        setFeeErrorOpen(true);
        return;
      }
      
      // Format number with commas
      const formattedValue = valueWithoutLeadingZeros.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

      setLawyerData(prevData => ({
        ...prevData,
        [name]: formattedValue,
      }));
    } 
    // Handle phone number
    else if (name === 'phone') {
      const phoneNumber = value.replace(/[^0-9]/g, "").slice(0, 10);
      setLawyerData((prevData) => ({
        ...prevData,
        [name]: phoneNumber,
      }));
    }
    // Handle other fields
    else {
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
      ((name === "lawDegreeCertificate" && lawyerData.lawDegreeCertificate) ||
      (name === "barCouncilCertificate" && lawyerData.barCouncilCertificate))
    ) {
      alert("This certificate cannot be modified once uploaded.");
      e.target.value = ''; // Reset the file input
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

  const handleAlertClose = () => {
    setAlertOpen(false);
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

      // Show success alert
      setAlertMessage("Certificate added successfully!");
      setAlertOpen(true);
    } catch (error) {
      console.error("Error adding certificate:", error);
      // Show error alert
      setAlertMessage(error.response?.data?.message || "Failed to add certificate.");
      setAlertOpen(true);
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

      // Show success alert
      setAlertMessage("Certificate removed successfully!");
      setAlertOpen(true);
    } catch (error) {
      console.error("Error removing certificate:", error);
      // Show error alert
      setAlertMessage("Failed to remove certificate.");
      setAlertOpen(true);
    }
  };

  const handleLanguageChange = (selectedOptions) => {
    setLawyerData(prevData => ({
      ...prevData,
      languagesSpoken: selectedOptions ? selectedOptions.map(option => option.value) : []
    }));
  };

  const handleCourtsChange = (selectedOptions) => {
    setLawyerData(prevData => ({
      ...prevData,
      practicingCourts: selectedOptions ? selectedOptions.map(option => option.value) : []
    }));
  };

  const handleLocationChange = (newLocation) => {
    setLawyerData(prev => ({
      ...prev,
      location: newLocation,
      officeAddress: newLocation.address
    }));
  };

  const handleOfficeLocationChange = (newLocation) => {
    setLawyerData(prev => ({
      ...prev,
      officeLocation: {
        address: newLocation.address,
        lat: newLocation.lat,
        lng: newLocation.lng
      }
    }));
  };

  const handleOfficeLocationPickerOpen = () => {
    setShowOfficeLocationPicker(true);
  };

  const handleOfficeLocationPickerClose = () => {
    setShowOfficeLocationPicker(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setError("");

      // Validate required fields
      const requiredFields = [
        'fullname', 
        'phone', 
        'AEN', 
        'appointmentFees',
        'consultationFees',
        'caseDetailsFees',
        'videoCallFees',
        'caseHandlingFees'
      ];
      
      const missingFields = requiredFields.filter(field => !lawyerData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      // Validate practicing courts
      if (!lawyerData.practicingCourts || lawyerData.practicingCourts.length === 0) {
        throw new Error('Please select at least one practicing court');
      }

      const formData = new FormData();
      
      // Add existing form data
      formData.append('fullname', lawyerData.fullname);
      formData.append('email', sessionStorage.getItem("email"));
      formData.append('phone', lawyerData.phone);
      formData.append('AEN', lawyerData.AEN);
      formData.append('specialization', lawyerData.specialization || '');
      
      // Ensure location data is properly stringified
      if (lawyerData.location) {
        formData.append('location', JSON.stringify({
          address: lawyerData.location.address || '',
          lat: lawyerData.location.lat || null,
          lng: lawyerData.location.lng || null
        }));
      }

      // Append all fee fields (remove commas before sending)
      const feeFields = ['appointmentFees', 'consultationFees', 'caseDetailsFees', 'videoCallFees', 'caseHandlingFees'];
      feeFields.forEach(field => {
        const feeValue = lawyerData[field].replace(/,/g, '');
        formData.append(field, feeValue);
      });

      // Append languages spoken
      formData.append('languagesSpoken', JSON.stringify(lawyerData.languagesSpoken || []));

      // Append practicing courts
      formData.append('practicingCourts', JSON.stringify(lawyerData.practicingCourts || []));

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

      // Add availability and visibility
      formData.append('availability', lawyerData.availability || 'Available');
      formData.append('visibleToClients', lawyerData.visibleToClients || false);

      // Ensure office location data is properly stringified
      if (lawyerData.officeLocation) {
        formData.append('officeLocation', JSON.stringify({
          address: lawyerData.officeLocation.address || '',
          lat: lawyerData.officeLocation.lat || null,
          lng: lawyerData.officeLocation.lng || null
        }));
      }

      // Log the data being sent
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
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
        setAlertMessage(response.data.message);
        setAlertOpen(true);
        
        // Update the state with the returned data, preserving location information
        setLawyerData(prev => ({
          ...prev,
          ...response.data.lawyer,
          id: response.data.lawyer._id,
          location: {
            address: response.data.lawyer.location?.address || prev.location.address,
            lat: response.data.lawyer.location?.lat || prev.location.lat,
            lng: response.data.lawyer.location?.lng || prev.location.lng
          },
          officeLocation: {
            address: response.data.lawyer.officeLocation?.address || prev.officeLocation.address,
            lat: response.data.lawyer.officeLocation?.lat || prev.officeLocation.lat,
            lng: response.data.lawyer.officeLocation?.lng || prev.officeLocation.lng
          }
        }));
      } else {
        throw new Error(response.data.message || 'Failed to save lawyer profile');
      }

    } catch (error) {
      console.error("Error saving lawyer profile:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to save lawyer profile";
      setError(errorMessage);
      setAlertMessage(errorMessage);
      setAlertOpen(true);
    }
  };

  // Add this function to get the correct image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath instanceof File) return URL.createObjectURL(imagePath);
    return `http://localhost:5000/uploads/${imagePath}`;
  };

  // Add handleFeeErrorClose function
  const handleFeeErrorClose = () => {
    setFeeErrorOpen(false);
  };

  // Add handlers for map dialog
  const handleOpenMap = () => {
    setMapDialogOpen(true);
  };

  const handleCloseMap = () => {
    setMapDialogOpen(false);
  };

  // Add a new function to handle textarea auto-resize
  const autoResizeTextArea = (element) => {
    if (element) {
      element.style.height = 'auto';
      element.style.height = (element.scrollHeight) + 'px';
    }
  };

  return (
    <div style={styles.pageContainer}>
      <Navbar />
      <LawyerIconPanel />
      <div style={styles.profileContainer}>
        <h2 style={styles.heading}>Lawyer Profile</h2>

        {error && (
          <div style={styles.errorAlert}>
            <span style={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

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

        <form onSubmit={handleSave}>
          <div style={styles.gridContainer}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name*</label>
              <input
                type="text"
                name="fullname"
                value={lawyerData.fullname}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  backgroundColor: lawyerData.fullname ? '#f5f5f5' : '#fff',
                  cursor: lawyerData.fullname ? 'not-allowed' : 'text',
                }}
                disabled={!!lawyerData.fullname}
                required
              />
              {lawyerData.fullname && (
                <small style={styles.helperText}>This field cannot be modified once set</small>
              )}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email*</label>
              <input
                type="email"
                name="email"
                value={lawyerData.email}
                style={{
                  ...styles.input,
                  backgroundColor: '#f5f5f5',
                  cursor: 'not-allowed',
                }}
                disabled={true}
                required
              />
              <small style={styles.helperText}>Email cannot be modified</small>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Phone Number*</label>
              <input
                type="tel"
                name="phone"
                value={lawyerData.phone}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter 10-digit phone number"
                required
                pattern="[0-9]{10}"
                maxLength="10"
              />
              <small style={styles.helperText}>You can update your phone number anytime</small>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Advocate Enrollment Number*</label>
              <input
                type="text"
                name="AEN"
                value={lawyerData.AEN}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  backgroundColor: lawyerData.AEN ? '#f5f5f5' : '#fff',
                  cursor: lawyerData.AEN ? 'not-allowed' : 'text',
                }}
                disabled={!!lawyerData.AEN}
                required
              />
              {lawyerData.AEN && (
                <small style={styles.helperText}>This field cannot be modified once set</small>
              )}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Specialization</label>
              <select
                name="specialization"
                value={lawyerData.specialization}
                onChange={handleChange}
                style={styles.select}
                required
                readOnly={lawyerData.verificationStatus === "Approved"}
              >
                <option value="">Select Specialization</option>
                {SPECIALIZATIONS.map((specialization) => (
                  <option key={specialization} value={specialization}>
                    {specialization}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Home Address*</label>
              <div style={styles.locationInputGroup}>
                <textarea
                  value={lawyerData.location.address || ''}
                  style={{
                    ...styles.locationInput,
                    resize: 'none', // Remove manual resize
                    overflow: 'hidden', // Hide scrollbar
                    minHeight: '50px'
                  }}
                  placeholder="Click to select location"
                  readOnly
                  onClick={handleOpenMap}
                  ref={(element) => element && autoResizeTextArea(element)}
                  onInput={(e) => autoResizeTextArea(e.target)}
                />
                <button 
                  type="button"
                  onClick={handleOpenMap}
                  style={styles.mapButton}
                >
                  📍 Select
                </button>
              </div>
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
              <label style={styles.label}>Appointment Fees (₹)*</label>
              <input
                type="text"
                name="appointmentFees"
                value={lawyerData.appointmentFees}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter amount (min ₹100)"
                required
              />
              <small style={styles.helperText}>Enter amount without currency symbol</small>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Consultation Fees (₹)*</label>
              <input
                type="text"
                name="consultationFees"
                value={lawyerData.consultationFees}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter amount (min ₹100)"
                required
              />
              <small style={styles.helperText}>Enter amount without currency symbol</small>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Case Details Fees (₹)*</label>
              <input
                type="text"
                name="caseDetailsFees"
                value={lawyerData.caseDetailsFees}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter amount (min ₹100)"
                required
              />
              <small style={styles.helperText}>Enter amount without currency symbol</small>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Video Call Fees (₹)*</label>
              <input
                type="text"
                name="videoCallFees"
                value={lawyerData.videoCallFees}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter amount (min ₹100)"
                required
              />
              <small style={styles.helperText}>Enter amount without currency symbol</small>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Case Handling Fees (₹)*</label>
              <input
                type="text"
                name="caseHandlingFees"
                value={lawyerData.caseHandlingFees}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter amount (min ₹100)"
                required
              />
              <small style={styles.helperText}>Enter amount without currency symbol</small>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Languages Spoken*</label>
              <Select
                isMulti
                name="languagesSpoken"
                options={LANGUAGES}
                value={LANGUAGES.filter(lang => 
                  lawyerData.languagesSpoken?.includes(lang.value)
                )}
                onChange={handleLanguageChange}
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    boxShadow: 'none',
                    '&:hover': {
                      border: '1px solid #3949ab',
                    },
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: '#e8eaf6',
                    borderRadius: '4px',
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: '#3949ab',
                    fontWeight: 500,
                  }),
                  multiValueRemove: (base) => ({
                    ...base,
                    color: '#3949ab',
                    '&:hover': {
                      backgroundColor: '#c5cae9',
                      color: '#1a237e',
                    },
                  }),
                }}
                placeholder="Select languages..."
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Practicing Courts*</label>
              <Select
                isMulti
                name="practicingCourts"
                options={COURTS}
                value={COURTS.filter(court => 
                  lawyerData.practicingCourts?.includes(court.value)
                )}
                onChange={handleCourtsChange}
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    boxShadow: 'none',
                    '&:hover': {
                      border: '1px solid #3949ab',
                    },
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: '#e8eaf6',
                    borderRadius: '4px',
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: '#3949ab',
                    fontWeight: 500,
                  }),
                  multiValueRemove: (base) => ({
                    ...base,
                    color: '#3949ab',
                    '&:hover': {
                      backgroundColor: '#c5cae9',
                      color: '#1a237e',
                    },
                  }),
                }}
                placeholder="Select practicing courts..."
                required
              />
              <small style={styles.helperText}>Select all courts where you practice</small>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Case History / Success Rate</label>
              <textarea
                name="caseHistory"
                value={lawyerData.caseHistory}
                onChange={handleChange}
                style={styles.textarea}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Bio / About Section</label>
              <textarea
                name="bio"
                value={lawyerData.bio}
                onChange={handleChange}
                style={styles.textarea}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Office Address</label>
              <div style={styles.locationInputGroup}>
                <textarea
                  value={lawyerData.officeLocation.address || ''}
                  style={{
                    ...styles.locationInput,
                    resize: 'none', // Remove manual resize
                    overflow: 'hidden', // Hide scrollbar
                    minHeight: '50px'
                  }}
                  placeholder="Click to select location"
                  readOnly
                  onClick={handleOfficeLocationPickerOpen}
                  ref={(element) => element && autoResizeTextArea(element)}
                  onInput={(e) => autoResizeTextArea(e.target)}
                />
                <button 
                  type="button"
                  onClick={handleOfficeLocationPickerOpen}
                  style={styles.mapButton}
                >
                  📍 Select
                </button>
              </div>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Law Degree Certificate*</label>
              <input
                type="file"
                name="lawDegreeCertificate"
                onChange={handleFileChange}
                style={{
                  ...styles.input,
                  backgroundColor: lawyerData.lawDegreeCertificate ? '#f5f5f5' : '#fff',
                  cursor: lawyerData.lawDegreeCertificate ? 'not-allowed' : 'pointer',
                }}
                disabled={!!lawyerData.lawDegreeCertificate}
                required={!lawyerData.lawDegreeCertificate}
              />
              {lawyerData.lawDegreeCertificate && (
                <small style={styles.helperText}>Certificate already uploaded and cannot be modified</small>
              )}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Bar Council Certificate*</label>
              <input
                type="file"
                name="barCouncilCertificate"
                onChange={handleFileChange}
                style={{
                  ...styles.input,
                  backgroundColor: lawyerData.barCouncilCertificate ? '#f5f5f5' : '#fff',
                  cursor: lawyerData.barCouncilCertificate ? 'not-allowed' : 'pointer',
                }}
                disabled={!!lawyerData.barCouncilCertificate}
                required={!lawyerData.barCouncilCertificate}
              />
              {lawyerData.barCouncilCertificate && (
                <small style={styles.helperText}>Certificate already uploaded and cannot be modified</small>
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
                  <span>Loading...</span>
                ) : (
                  <span>{lawyerData.id ? "Update" : "Register"}</span>
                )}
              </div>
            </button>
          </div>
        </form>

        <Dialog
          open={alertOpen}
          onClose={handleAlertClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          PaperProps={{
            style: {
              borderRadius: '15px',
              padding: '30px',
              background: 'linear-gradient(135deg, #f6f9fc 0%, #eef5fe 100%)',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
              textAlign: 'center',
              maxWidth: '400px',
              margin: 'auto',
              animation: 'jumpIn 0.6s ease',
            },
          }}
        >
          <DialogTitle id="alert-dialog-title" style={{ color: '#1a237e', fontWeight: 'bold', fontSize: '1.5rem' }}>
            <div className="icon-animation">
              <CheckCircleIcon style={{ fontSize: '3rem', color: '#4caf50', marginBottom: '10px' }} />
            </div>
            <div className="title-animation">Success</div>
          </DialogTitle>
          <DialogContent>
            <DialogContentText 
              id="alert-dialog-description" 
              className="content-animation"
              style={{ color: '#333', fontSize: '1rem', marginBottom: '20px' }}
            >
              {alertMessage}
            </DialogContentText>
          </DialogContent>
          <DialogActions style={{ justifyContent: 'center' }}>
            <Button
              onClick={handleAlertClose}
              className="button-animation"
              style={{
                backgroundColor: '#3949ab',
                color: '#fff',
                borderRadius: '8px',
                padding: '10px 20px',
                fontWeight: 'bold',
                textTransform: 'none',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#303f9f';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3949ab';
              }}
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>

        {/* Fee Error Dialog */}
        <Dialog
          open={feeErrorOpen}
          onClose={handleFeeErrorClose}
          aria-labelledby="fee-error-dialog-title"
          PaperProps={{
            style: {
              borderRadius: '15px',
              padding: '20px',
              background: 'linear-gradient(135deg, #f6f9fc 0%, #eef5fe 100%)',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
              animation: 'jumpIn 0.6s ease',
            },
          }}
        >
          <DialogTitle 
            id="fee-error-dialog-title" 
            style={{ 
              color: '#d32f2f', 
              fontWeight: 'bold',
              textAlign: 'center'
            }}
          >
            <span style={{ marginRight: '10px' }}>⚠️</span>
            Fee Limit Exceeded
          </DialogTitle>
          <DialogContent>
            <DialogContentText style={{ color: '#333', textAlign: 'center' }}>
              {feeErrorMessage}
            </DialogContentText>
          </DialogContent>
          <DialogActions style={{ justifyContent: 'center' }}>
            <Button
              onClick={handleFeeErrorClose}
              style={{
                backgroundColor: '#d32f2f',
                color: '#fff',
                borderRadius: '8px',
                padding: '8px 20px',
                textTransform: 'none',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: '#b71c1c',
                },
              }}
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Map Dialog */}
        <Dialog
          open={mapDialogOpen}
          onClose={handleCloseMap}
          maxWidth="md"
          fullWidth
          PaperProps={{
            style: {
              borderRadius: '15px',
              padding: '20px',
              height: '80vh'
            }
          }}
        >
          <DialogTitle style={styles.mapDialogTitle}>
            Select Office Location
            <IconButton
              onClick={handleCloseMap}
              style={styles.closeButton}
              aria-label="close"
            >
              ✕
            </IconButton>
          </DialogTitle>
          <DialogContent style={styles.mapDialogContent}>
            <LocationPicker
              value={lawyerData.location}
              onChange={(newLocation) => {
                setLawyerData(prev => ({
                  ...prev,
                  location: newLocation
                }));
              }}
            />
          </DialogContent>
          <DialogActions style={styles.mapDialogActions}>
            <Button 
              onClick={handleCloseMap}
              variant="contained"
              style={styles.confirmLocationButton}
            >
              Confirm Location
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add new Dialog for office location picker */}
        <Dialog
          open={showOfficeLocationPicker}
          onClose={handleOfficeLocationPickerClose}
          maxWidth="md"
          fullWidth
          PaperProps={{
            style: {
              borderRadius: '15px',
              padding: '20px',
              height: '80vh'
            }
          }}
        >
          <DialogTitle style={styles.mapDialogTitle}>
            Select Office Location
            <IconButton
              onClick={handleOfficeLocationPickerClose}
              style={styles.closeButton}
            >
              ✕
            </IconButton>
          </DialogTitle>
          <DialogContent style={styles.mapDialogContent}>
            <LocationPicker
              value={lawyerData.officeLocation}
              onChange={handleOfficeLocationChange}
            />
          </DialogContent>
          <DialogActions style={styles.mapDialogActions}>
            <Button
              onClick={handleOfficeLocationPickerClose}
              variant="contained"
              style={styles.confirmLocationButton}
            >
              Confirm Location
            </Button>
          </DialogActions>
        </Dialog>
      </div>
      <div style={footerStyles}>
        <Footer />
      </div>

      <style jsx="true">{`
        @media (max-width: 768px) {
          .profileContainer {
            margin-left: 50px;
            padding: 15px;
            width: 95%;
            left: 25px;
          }
        }

        @keyframes jumpIn {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .icon-animation {
          animation: scaleIn 0.5s ease forwards;
        }

        .title-animation {
          animation: fadeIn 0.5s ease forwards;
          animation-delay: 0.3s;
          opacity: 0;
        }

        .content-animation {
          animation: fadeIn 0.5s ease forwards;
          animation-delay: 0.5s;
          opacity: 0;
        }

        .button-animation {
          animation: fadeIn 0.5s ease forwards;
          animation-delay: 0.7s;
          opacity: 0;
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
    alignItems: 'center',
    position: 'relative',
    paddingBottom: '150px'
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
    left: '30px',
    marginBottom: '50px'
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
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
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
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 1rem center',
    backgroundSize: '1em',
    '&:focus': {
      outline: 'none',
      borderColor: '#3949ab',
      boxShadow: '0 0 0 3px rgba(57, 73, 171, 0.1)',
    },
    '&:disabled': {
      backgroundColor: '#f5f5f5',
      cursor: 'not-allowed',
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
    padding: '15px 30px',
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#3949ab',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    border: '1px solid rgba(255, 255, 255, 0.18)'
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
  errorAlert: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.9rem',
    animation: 'slideIn 0.3s ease',
    border: '1px solid #ef9a9a',
  },
  errorIcon: {
    fontSize: '1.2rem',
  },
  '@keyframes slideIn': {
    from: {
      transform: 'translateY(-10px)',
      opacity: 0,
    },
    to: {
      transform: 'translateY(0)',
      opacity: 1,
    },
  },
  locationInputGroup: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    width: '100%'
  },
  locationInput: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '1rem',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    transition: 'all 0.3s ease',
    backgroundColor: '#fff',
    cursor: 'pointer',
    whiteSpace: 'pre-wrap', // Preserve line breaks and spaces
    minHeight: '50px',
    lineHeight: '1.5',
    '&:hover': {
      borderColor: '#3949ab',
    }
  },
  mapButton: {
    padding: '12px 20px',
    backgroundColor: '#3949ab',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    whiteSpace: 'nowrap',
    '&:hover': {
      backgroundColor: '#303f9f',
      transform: 'translateY(-2px)',
    }
  },
  mapDialogTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#1a237e',
    fontSize: '1.5rem',
    fontWeight: '600',
  },
  closeButton: {
    color: '#666',
    padding: '8px',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
    },
  },
  mapDialogContent: {
    padding: '20px 0',
    height: 'calc(100% - 130px)',
  },
  mapDialogActions: {
    padding: '16px 24px',
    borderTop: '1px solid #eee',
  },
  confirmLocationButton: {
    backgroundColor: '#4caf50',
    color: '#fff',
    padding: '10px 24px',
    '&:hover': {
      backgroundColor: '#43a047',
    },
  },
};

const footerStyles = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  width: '100%',
  zIndex: 10
};

export default LawyerRegistration;
