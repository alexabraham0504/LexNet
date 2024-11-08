import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
      const response = await fetch("http://localhost:5000/api/ipc"); // API endpoint to get IPC sections
      const data = await response.json();
      setIpcSections(data);
      toast.success("📚 IPC Sections loaded successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } catch (error) {
      console.error("Error fetching IPC sections:", error);
      toast.error("❌ Failed to load IPC sections. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Handle adding a new IPC section
  const handleAddSection = async () => {
    if (newSection.trim() === "" || newDescription.trim() === "") {
      toast.warning("⚠️ Please fill in all required fields!", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/ipc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: newSection.trim(),
          description: newDescription.trim(),
          caseStudy: newCaseStudy.trim(),
        }),
      });

      if (response.ok) {
        toast.success("✅ New IPC section added successfully!", {
          position: "top-right",
          autoClose: 3000,
          icon: "🎉",
        });
        setNewSection("");
        setNewDescription("");
        setNewCaseStudy("");
        fetchIpcSections();
      } else {
        toast.error("❌ Failed to add new section", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error adding IPC section:", error);
      toast.error("🚫 Something went wrong while adding the section", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Handle removing an IPC section
  const handleRemoveSection = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/ipc/${id}`, {
        method: "DELETE",
      });

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
    <div style={styles.pageWrapper}>
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} />
      <div style={styles.container}>
        <h2 style={styles.title}>IPC Section Management</h2>

        {/* Search Container */}
        <div style={styles.searchContainer}>
          <div style={styles.searchWrapper}>
            <i className="fas fa-search" style={styles.searchIcon}></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search IPC sections..."
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* Add New Section Card */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Add New Section</h3>
          <div style={styles.sectionInputContainer}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>IPC Section</label>
              <input
                type="text"
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                placeholder="Enter section number"
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Enter detailed description"
                style={styles.textarea}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Case Study</label>
              <textarea
                value={newCaseStudy}
                onChange={(e) => setNewCaseStudy(e.target.value)}
                placeholder="Enter relevant case study"
                style={styles.textarea}
              />
            </div>

            <button onClick={handleAddSection} style={styles.addButton}>
              <i className="fas fa-plus" style={styles.buttonIcon}></i>
              Add Section
            </button>
          </div>
        </div>

        {/* Sections List Card */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>IPC Sections</h3>
          <div style={styles.sectionListContainer}>
            {filteredSections.length > 0 ? (
              filteredSections.map((section) => (
                <div key={section._id} style={styles.sectionItem}>
                  <div style={styles.sectionContent}>
                    <h4 style={styles.sectionTitle}>{section.section}</h4>
                    <p style={styles.sectionDescription}>
                      {section.description}
                    </p>
                    {section.caseStudy && (
                      <div style={styles.caseStudyBox}>
                        <h5 style={styles.caseStudyTitle}>Case Study</h5>
                        <p style={styles.caseStudyText}>{section.caseStudy}</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveSection(section._id)}
                    style={styles.removeButton}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              ))
            ) : (
              <div style={styles.noResults}>No sections found</div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
  },
  container: {
    maxWidth: "1200px",
    margin: "2rem auto",
    padding: "0 20px",
  },
  title: {
    fontSize: "2.5rem",
    color: "#1a237e",
    textAlign: "center",
    marginBottom: "2rem",
    fontWeight: "600",
    textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    padding: "2rem",
    marginBottom: "2rem",
  },
  cardTitle: {
    fontSize: "1.5rem",
    color: "#333",
    marginBottom: "1.5rem",
    borderBottom: "2px solid #e0e0e0",
    paddingBottom: "0.5rem",
  },
  searchContainer: {
    marginBottom: "2rem",
  },
  searchWrapper: {
    position: "relative",
    maxWidth: "400px",
    margin: "0 auto",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#666",
  },
  searchInput: {
    width: "100%",
    padding: "12px 40px",
    fontSize: "1rem",
    border: "2px solid #e0e0e0",
    borderRadius: "25px",
    transition: "all 0.3s ease",
    "&:focus": {
      borderColor: "#1a237e",
      boxShadow: "0 0 0 2px rgba(26,35,126,0.2)",
    },
  },
  inputGroup: {
    marginBottom: "1.5rem",
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    color: "#333",
    fontWeight: "500",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "1rem",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    transition: "all 0.3s ease",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "1rem",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    minHeight: "100px",
    resize: "vertical",
    transition: "all 0.3s ease",
  },
  addButton: {
    backgroundColor: "#1a237e",
    color: "white",
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    fontSize: "1rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    "&:hover": {
      backgroundColor: "#283593",
      transform: "translateY(-2px)",
    },
  },
  buttonIcon: {
    marginRight: "8px",
  },
  sectionItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    padding: "1.5rem",
    marginBottom: "1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    },
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: "1.25rem",
    color: "#1a237e",
    marginBottom: "0.5rem",
  },
  sectionDescription: {
    color: "#555",
    marginBottom: "1rem",
    lineHeight: "1.5",
  },
  caseStudyBox: {
    backgroundColor: "#e8eaf6",
    padding: "1rem",
    borderRadius: "6px",
    marginTop: "1rem",
  },
  caseStudyTitle: {
    color: "#1a237e",
    fontSize: "1rem",
    marginBottom: "0.5rem",
  },
  caseStudyText: {
    color: "#555",
    fontSize: "0.9rem",
    lineHeight: "1.4",
  },
  removeButton: {
    backgroundColor: "#ff1744",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "8px 12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    "&:hover": {
      backgroundColor: "#d50000",
      transform: "scale(1.05)",
    },
  },
  noResults: {
    textAlign: "center",
    padding: "2rem",
    color: "#666",
    fontSize: "1.1rem",
  },
};

export default Platform;
