import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const { token } = useParams(); // Get the token from URL
  const navigate = useNavigate(); // Hook to navigate user
  const [password, setPassword] = useState(""); // State for new password
  const [confirmPassword, setConfirmPassword] = useState(""); // State for confirming password
  const [message, setMessage] = useState(""); // State for messages
  const [error, setError] = useState(""); // State for errors
  const [loading, setLoading] = useState(false); // State for loading indicator

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true); // Set loading state
    try {
      // Use backticks for template literals in the API URL
      const { data } = await axios.post(
        `http://localhost:3000/api/auth/resetpassword/${token}`,
        { password }
      );
      setMessage(data.message);
      setError("");
      setTimeout(() => {
        navigate("/login"); // Redirect to login after 3 seconds
      }, 3000);
    } catch (error) {
      console.error(
        "Error resetting password:",
        error.response ? error.response.data : error.message
      );
      setError(error.response?.data?.message || "Error resetting password");
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <div className="reset-password-container">
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Submit"}
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}
      <style jsx>{`
        .reset-password-container {
          max-width: 400px; /* Maximum width for the container */
          margin: 50px auto; /* Center the container */
          padding: 20px; /* Padding inside the container */
          border: 1px solid #ccc; /* Light gray border */
          border-radius: 5px; /* Rounded corners */
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); /* Subtle shadow */
          background-color: #f9f9f9; /* Light background color */
        }

        h2 {
          text-align: center; /* Center the heading */
          color: #333; /* Darker text color */
          margin-bottom: 20px; /* Space below the heading */
        }

        form {
          display: flex; /* Use flexbox for layout */
          flex-direction: column; /* Stack items vertically */
        }

        input {
          margin-bottom: 15px; /* Space below each input field */
          padding: 10px; /* Padding inside input fields */
          border: 1px solid #ccc; /* Light gray border */
          border-radius: 4px; /* Rounded corners */
          font-size: 16px; /* Font size */
          transition: border-color 0.3s; /* Smooth transition for border color */
        }

        input:focus {
          border-color: #007bff; /* Change border color on focus */
          outline: none; /* Remove default outline */
        }

        button {
          padding: 10px; /* Padding inside the button */
          background-color: #007bff; /* Bootstrap primary color */
          color: white; /* Text color */
          border: none; /* No border */
          border-radius: 4px; /* Rounded corners */
          font-size: 16px; /* Font size */
          cursor: pointer; /* Pointer cursor on hover */
          transition: background-color 0.3s; /* Smooth transition for background color */
        }

        button:disabled {
          background-color: #ccc; /* Gray background when disabled */
          cursor: not-allowed; /* Not-allowed cursor */
        }

        button:hover:not(:disabled) {
          background-color: #0056b3; /* Darker shade on hover */
        }

        p {
          text-align: center; /* Center error and message text */
          margin-top: 15px; /* Space above the message */
          font-size: 14px; /* Font size */
        }
      `}</style>
    </div>
  );
};

export default ResetPassword;
