import React, { useState } from "react";

const Review = () => {
  const [formData, setFormData] = useState({
    rating: 0,
    feedback: "",
  });
  const [submitMessage, setSubmitMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitMessage("");

    // Mock API request to submit the review
    try {
      await mockApiSubmit(formData);
      setSubmitMessage("Thank you for your feedback!");
      setFormData({ rating: 0, feedback: "" });
    } catch (error) {
      setSubmitMessage("Error submitting feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const mockApiSubmit = (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("Feedback submitted:", data);
        resolve();
      }, 1000);
    });
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Submit Review & Feedback</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="rating" style={styles.label}>
            Rating (1 to 5):
          </label>
          <input
            type="number"
            id="rating"
            name="rating"
            min="1"
            max="5"
            value={formData.rating}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="feedback" style={styles.label}>
            Feedback:
          </label>
          <textarea
            id="feedback"
            name="feedback"
            value={formData.feedback}
            onChange={handleChange}
            required
            style={styles.textarea}
          />
        </div>
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Submitting..." : "Submit Feedback"}
        </button>
      </form>
      {submitMessage && <p style={styles.message}>{submitMessage}</p>}
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
  form: {
    display: "flex",
    flexDirection: "column",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    marginBottom: "8px",
    fontWeight: "500",
    color: "#333",
  },
  input: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  textarea: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    resize: "vertical",
    minHeight: "100px",
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#2d6da5",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  message: {
    marginTop: "20px",
    textAlign: "center",
    color: "green",
  },
};

export default Review;
