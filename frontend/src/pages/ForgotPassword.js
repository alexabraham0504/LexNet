import React, { useState } from "react";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        { email }
      );
      setMessage(response.data.message);
      setEmail("");
    } catch (error) {
      setMessage("Error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2>Forgot Password</h2>
        <form onSubmit={handleForgotPassword}>
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>
              Enter your email address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email Address"
              style={styles.input}
            />
          </div>
          <button
            type="submit"
            style={loading ? styles.buttonDisabled : styles.button}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        {message && <p style={styles.message}>{message}</p>}
      </div>
    </div>
  );
};

// Inline CSS styles
const styles = {
  page: {
    // backgroundImage: 'url("https://your-image-url-here.jpg")',
    backgroundSize: "cover",
    backgroundPosition: "center",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
    maxWidth: "400px",
    width: "100%",
    textAlign: "center",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "bold",
    fontSize: "1.1em",
  },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "1em",
  },
  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "midnightblue",
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontSize: "1em",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  buttonDisabled: {
    width: "100%",
    padding: "12px",
    backgroundColor: "gray",
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontSize: "1em",
    cursor: "not-allowed",
  },
  message: {
    marginTop: "20px",
    fontWeight: "bold",
    color: "green",
  },
};

export default ForgotPassword;
