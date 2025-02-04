import React, { useEffect, useState } from "react";
import Footer from "../../components/footer/footer-admin";
import Navbar from "../../components/navbar/navbar-admin";

const ContentModeration = () => {
  const [feedback, setFeedback] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/feedback");
        const data = await response.json();
        setFeedback(data);
      } catch (error) {
        console.error("Error fetching feedback:", error);
      }
    };

    fetchFeedback();
  }, []);

  const handleResolve = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/feedback/${id}/resolve`, {
        method: "PUT",
      });
      setFeedback(
        feedback.map((item) =>
          item.id === id ? { ...item, flagged: false } : item
        )
      );
    } catch (error) {
      console.error("Error resolving feedback:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/feedback/${id}`, {
        method: "DELETE",
      });
      setFeedback(feedback.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting feedback:", error);
    }
  };

  const filteredFeedback = feedback.filter(
    (item) =>
      item.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const styles = {
    container: {
      padding: '2rem 4rem',
      minHeight: 'calc(100vh - 140px)',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
    },
    contentModeration: {
      background: 'white',
      borderRadius: '15px',
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
      padding: '2rem',
      transition: 'all 0.3s ease',
    },
    heading: {
      color: '#1a237e',
      marginBottom: '1.5rem',
      fontSize: '2.5rem',
      fontWeight: 'bold',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      background: 'linear-gradient(45deg, #1a237e, #0d47a1)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    searchInput: {
      width: '100%',
      maxWidth: '400px',
      padding: '1rem 1.5rem',
      border: '2px solid #e0e0e0',
      borderRadius: '30px',
      fontSize: '1rem',
      marginBottom: '2rem',
      transition: 'all 0.3s ease',
      ':focus': {
        borderColor: '#1a237e',
        boxShadow: '0 0 10px rgba(26, 35, 126, 0.2)',
      }
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0 8px',
      marginTop: '1rem',
    },
    th: {
      backgroundColor: '#1a237e',
      color: 'white',
      padding: '1.2rem',
      textAlign: 'left',
      fontWeight: '600',
      fontSize: '1.1rem',
      borderRadius: '8px',
    },
    td: {
      padding: '1.2rem',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderBottom: '1px solid #e0e0e0',
      fontSize: '1rem',
      transition: 'all 0.3s ease',
    },
    tr: {
      transition: 'transform 0.3s ease',
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
      }
    },
    statusBadge: (flagged) => ({
      padding: '0.6rem 1.2rem',
      borderRadius: '20px',
      fontSize: '0.9rem',
      fontWeight: '600',
      backgroundColor: flagged ? '#ff5252' : '#4caf50',
      color: 'white',
      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
      display: 'inline-block',
      transition: 'all 0.3s ease',
    }),
    actionButtons: {
      display: 'flex',
      gap: '0.8rem',
    },
    button: {
      padding: '0.8rem 1.5rem',
      border: 'none',
      borderRadius: '25px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '0.9rem',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
    },
    resolveButton: {
      backgroundColor: '#1a237e',
      color: 'white',
      ':hover': {
        backgroundColor: '#283593',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 10px rgba(26, 35, 126, 0.3)',
      }
    },
    deleteButton: {
      backgroundColor: '#ff1744',
      color: 'white',
      ':hover': {
        backgroundColor: '#d50000',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 10px rgba(255, 23, 68, 0.3)',
      }
    },
  };

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.contentModeration}>
          <h1 style={styles.heading}>Content Moderation Dashboard</h1>
          <input
            type="text"
            placeholder="🔍 Search feedback or users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{...styles.th, borderRadius: '8px 0 0 8px'}}>User</th>
                <th style={styles.th}>Feedback</th>
                <th style={styles.th}>Status</th>
                <th style={{...styles.th, borderRadius: '0 8px 8px 0'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeedback.map((item) => (
                <tr key={item.id} style={styles.tr}>
                  <td style={{...styles.td, borderRadius: '8px 0 0 8px'}}>{item.user}</td>
                  <td style={styles.td}>{item.content}</td>
                  <td style={styles.td}>
                    <span style={styles.statusBadge(item.flagged)}>
                      {item.flagged ? "⚠️ Flagged" : "✅ Resolved"}
                    </span>
                  </td>
                  <td style={{...styles.td, borderRadius: '0 8px 8px 0'}}>
                    {item.flagged && (
                      <div style={styles.actionButtons}>
                        <button
                          onClick={() => handleResolve(item.id)}
                          style={{...styles.button, ...styles.resolveButton}}
                        >
                          ✓ Resolve
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          style={{...styles.button, ...styles.deleteButton}}
                        >
                          ✕ Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContentModeration;
