import React, { useState } from "react";

const IPC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm) return;

    setLoading(true);
    try {
      // Mock API request for IPC sections
      const response = await mockApiRequest(searchTerm);
      setResults(response);
    } catch (error) {
      console.error("Error fetching IPC sections:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const mockApiRequest = (term) => {
    // Mock data to simulate IPC section search results
    const mockData = [
      {
        section: "Section 302",
        description: "Punishment for murder.",
        caseStudy: "State v. Ram Singh (2007)",
      },
      {
        section: "Section 376",
        description: "Punishment for rape.",
        caseStudy: "State v. Nirmal Singh (2010)",
      },
      // Add more mock data as needed
    ];

    return new Promise((resolve) => {
      setTimeout(() => {
        const filteredResults = mockData.filter(
          (item) =>
            item.section.includes(term) || item.description.includes(term)
        );
        resolve(filteredResults);
      }, 1000);
    });
  };

  return (
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
        <button onClick={handleSearch} style={styles.button} disabled={loading}>
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
  searchContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  },
  input: {
    flex: 1,
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginRight: "10px",
  },
  button: {
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
