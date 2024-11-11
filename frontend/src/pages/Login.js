import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { auth, googleProvider } from './firebaseConfig.js';
import { signInWithPopup } from 'firebase/auth';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle role selection and save to session
  const handleRoleSelection = (role) => {
    sessionStorage.setItem("selectedRole", role); // Save role in session storage
    setIsRoleModalOpen(false); // Close the modal
    handleGoogleSignIn(role); // Proceed to Google sign-in
  };

  // Trigger Google Sign-In with the selected role
  const handleGoogleSignIn = async (role) => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userData = {
        displayName: user.displayName,
        Uid: user.uid,
        email: user.email,
        role, // Use the selected role
      };

      // Send user data to the backend
      const response = await axios.post("http://localhost:5000/api/auth/google-login", userData);
      const data = response.data.user;

      localStorage.setItem("name", data.displayName); // Store user's name

      // Navigate based on role
      if (data.role === "Admin") {
        navigate("/AdminDashboard");
      } else if (data.role === "Lawyer") {
        navigate("/LawyerDashboard");
      } else if (data.role === "Client") {
        navigate("/ClientDashboard");
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        ...formData,
        role: sessionStorage.getItem("selectedRole"), // Use the role stored in session storage
      });
      const data = response.data;

      if (data.message === "Login successful.") {
        localStorage.setItem("token", data.token);
        localStorage.setItem("name", data.firstName);

        if (data.role === "Admin") {
          navigate("/AdminDashboard");
        } else if (data.role === "Lawyer") {
          navigate("/LawyerDashboard");
        } else if (data.role === "Client") {
          navigate("/ClientDashboard");
        }
      } else {
        alert(`Login failed: ${data.message}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.loginPage}>
      <div style={styles.logoContainer}>
        <img src="/favicon.png" alt="Logo" style={styles.logo} />
        <h1 style={styles.appName}>Lex Net</h1>
      </div>
      <div style={styles.overlay}>
        <div style={styles.loginContainer}>
          <h2 style={styles.loginTitle}>Welcome Back</h2>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label htmlFor="email" style={styles.formLabel}>Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={styles.formInput}
                placeholder="Enter your email"
              />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="password" style={styles.formLabel}>Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                style={styles.formInput}
                placeholder="Enter your password"
              />
            </div>
            <div style={styles.rememberMe}>
              <input type="checkbox" id="rememberMe" />
              <label htmlFor="rememberMe" style={styles.rememberMeLabel}>Remember Me</label>
            </div>
            <button id="login" type="submit" style={styles.btnLogin} disabled={loading} className="btn w-100">
              {loading ? "Signing in..." : "Login"}
            </button>

            <button
              onClick={() => setIsRoleModalOpen(true)}
              style={styles.googleButton}
              disabled={loading}
            >
              {loading ? "Signing in with Google..." : "Sign in with Google"}
            </button>
            {error && <p style={{ color: "red" }}>{error}</p>}

            <Link to="/forgotpassword" style={styles.forgotPassword}>Lost your password?</Link>
          </form>
        </div>
      </div>

      {/* Role Selection Modal */}
      {isRoleModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Select Your Role</h3>
            <button style={styles.roleButton} onClick={() => handleRoleSelection("Lawyer")}>Lawyer</button>
            <button style={styles.roleButton} onClick={() => handleRoleSelection("Client")}>Client</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  // ... existing styles

  googleButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#db4437",
    color: "#fff",
    fontWeight: "bold",
    borderRadius: "8px",
    padding: "0.8rem",
    marginTop: "15px",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "background-color 0.3s ease",
    width: "100%", // Matches the width of the login button
  },
  
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },

  modalContent: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    textAlign: "center",
  },

  roleButton: {
    display: "block",
    width: "100%",
    padding: "10px",
    marginTop: "10px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },

  loginPage: {
    position: "relative",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    minHeight: "100vh",
    backgroundImage: "url('/assets/loginpicture.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    fontFamily: "'Open Sans', sans-serif",
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  loginContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.9)",
    maxWidth: "400px",
    width: "100%",
    textAlign: "center",
    marginRight: "15rem",
  },

  // Logo and App Name styles
  logoContainer: {
    position: "absolute",
    top: "20px",
    left: "20px",
    display: "flex",
    alignItems: "center",
  },

  logo: {
    width: "100px",
    marginRight: "10px",
  },

  appName: {
    fontSize: "1.8rem",
    color: "#fff",
    fontWeight: "bold",
  },

  loginTitle: {
    color: "#fff",
    fontSize: "1.5rem",
    marginBottom: "1rem",
    fontWeight: "bold",
  },

  formGroup: {
    marginBottom: "1rem",
    textAlign: "left",
  },

  formLabel: {
    display: "block",
    fontSize: "1rem",
    color: "#fff",
    fontWeight: "600",
  },

  formInput: {
    width: "100%",
    padding: "0.8rem",
    borderRadius: "8px",
    border: "none",
    boxShadow: "0 0 5px rgba(0, 0, 0, 0.2)",
    fontSize: "1rem",
  },

  rememberMe: {
    display: "flex",
    alignItems: "center",
    marginBottom: "1rem",
  },

  rememberMeLabel: {
    fontSize: "0.9rem",
    color: "#fff",
    marginLeft: "0.5rem",
  },

  forgotPassword: {
    fontSize: "0.9rem",
    color: "#fff",
    textDecoration: "none",
    display: "block",
    marginTop: "1rem",
  },

  btnLogin: {
    padding: "0.8rem",
    backgroundColor: "#007bff", // Changed to blue
    color: "#fff",
    fontWeight: "bold",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    fontSize: "1rem",
    width: "100%", // Full width to match Google button
  },
};

export default Login;
