import React, { useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";
import Footer from "../../components/footer/footer-lawyer";
import Navbar from "../../components/navbar/navbar-lawyer";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Add styled components
const AnimatedBackground = styled.div`
  min-height: 100vh;
  background: linear-gradient(
    -45deg,
    #1a2980,
    #26d0ce,
    #243B55,
    #141E30
  );
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
  position: relative;

  @keyframes gradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
  z-index: 1;
`;

const PageTitle = styled.h1`
  color: white;
  font-size: 3.5rem;
  text-align: center;
  margin-bottom: 2rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 2px;
  position: relative;
  text-shadow: 
    2px 2px 0 #000,
    -2px -2px 0 #000,
    2px -2px 0 #000,
    -2px 2px 0 #000,
    0 0 20px rgba(0,0,0,0.5);
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 150px;
    height: 4px;
    background: linear-gradient(90deg, transparent, #fff, transparent);
  }

  animation: titleGlow 2s ease-in-out infinite alternate;

  @keyframes titleGlow {
    from {
      text-shadow: 
        2px 2px 0 #000,
        -2px -2px 0 #000,
        2px -2px 0 #000,
        -2px 2px 0 #000,
        0 0 20px rgba(0,0,0,0.5);
    }
    to {
      text-shadow: 
        2px 2px 0 #000,
        -2px -2px 0 #000,
        2px -2px 0 #000,
        -2px 2px 0 #000,
        0 0 30px rgba(52, 152, 219, 0.8);
    }
  }
`;

const CasesList = styled.ul`
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
`;

const CaseCard = styled.li`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.45);
  }
`;

const CaseTitle = styled.h2`
  color: #34495e;
  font-size: 1.5rem;
  margin-bottom: 1rem;
`;

const StatusText = styled.p`
  color: #7f8c8d;
  font-size: 1.1rem;
  margin-bottom: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  margin-bottom: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: #3498db;
    outline: none;
  }
`;

const Button = styled.button`
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

  &:hover {
    background: linear-gradient(45deg, #2980b9, #3498db);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    background: linear-gradient(45deg, #bdc3c7, #95a5a6);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const UploadSection = styled.div`
  margin-top: 3rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
`;

const Form = styled.form`
  display: grid;
  gap: 1.5rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  margin-top: 0.5rem;

  &:focus {
    border-color: #3498db;
    outline: none;
  }
`;

const FileInput = styled.input`
  margin-top: 0.5rem;
`;

const LoadingText = styled.p`
  text-align: center;
  font-size: 1.2rem;
  color: #7f8c8d;
`;

const ErrorText = styled.p`
  text-align: center;
  color: #e74c3c;
  font-size: 1.2rem;
`;

// Toast configurations
const TOAST_IDS = {
  FETCH_SUCCESS: 'fetch-cases-success',
  FETCH_ERROR: 'fetch-cases-error',
  UPDATE_SUCCESS: 'update-status-success',
  UPDATE_ERROR: 'update-status-error',
  UPLOAD_SUCCESS: 'upload-document-success',
  UPLOAD_ERROR: 'upload-document-error',
};

// Add custom toast styles
const toastStyles = {
  success: {
    style: {
      background: 'linear-gradient(45deg, #2ecc71, #27ae60)',
      color: 'white',
      fontSize: '14px',
      fontWeight: 'bold',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }
  },
  error: {
    style: {
      background: 'linear-gradient(45deg, #e74c3c, #c0392b)',
      color: 'white',
      fontSize: '14px',
      fontWeight: 'bold',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }
  },
  warning: {
    style: {
      background: 'linear-gradient(45deg, #f1c40f, #f39c12)',
      color: 'white',
      fontSize: '14px',
      fontWeight: 'bold',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }
  }
};

// Update the component return statement
const LawyerCaseManagement = () => {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCases();
  }, []);

  // Fetch cases for the specific lawyer
  const fetchCases = async () => {
    const lawyerId = "yourLawyerId"; // Replace with the actual lawyer ID or fetch from authentication
    try {
      setLoading(true);
      const response = await axios.get(`/api/cases/lawyer/${lawyerId}`);
      setCases(response.data);
      setError(null); // Clear any previous errors
      toast.success('Cases loaded successfully!', {
        toastId: TOAST_IDS.FETCH_SUCCESS,
        position: "top-right",
        style: {
          background: 'linear-gradient(45deg, #ffffff, #f5f5f5)',
          color: '#333333',
          fontSize: '14px',
          fontWeight: 'bold',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }
      });
    } catch (error) {
      console.error("Error fetching cases:", error);
      setError("Failed to load cases. Please try again.");
      toast.error('Failed to load cases!', {
        toastId: TOAST_IDS.FETCH_ERROR,
        position: "top-right",
        style: {
          background: 'linear-gradient(45deg, #ffffff, #f5f5f5)',
          color: '#333333',
          fontSize: '14px',
          fontWeight: 'bold',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle case status update
  const handleUpdateStatus = async (caseId) => {
    if (!newStatus) {
      toast.warning('Please enter a status.', {
        toastId: 'status-warning',
        position: "top-right",
        style: {
          background: 'linear-gradient(45deg, #f1c40f, #f39c12)',
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }
      });
      return;
    }
    try {
      await axios.patch(`/api/cases/${caseId}/status`, { status: newStatus });
      toast.success('Case status updated successfully!', {
        toastId: TOAST_IDS.UPDATE_SUCCESS,
        position: "top-right",
        style: {
          background: 'linear-gradient(45deg, #ffffff, #f5f5f5)',
          color: '#333333',
          fontSize: '14px',
          fontWeight: 'bold',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }
      });
      setNewStatus(""); // Clear the input field
      fetchCases(); // Refresh cases
    } catch (error) {
      console.error("Error updating case status:", error);
      toast.error('Failed to update case status!', {
        toastId: TOAST_IDS.UPDATE_ERROR,
        position: "top-right",
        style: {
          background: 'linear-gradient(45deg, #ffffff, #f5f5f5)',
          color: '#333333',
          fontSize: '14px',
          fontWeight: 'bold',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }
      });
    }
  };

  // Handle file upload for a specific case
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedCaseId || !file) {
      toast.warning('Please select both a case and a document.', {
        toastId: 'upload-warning',
        position: "top-right",
        style: {
          background: 'linear-gradient(45deg, #f1c40f, #f39c12)',
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }
      });
      return;
    }

    const formData = new FormData();
    formData.append("document", file);

    try {
      await axios.post(`/api/cases/${selectedCaseId}/upload`, formData);
      toast.success('Document uploaded successfully!', {
        toastId: TOAST_IDS.UPLOAD_SUCCESS,
        position: "top-right",
        style: {
          background: 'linear-gradient(45deg, #ffffff, #f5f5f5)',
          color: '#333333',
          fontSize: '14px',
          fontWeight: 'bold',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }
      });
      setFile(null); // Clear the file input
      fetchCases(); // Refresh cases to show the new document
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error('Failed to upload document!', {
        toastId: TOAST_IDS.UPLOAD_ERROR,
        position: "top-right",
        style: {
          background: 'linear-gradient(45deg, #ffffff, #f5f5f5)',
          color: '#333333',
          fontSize: '14px',
          fontWeight: 'bold',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }
      });
    }
  };

  return (
    <AnimatedBackground>
      <Navbar />
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        limit={3}
        toastStyle={{
          background: 'linear-gradient(45deg, #ffffff, #f5f5f5)',
          color: '#333333',
          fontSize: '14px',
          fontWeight: 'bold',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      />
      <PageContainer>
        <PageTitle>My Cases</PageTitle>

        {loading ? (
          <LoadingText>Loading cases...</LoadingText>
        ) : error ? (
          <ErrorText>{error}</ErrorText>
        ) : (
          <CasesList>
            {cases.map((caseItem) => (
              <CaseCard key={caseItem._id}>
                <CaseTitle>{caseItem.title}</CaseTitle>
                <StatusText>Status: {caseItem.status}</StatusText>
                <Input
                  type="text"
                  placeholder="Update status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                />
                <Button onClick={() => handleUpdateStatus(caseItem._id)}>
                  Update Status
                </Button>
              </CaseCard>
            ))}
          </CasesList>
        )}

        <UploadSection>
          <CaseTitle>Upload Document</CaseTitle>
          <Form onSubmit={handleFileUpload}>
            <div>
              <label>Select Case:</label>
              <Select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
              >
                <option value="">Select a case</option>
                {cases.map((caseItem) => (
                  <option key={caseItem._id} value={caseItem._id}>
                    {caseItem.title}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label>Select Document:</label>
              <FileInput
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                disabled={!selectedCaseId}
              />
            </div>

            <Button type="submit" disabled={!file}>
              Upload Document
            </Button>
          </Form>
        </UploadSection>
      </PageContainer>
      <Footer />
    </AnimatedBackground>
  );
};

export default LawyerCaseManagement;
