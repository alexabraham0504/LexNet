import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { auth, googleProvider } from "./firebaseConfig.js";
import { signInWithPopup } from "firebase/auth";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const { login } = useAuth();

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

  const handleGoogleSignIn = async (role) => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userData = {
        displayName: user.displayName,
        Uid: user.uid,
        email: user.email,
        role,
      };

      const response = await axios.post(
        "http://localhost:5000/api/auth/google-login",
        userData
      );
      const data = response.data.user;

      // Check if user is approved
      if (data.status !== "approved") {
        setError(
          "Your account is pending approval or has been rejected/suspended. Please contact admin."
        );
        return;
      }

      sessionStorage.setItem("name", data.displayName);
      sessionStorage.setItem("email", user.email);

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
      // Ensure email and password are not empty
      if (!formData.email || !formData.password) {
        setError("Please provide both email and password");
        return;
      }

      const loginData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      };

      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        loginData,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data.success) {
        const { token, user } = response.data;
        
        // Store auth data in sessionStorage
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("userid", user._id);
        sessionStorage.setItem("name", user.fullName);
        sessionStorage.setItem("email", user.email);
        sessionStorage.setItem("role", user.role);

        // Use the login function from AuthContext
        login({
          ...user,
          token,
        });

        // Redirect based on role
        const userRole = user.role.toLowerCase();
        switch(userRole) {
          case "lawyer":
            navigate("/lawyerdashboard");
            break;
          case "client":
            navigate("/clientdashboard");
            break;
          case "admin":
            navigate("/admindashboard");
            break;
          default:
            setError("Invalid user role");
        }
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error details:", error);
      
      if (error.response) {
        // Handle specific error cases
        const status = error.response.status;
        const errorMessage = error.response.data?.message;

        switch (status) {
          case 400:
            setError(errorMessage || "Invalid email or password");
            break;
          case 401:
            setError("Invalid credentials");
            break;
          case 403:
            setError("Account not verified or pending approval");
            break;
          default:
            setError("Failed to login. Please try again.");
        }
      } else if (error.request) {
        setError("No response from server. Please check your connection.");
      } else {
        setError("Failed to login. Please try again.");
      }
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
              <label htmlFor="email" style={styles.formLabel}>
                Email Address
              </label>
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
              <label htmlFor="password" style={styles.formLabel}>
                Password
              </label>
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
              <label htmlFor="rememberMe" style={styles.rememberMeLabel}>
                Remember Me
              </label>
            </div>
            <button
              id="login"
              type="submit"
              style={styles.btnLogin}
              className="btn-login glass-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}
            </button>

            <button
              onClick={() => setIsRoleModalOpen(true)}
              style={styles.googleButton}
              className="google-button glass-button"
              disabled={loading}
            >
              {loading ? "Signing in with Google..." : "Sign in with Google"}
            </button>
            {error && <p style={{ color: "red" }}>{error}</p>}

            <Link to="/forgotpassword" style={styles.forgotPassword}>
              Lost your password?
            </Link>
          </form>
        </div>
      </div>

      {/* Role Selection Modal */}
      {isRoleModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Select Your Role</h3>
            <button
              style={styles.roleButton}
              onClick={() => handleRoleSelection("Lawyer")}
            >
              Lawyer
            </button>
            <button
              style={styles.roleButton}
              onClick={() => handleRoleSelection("Client")}
            >
              Client
            </button>
          </div>
        </div>
      )}

      <style>
        {`
          .glass-button {
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
          }

          .glass-button:hover {
            transform: scale(1.02);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
          }

          .glass-button:hover::before {
            animation: reflectLight 1s;
          }

          .glass-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.4),
              transparent
            );
          }

          @keyframes reflectLight {
            0% {
              left: -100%;
            }
            100% {
              left: 100%;
            }
          }

          .btn-login {
            background-color: rgba(0, 123, 255, 0.9);
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            box-shadow: 0 4px 15px rgba(0, 123, 255, 0.2);
          }

          .google-button {
            background-color: rgba(219, 68, 55, 0.9);
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            box-shadow: 0 4px 15px rgba(219, 68, 55, 0.2);
          }
        `}
      </style>
    </div>
  );
};

const styles = {
  // ... existing styles

  btnLogin: {
    padding: "0.8rem",
    backgroundColor: "rgba(0, 123, 255, 0.9)",
    color: "#fff",
    fontWeight: "bold",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    width: "100%",
    position: "relative",
    overflow: "hidden",
    transition: "transform 0.3s ease",
    backdropFilter: "blur(5px)",
    WebkitBackdropFilter: "blur(5px)",
    boxShadow: "0 4px 15px rgba(0, 123, 255, 0.2)",
    "&:hover": {
      transform: "scale(1.02)",
    },
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: "-100%",
      width: "100%",
      height: "100%",
      background:
        "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)",
      transition: "0.5s",
      animation: "reflectLight 1.5s infinite",
    },
  },

  googleButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(219, 68, 55, 0.9)",
    color: "#fff",
    fontWeight: "bold",
    borderRadius: "8px",
    padding: "0.8rem",
    marginTop: "15px",
    cursor: "pointer",
    fontSize: "1rem",
    width: "100%",
    position: "relative",
    overflow: "hidden",
    transition: "transform 0.3s ease",
    backdropFilter: "blur(5px)",
    WebkitBackdropFilter: "blur(5px)",
    boxShadow: "0 4px 15px rgba(219, 68, 55, 0.2)",
    "&:hover": {
      transform: "scale(1.02)",
    },
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: "-100%",
      width: "100%",
      height: "100%",
      background:
        "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)",
      transition: "0.5s",
      animation: "reflectLight 1.5s infinite",
    },
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

  "@keyframes reflectLight": {
    "0%": {
      left: "-100%",
    },
    "100%": {
      left: "100%",
    },
  },
};

export default Login;
