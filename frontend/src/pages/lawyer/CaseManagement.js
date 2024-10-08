import React, { useState } from "react";

const CaseManagement = () => {
  const [caseDetails, setCaseDetails] = useState({
    caseName: "",
    clientName: "",
    status: "Open",
    caseHistory: "",
    notes: "",
    documents: null,
  });

  const [cases, setCases] = useState([]);
  const [viewingCase, setViewingCase] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setCaseDetails((prevData) => ({
      ...prevData,
      [name]: type === "file" ? files[0] : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newCase = { ...caseDetails, id: Date.now(), status: "Open" };
    setCases((prevCases) => [...prevCases, newCase]);
    setCaseDetails({
      caseName: "",
      clientName: "",
      status: "Open",
      caseHistory: "",
      notes: "",
      documents: null,
    });
    alert("Case added successfully!");
  };

  const handleViewCase = (id) => {
    const selectedCase = cases.find((c) => c.id === id);
    setViewingCase(selectedCase);
  };

  const handleCloseCase = (id) => {
    setCases((prevCases) =>
      prevCases.map((c) => (c.id === id ? { ...c, status: "Closed" } : c))
    );
    alert("Case closed successfully!");
  };

  return (
    <div style={styles.caseManagementPage}>
      <div style={styles.caseContainer}>
        <h2 style={styles.caseTitle}>Case Management</h2>

        {/* Case Form */}
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="caseName" style={styles.formLabel}>
              Case Name
            </label>
            <input
              type="text"
              id="caseName"
              name="caseName"
              value={caseDetails.caseName}
              onChange={handleChange}
              required
              style={styles.formInput}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="clientName" style={styles.formLabel}>
              Client Name
            </label>
            <input
              type="text"
              id="clientName"
              name="clientName"
              value={caseDetails.clientName}
              onChange={handleChange}
              required
              style={styles.formInput}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="caseHistory" style={styles.formLabel}>
              Case History
            </label>
            <textarea
              id="caseHistory"
              name="caseHistory"
              value={caseDetails.caseHistory}
              onChange={handleChange}
              required
              style={styles.formTextArea}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="notes" style={styles.formLabel}>
              Add Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={caseDetails.notes}
              onChange={handleChange}
              style={styles.formTextArea}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="documents" style={styles.formLabel}>
              Attach Documents
            </label>
            <input
              type="file"
              id="documents"
              name="documents"
              onChange={handleChange}
              style={styles.formInput}
            />
          </div>

          <button type="submit" style={styles.btnSubmit}>
            Add Case
          </button>
        </form>

        {/* Case List */}
        <div style={styles.caseList}>
          <h3 style={styles.caseListTitle}>Cases</h3>
          {cases.length === 0 ? (
            <p>No cases available</p>
          ) : (
            <ul style={styles.caseItems}>
              {cases.map((caseItem) => (
                <li key={caseItem.id} style={styles.caseItem}>
                  <div>
                    <strong>{caseItem.caseName}</strong> -{" "}
                    <span>Status: {caseItem.status}</span>
                  </div>
                  <div style={styles.caseActions}>
                    <button
                      style={styles.btnView}
                      onClick={() => handleViewCase(caseItem.id)}
                    >
                      View Details
                    </button>
                    {caseItem.status !== "Closed" && (
                      <button
                        style={styles.btnClose}
                        onClick={() => handleCloseCase(caseItem.id)}
                      >
                        Close Case
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Case Details Modal */}
        {viewingCase && (
          <div style={styles.caseDetails}>
            <h3 style={styles.caseDetailsTitle}>Case Details</h3>
            <p><strong>Case Name:</strong> {viewingCase.caseName}</p>
            <p><strong>Client Name:</strong> {viewingCase.clientName}</p>
            <p><strong>Case History:</strong> {viewingCase.caseHistory}</p>
            <p><strong>Notes:</strong> {viewingCase.notes}</p>
            <p><strong>Status:</strong> {viewingCase.status}</p>
            <button
              style={styles.btnCloseModal}
              onClick={() => setViewingCase(null)}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Styles
const styles = {
  caseManagementPage: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    // backgroundImage: "url('/assets/case-bg.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  caseContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    maxWidth: "700px",
    width: "100%",
  },
  caseTitle: {
    textAlign: "center",
    color: "#2d6da5",
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "2rem",
  },
  formGroup: {
    marginBottom: "1.5rem",
  },
  formLabel: {
    display: "block",
    fontSize: "1rem",
    fontWeight: "500",
    marginBottom: "0.5rem",
    color: "#333",
  },
  formInput: {
    width: "100%",
    padding: "0.9rem",
    border: "1px solid #c2b697",
    borderRadius: "6px",
    fontSize: "1rem",
    backgroundColor: "#f9f9f9",
  },
  formTextArea: {
    width: "100%",
    padding: "0.9rem",
    border: "1px solid #c2b697",
    borderRadius: "6px",
    fontSize: "1rem",
    backgroundColor: "#f9f9f9",
    height: "100px",
    resize: "vertical",
  },
  btnSubmit: {
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
  caseList: {
    marginTop: "2rem",
  },
  caseListTitle: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginBottom: "1rem",
  },
  caseItems: {
    listStyle: "none",
    padding: 0,
  },
  caseItem: {
    padding: "1rem",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
    marginBottom: "1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  caseActions: {
    display: "flex",
    gap: "1rem",
  },
  btnView: {
    backgroundColor: "#2d6da5",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
  },
  btnClose: {
    backgroundColor: "#d9534f",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
  },
  caseDetails: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
    zIndex: 1000,
  },
  caseDetailsTitle: {
    marginBottom: "1rem",
    color: "#2d6da5",
  },
  btnCloseModal: {
    backgroundColor: "#2d6da5",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default CaseManagement;
