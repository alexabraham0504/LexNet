import React, { useState } from "react";

const LegalDocumentAnalysis = () => {
  const [documentText, setDocumentText] = useState("");
  const [summary, setSummary] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [insights, setInsights] = useState("");

  const handleAnalyze = async (e) => {
    e.preventDefault();

    // Simulate AI tools for document analysis (replace with real API calls)
    setSummary(`Summary of the document: ${documentText.slice(0, 100)}...`);
    setSentiment("Positive"); // Example sentiment analysis
    setInsights("Consider strengthening your arguments based on the client's needs.");
  };

  const handleExportResults = () => {
    const results = `
      Document Summary: ${summary}
      Sentiment Analysis: ${sentiment}
      Insights: ${insights}
    `;
    const blob = new Blob([results], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "document_analysis.txt";
    link.click();
  };

  return (
    <div style={styles.documentAnalysisPage}>
      <div style={styles.documentContainer}>
        <h2 style={styles.documentTitle}>Legal Document Analysis</h2>

        {/* Document Input Form */}
        <form onSubmit={handleAnalyze} style={styles.documentForm}>
          <div style={styles.formGroup}>
            <label htmlFor="documentText">Enter Document Text:</label>
            <textarea
              id="documentText"
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              required
              style={styles.documentTextarea}
            />
          </div>
          <button type="submit" style={styles.btnAnalyze}>
            Analyze Document
          </button>
        </form>

        {/* Analysis Results */}
        {summary && (
          <div style={styles.analysisResults}>
            <h3 style={styles.resultsTitle}>Analysis Results</h3>
            <p><strong>Document Summary:</strong> {summary}</p>
            <p><strong>Sentiment Analysis:</strong> {sentiment}</p>
            <p><strong>Insights:</strong> {insights}</p>
            <button onClick={handleExportResults} style={styles.btnExport}>
              Export Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Styles
const styles = {
  documentAnalysisPage: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    // backgroundImage: "url('/assets/document-analysis-bg.jpg')", // Update with your background image
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  documentContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    maxWidth: "600px",
    width: "100%",
  },
  documentTitle: {
    textAlign: "center",
    color: "#2d6da5",
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "2rem",
  },
  documentForm: {
    marginBottom: "2rem",
  },
  formGroup: {
    marginBottom: "1.5rem",
  },
  documentTextarea: {
    width: "100%",
    padding: "0.9rem",
    border: "1px solid #c2b697",
    borderRadius: "6px",
    fontSize: "1rem",
    backgroundColor: "#f9f9f9",
    height: "150px",
    resize: "vertical",
  },
  btnAnalyze: {
    display: "block",
    width: "100%",
    padding: "0.9rem",
    backgroundColor: "#2d6da5",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer",
  },
  analysisResults: {
    marginTop: "2rem",
    backgroundColor: "#f5f5f5",
    padding: "1rem",
    borderRadius: "8px",
  },
  resultsTitle: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginBottom: "1rem",
  },
  btnExport: {
    display: "block",
    width: "100%",
    padding: "0.9rem",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    cursor: "pointer",
  },
};

export default LegalDocumentAnalysis;
