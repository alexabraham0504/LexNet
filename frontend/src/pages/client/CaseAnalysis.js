import React, { useState } from "react";

const CaseAnalysis = () => {
  const [file, setFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState("");
  const [loading, setLoading] = useState(false);
  
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Mock API request for document analysis
      const response = await mockApiRequest(formData);
      setAnalysisResult(response);
    } catch (error) {
      console.error("Error uploading file:", error);
      setAnalysisResult("Error analyzing the document.");
    } finally {
      setLoading(false);
    }
  };

  const mockApiRequest = (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("Analysis complete: This document contains important legal terms and conditions.");
      }, 2000);
    });
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Case Analysis</h2>
      <div style={styles.uploadContainer}>
        <input
          type="file"
          accept=".pdf, .doc, .docx"
          onChange={handleFileChange}
          style={styles.fileInput}
        />
        <button onClick={handleUpload} style={styles.button} disabled={loading}>
          {loading ? "Analyzing..." : "Upload Document"}
        </button>
      </div>
      {analysisResult && (
        <div style={styles.resultContainer}>
          <h3 style={styles.resultHeader}>Analysis Result</h3>
          <p style={styles.resultText}>{analysisResult}</p>
        </div>
      )}
    </div>
  );
};

// Styles
const styles = {
  container: {
    padding: "20px",
    maxWidth: "600px",
    margin: "0 auto",
    border: "1px solid #ccc",
    borderRadius: "6px",
    backgroundColor: "#f9f9f9",
  },
  header: {
    textAlign: "center",
    fontSize: "24px",
    marginBottom: "20px",
    color: "#2d6da5",
  },
  uploadContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  fileInput: {
    marginBottom: "15px",
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#2d6da5",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  resultContainer: {
    marginTop: "20px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: "10px",
    backgroundColor: "#fff",
  },
  resultHeader: {
    fontSize: "20px",
    color: "#2d6da5",
  },
  resultText: {
    color: "#333",
  },
};

export default CaseAnalysis;
