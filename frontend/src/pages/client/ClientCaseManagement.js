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
    const [selectedCaseId, setSelectedCaseId] = useState("");
    const [newCase, setNewCase] = useState({ title: "", description: "", lawyerId: "" });

    useEffect(() => {
        fetchCases();
        fetchLawyers(); // Fetch available lawyers
    }, []);

    const fetchCases = async () => {
        try {
            const clientId = "yourClientId"; // Replace with actual client ID
            const response = await axios.get(`/api/cases/client/${clientId}`);
            setCases(response.data);
        } catch (error) {
            toast.error("Error fetching cases");
            console.error("Error fetching cases:", error);
        }
    };

    const fetchLawyers = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/lawyers/verified");
            console.log("All lawyers:", response.data); // Log the complete response
            const activeVerifiedLawyers = response.data.filter(
                (lawyer) => lawyer.isVerified && lawyer.visibleToClients
            );
            console.log("Verified Lawyers:", activeVerifiedLawyers); // Log the filtered lawyers
            setLawyers(activeVerifiedLawyers);
        } catch (error) {
            console.error("Error fetching verified lawyers:", error);
        }
    };

    const handleCreateCase = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("/api/cases", {
                ...newCase,
                clientId: "yourClientId", // Replace with actual client ID
            });
            setCases([...cases, response.data]);
            setNewCase({ title: "", description: "", lawyerId: "" }); // Reset form
            toast.success("Case created successfully!");
        } catch (error) {
            toast.error("Error creating case");
            console.error("Error creating case:", error);
        }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append("document", file);

            await axios.post(`/api/cases/${selectedCaseId}/upload`, formData);
            toast.success("Document uploaded!");
            setFile(null); // Reset file input after upload
        } catch (error) {
            toast.error("Error uploading document");
            console.error("Error uploading document:", error);
        }
    };

    const handleDeleteCase = async (caseId) => {
        try {
            await axios.delete(`/api/cases/${caseId}`);
            setCases(cases.filter((caseItem) => caseItem._id !== caseId));
            toast.success("Case deleted!");
        } catch (error) {
            toast.error("Error deleting case");
            console.error("Error deleting case:", error);
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
                        <CaseTitle>{caseItem.title} - {caseItem.status}</CaseTitle>
                        <LawyerName>Assigned Lawyer: {caseItem.lawyerId ? caseItem.lawyerId.fullName : "Not Assigned"}</LawyerName>
                        <DeleteButton onClick={() => handleDeleteCase(caseItem._id)}>Delete</DeleteButton>
                    </CaseItem>
                ))}
            </CaseList>

            <SubHeading>Create New Case</SubHeading>
            <Form onSubmit={handleCreateCase}>
                <InputField
                    type="text"
                    placeholder="Title"
                    value={newCase.title}
                    onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                />
                <TextareaField
                    placeholder="Description"
                    value={newCase.description}
                    onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                />
                <Dropdown
                    value={newCase.lawyerId}
                    onChange={(e) => setNewCase({ ...newCase, lawyerId: e.target.value })}
                >
                    <option value="">Select Lawyer</option>
                    {lawyers.map((lawyer) => (
                        <option key={lawyer._id} value={lawyer._id}>
                            {lawyer.fullName} {/* Ensure fullName is correct */}
                        </option>
                    ))}
                </Dropdown>
                <CreateButton type="submit">Create Case</CreateButton>
            </Form>

            <SubHeading>Upload Document</SubHeading>
            <Form onSubmit={handleFileUpload}>
                <Dropdown onChange={(e) => setSelectedCaseId(e.target.value)} value={selectedCaseId}>
                    <option value="">Select Case</option>
                    {cases.map((caseItem) => (
                        <option key={caseItem._id} value={caseItem._id}>
                            {caseItem.title}
                        </option>
                    ))}
                </Dropdown>
                <FileInput type="file" onChange={(e) => setFile(e.target.files[0])} />
                <CreateButton type="submit">Upload</CreateButton>
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
    flex-direction: column; /* Changed to column to accommodate lawyer name */
    justify-content: space-between;
    align-items: flex-start; /* Align items to start */
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
    margin-top: 5px; /* Add some space between title and lawyer name */
`;

const DeleteButton = styled.button`
    background-color: #e74c3c;
    color: #fff;
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;

    &:hover {
        background-color: #c0392b;
    }
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
