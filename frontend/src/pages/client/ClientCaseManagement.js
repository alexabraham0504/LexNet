import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styled from "styled-components";
import Navbar from "../../components/navbar/navbar-client";
import Footer from "../../components/footer/footer-client";

const ClientCaseManagement = () => {
  const [cases, setCases] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [file, setFile] = useState(null);
  const [newCase, setNewCase] = useState({
    title: "",
    description: "",
    lawyerId: "",
  });

  const clientId = "YOUR_CLIENT_ID"; // You can get the client ID from context or authentication state.

  useEffect(() => {
    fetchLawyers();
  }, []);

  // Fetching verified lawyers from the backend
  const fetchLawyers = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/lawyers/verified"
      );
      console.log("All lawyers:", response.data); // Log complete response

      const activeVerifiedLawyers = response.data.filter(
        (lawyer) => lawyer.isVerified && lawyer.visibleToClients
      );

      console.log("Verified Lawyers:", activeVerifiedLawyers); // Log filtered lawyers
      setLawyers(activeVerifiedLawyers);
    } catch (error) {
      toast.error("Error fetching verified lawyers");
      console.error("Error fetching verified lawyers:", error);
    }
  };

  const handleCreateCaseAndUploadDocument = async (e) => {
    e.preventDefault();

    if (!newCase.title || !newCase.description || !newCase.lawyerId) {
      toast.error("Please fill out all fields for the case.");
      return;
    }

    try {
      // Prepare the form data
      const formData = new FormData();
      formData.append("title", newCase.title);
      formData.append("description", newCase.description);
      formData.append("lawyerId", newCase.lawyerId); // Send the selected lawyerId
      formData.append("clientId", clientId); // Send the client ID from authenticated session

      // If a file is selected, append it to the form data
      if (file) {
        formData.append("documents", file); // Match field name on backend
      }

      // Send the form data to the backend to create the case and upload the document
      const caseResponse = await axios.post(
        "http://localhost:3000/api/cases",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const createdCase = caseResponse.data;
      console.log("Created case:", createdCase);

      // Add the newly created case to the case list
      setCases([...cases, createdCase]);
      setNewCase({ title: "", description: "", lawyerId: "" }); // Reset form
      setFile(null); // Reset file input
      toast.success("Case created successfully!");
    } catch (error) {
      toast.error("Error creating case or uploading document.");
      console.error("Error creating case or uploading document:", error);
    }
  };

  return (
    <div>
      <Navbar />

      <Container>
        <ToastContainer position="top-right" autoClose={3000} />
        <Heading>My Cases</Heading>
        <CaseList>
          {cases.map((caseItem) => (
            <CaseItem key={caseItem._id}>
              <CaseTitle>
                {caseItem.title} - {caseItem.status}
              </CaseTitle>
              <LawyerName>
                Assigned Lawyer:{" "}
                {caseItem.lawyerId
                  ? caseItem.lawyerId.fullName
                  : "Not Assigned"}
              </LawyerName>
            </CaseItem>
          ))}
        </CaseList>

        <SubHeading>Create New Case</SubHeading>
        <Form onSubmit={handleCreateCaseAndUploadDocument}>
          <InputField
            type="text"
            placeholder="Title"
            value={newCase.title}
            onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
          />
          <TextareaField
            placeholder="Description"
            value={newCase.description}
            onChange={(e) =>
              setNewCase({ ...newCase, description: e.target.value })
            }
          />
          <Dropdown
            value={newCase.lawyerId}
            onChange={(e) =>
              setNewCase({ ...newCase, lawyerId: e.target.value })
            }
          >
            <option value="">Select Lawyer</option>
            {lawyers.length > 0 ? (
              lawyers.map((lawyer) => (
                <option key={lawyer._id} value={lawyer._id}>
                  {lawyer.fullname}
                </option>
              ))
            ) : (
              <option disabled>No verified lawyers available</option>
            )}
          </Dropdown>

          <FileInput type="file" onChange={(e) => setFile(e.target.files[0])} />
          <CreateButton type="submit">
            Create Case & Upload Document
          </CreateButton>
        </Form>
      </Container>
      <Footer />
    </div>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
`;

const Heading = styled.h1`
  color: #2c3e50;
  margin-bottom: 15px;
`;

const SubHeading = styled.h2`
  color: #2c3e50;
  margin-bottom: 15px;
`;

const CaseList = styled.ul`
  list-style: none;
  padding: 0;
  margin-bottom: 20px;
`;

const CaseItem = styled.li`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  padding: 10px;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  margin-bottom: 10px;
  border-radius: 5px;
`;

const CaseTitle = styled.span`
  font-weight: 500;
  color: #34495e;
`;

const LawyerName = styled.span`
  font-weight: 400;
  color: #34495e;
  margin-top: 5px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const InputField = styled.input`
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const TextareaField = styled.textarea`
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const Dropdown = styled.select`
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const FileInput = styled.input`
  margin-bottom: 10px;
`;

const CreateButton = styled.button`
  background-color: #3498db;
  color: #fff;
  padding: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #2980b9;
  }
`;

export default ClientCaseManagement;
