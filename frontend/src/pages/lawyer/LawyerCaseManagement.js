import React, { useEffect, useState } from "react";
import axios from "axios";

const LawyerCaseManagement = () => {
    const [cases, setCases] = useState([]);
    const [selectedCaseId, setSelectedCaseId] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [file, setFile] = useState(null);

    useEffect(() => {
        fetchCases();
    }, []);

    // Fetch cases for the specific lawyer
    const fetchCases = async () => {
        const lawyerId = "yourLawyerId"; // Replace with the actual lawyer ID or fetch from authentication
        try {
            const response = await axios.get(`/api/cases/lawyer/${lawyerId}`);
            setCases(response.data);
        } catch (error) {
            console.error("Error fetching cases:", error);
        }
    };

    // Handle case status update
    const handleUpdateStatus = async (caseId) => {
        try {
            await axios.patch(`/api/cases/${caseId}/status`, { status: newStatus });
            alert("Case status updated!");
            fetchCases(); // Refresh cases
        } catch (error) {
            console.error("Error updating case status:", error);
        }
    };

    // Handle file upload for a specific case
    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!selectedCaseId || !file) {
            alert("Please select a case and a document.");
            return;
        }

        const formData = new FormData();
        formData.append("document", file);

        try {
            await axios.post(`/api/cases/${selectedCaseId}/upload`, formData);
            alert("Document uploaded successfully!");
            fetchCases(); // Refresh cases to show the new document
        } catch (error) {
            console.error("Error uploading document:", error);
        }
    };

    return (
        <div>
            <h1>My Cases</h1>
            <ul>
                {cases.map((caseItem) => (
                    <li key={caseItem._id}>
                        <h2>{caseItem.title}</h2>
                        <p>Status: {caseItem.status}</p>
                        <input
                            type="text"
                            placeholder="Update status"
                            onChange={(e) => setNewStatus(e.target.value)}
                        />
                        <button onClick={() => handleUpdateStatus(caseItem._id)}>Update Status</button>
                    </li>
                ))}
            </ul>

            <h2>Upload Document</h2>
            <form onSubmit={handleFileUpload}>
                <select onChange={(e) => setSelectedCaseId(e.target.value)}>
                    <option>Select Case</option>
                    {cases.map((caseItem) => (
                        <option key={caseItem._id} value={caseItem._id}>
                            {caseItem.title}
                        </option>
                    ))}
                </select>
                <input type="file" onChange={(e) => setFile(e.target.files[0])} />
                <button type="submit">Upload Document</button>
            </form>
        </div>
    );
};

export default LawyerCaseManagement;
