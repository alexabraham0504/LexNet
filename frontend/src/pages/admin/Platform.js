import React, { useState, useEffect } from "react";
import Footer from "../../components/footer/footer-admin";
// import Header from "../../components/header/header-admin";
import Navbar from "../../components/navbar/navbar-admin";

const Platform = () => {
  const [ipcSections, setIpcSections] = useState([]);
  const [newSection, setNewSection] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCaseStudy, setNewCaseStudy] = useState(""); // Added for case study
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch IPC sections from the backend when the component loads
  useEffect(() => {
    fetchIpcSections();
  }, []);

  const fetchIpcSections = async () => {
    try {
      const response = await fetch(
        "https://lexnet-backend.onrender.com/api/ipc"
      ); // API endpoint to get IPC sections
      const data = await response.json();
      setIpcSections(data);
    } catch (error) {
      console.error("Error fetching IPC sections:", error);
    }
  };

  // Handle adding a new IPC section
  const handleAddSection = async () => {
    if (newSection.trim() !== "" && newDescription.trim() !== "") {
      try {
        const response = await fetch(
          "https://lexnet-backend.onrender.com/api/ipc",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              section: newSection.trim(),
              description: newDescription.trim(),
              caseStudy: newCaseStudy.trim(), // Include case study in the request
            }),
          }
        );

        if (response.ok) {
          setNewSection(""); // Clear input after adding
          setNewDescription("");
          setNewCaseStudy(""); // Clear case study input
          fetchIpcSections(); // Fetch updated IPC sections
        }
      } catch (error) {
        console.error("Error adding IPC section:", error);
      }
    }
  };

  // Handle removing an IPC section
  const handleRemoveSection = async (id) => {
    try {
      const response = await fetch(
        `https://lexnet-backend.onrender.com/api/ipc/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        fetchIpcSections(); // Fetch updated IPC sections after deletion
      }
    } catch (error) {
      console.error("Error removing IPC section:", error);
    }
  };

  // Filter IPC sections based on the search term
  const filteredSections = ipcSections.filter((section) =>
    section.section.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <h2 style={styles.title}>IPC Section Management</h2>

        {/* Search IPC Sections with button */}
        <div style={styles.searchContainer}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search IPC sections"
            style={styles.searchInput} // Updated search input style
          />
          <button style={styles.searchButton}>Search</button>
        </div>

        {/* Add New IPC Section with headings */}
        <div style={styles.sectionInputContainer}>
          <div style={styles.inputFieldContainer}>
            <label style={styles.headingLabel}>New IPC Section:</label>
            <input
              type="text"
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
              placeholder="Enter new IPC section"
              style={styles.input}
            />
          </div>

          <div style={styles.inputFieldContainer}>
            <label style={styles.headingLabel}>Section Description:</label>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Enter section description"
              style={styles.input}
            />
          </div>

          <div style={styles.inputFieldContainer}>
            <label style={styles.headingLabel}>Case Study (Optional):</label>
            <input
              type="text"
              value={newCaseStudy}
              onChange={(e) => setNewCaseStudy(e.target.value)}
              placeholder="Enter case study (optional)"
              style={styles.input}
            />
          </div>

          <button onClick={handleAddSection} style={styles.addButton}>
            Add
          </button>
        </div>

        {/* Display IPC Sections */}
        <div style={styles.sectionListContainer}>
          <h3>Added IPC Sections:</h3>
          <ul style={styles.sectionList}>
            {filteredSections.length > 0 ? (
              filteredSections.map((section) => (
                <li key={section._id} style={styles.sectionItem}>
                  <div>
                    <strong>{section.section}</strong>: {section.description}
                    {section.caseStudy && (
                      <p style={styles.caseStudy}>
                        Case Study: {section.caseStudy}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveSection(section._id)}
                    style={styles.removeButton}
                  >
                    Remove
                  </button>
                </li>
              ))
            ) : (
              <li>No sections found.</li>
            )}
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  );
};

// CSS-in-JS Styling optimized for landscape mode
const styles = {
  container: {
    maxWidth: "90%",
    padding: "20px",
    margin: "0 auto",
    border: "1px solid #ccc",
    borderRadius: "10px",
    backgroundColor: "#f9f9f9",
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
  },
  searchContainer: {
    display: "flex",
    justifyContent: "flex-end", // Aligns the search input and button to the right
    alignItems: "center",
    marginBottom: "20px",
  },
  searchInput: {
    width: "200px", // Smaller width for the search field
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    marginRight: "10px", // Space between input and button
  },
  searchButton: {
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  input: {
    width: "100%", // Full width for other input fields
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    marginBottom: "10px",
  },
  inputFieldContainer: {
    flex: "1",
    marginBottom: "20px",
  },
  label: {
    fontWeight: "bold",
    marginBottom: "5px",
    display: "block",
  },
  headingLabel: {
    fontWeight: "bold",
    fontSize: "1.25em", // Increase font size to match the Added IPC Sections heading
    marginBottom: "5px",
    display: "block",
  },
  sectionInputContainer: {
    display: "flex",
    flexDirection: "column", // Stack inputs vertically
    marginBottom: "20px",
    gap: "10px", // Adding some spacing between inputs
  },
  addButton: {
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    alignSelf: "flex-start",
  },
  sectionListContainer: {
    marginBottom: "20px",
  },
  sectionList: {
    listStyleType: "none",
    padding: "0",
  },
  sectionItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px",
    backgroundColor: "#e9e9e9",
    borderRadius: "5px",
    marginBottom: "10px",
  },
  caseStudy: {
    fontStyle: "italic",
    fontSize: "0.9em",
    marginTop: "5px",
  },
  removeButton: {
    padding: "5px 10px",
    backgroundColor: "#ff4d4d",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default Platform;
