import React, { useState, useEffect } from "react";
import Footer from "../../components/footer/footer-admin";
// import Header from "../../components/header/header-admin";
import Navbar from "../../components/navbar/navbar-client";
const IPC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all IPC sections from the backend when the component loads
  useEffect(() => {
    fetchIpcSections();
  }, []);

  const fetchIpcSections = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/ipc"); // API endpoint to get IPC sections
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error fetching IPC sections:", error);
    }
  };

  const handleSearch = () => {
    if (!searchTerm) return;

    const filteredResults = results.filter(
      (item) =>
        item.section.includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setResults(filteredResults);
  };

  return (
    <div>
      <Navbar />

      <div style={styles.container}>
        <h2 style={styles.header}>IPC Lookup</h2>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Enter IPC section or keyword"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.input}
          />
          <button
            onClick={handleSearch}
            style={styles.button}
            disabled={loading}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
        {results.length > 0 && (
          <div style={styles.resultsContainer}>
            <h3 style={styles.resultsHeader}>Search Results</h3>
            {results.map((result, index) => (
              <div key={index} style={styles.resultCard}>
                <h4 style={styles.section}>{result.section}</h4>
                <p style={styles.description}>{result.description}</p>
                <p style={styles.caseStudy}>Case Study: {result.caseStudy}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

// Styles
const styles = {
  container: {
    padding: "20px",
    maxWidth: "900px", // Increased width for landscape view
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
  searchContainer: {
    display: "flex", // Align input and button side by side (landscape)
    justifyContent: "space-between", // Adds space between input and button
    marginBottom: "20px",
    alignItems: "center", // Vertically centers the elements
  },
  input: {
    flex: 4, // Takes up more space for the input field
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginRight: "10px", // Space between input and button
  },
  button: {
    flex: 1, // Takes up less space for the button
    padding: "10px 20px",
    backgroundColor: "#2d6da5",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  resultsContainer: {
    marginTop: "20px",
  },
  resultsHeader: {
    fontSize: "20px",
    color: "#2d6da5",
    marginBottom: "10px",
  },
  resultCard: {
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: "10px",
    marginBottom: "10px",
    backgroundColor: "#fff",
  },
  section: {
    fontSize: "18px",
    fontWeight: "bold",
  },
  description: {
    color: "#333",
  },
  caseStudy: {
    fontStyle: "italic",
    color: "#666",
  },
};

export default IPC;
