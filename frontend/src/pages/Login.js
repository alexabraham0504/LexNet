import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { API_BASE_URL } from '../config/api.config';
import { auth, googleProvider } from "./firebaseConfig.js";
import { signInWithPopup } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/navbar/home-navbar";
import SuspensionModal from '../components/SuspensionModal';

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Debugging log
console.log('API Base URL:', API_BASE_URL);

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
  const [suspensionDetails, setSuspensionDetails] = useState(null);

  useEffect(() => {
    // Don't check authentication during logout
    if (sessionStorage.getItem("isLoggingOut")) {
      sessionStorage.removeItem("isLoggingOut");
      return;
    }

    // Check if user is already logged in
    const token = sessionStorage.getItem("token");
    const role = sessionStorage.getItem("role");
    
    if (token && role) {
      try {
        // Verify token validity with backend before redirecting
        const verifyToken = async () => {
          try {
            const response = await api.get('/api/auth/verify-token');
            
            if (response.data.valid) {
              // Token is valid, redirect based on role
              switch(role.toLowerCase()) {
                case "lawyer":
                  navigate("/lawyerdashboard", { replace: true });
                  break;
                case "client":
                  navigate("/clientdashboard", { replace: true });
                  break;
                case "admin":
                  navigate("/admindashboard", { replace: true });
                  break;
                default:
                  sessionStorage.clear();
              }
            } else {
              sessionStorage.clear();
            }
          } catch (error) {
            console.error("Token verification failed:", error);
            sessionStorage.clear();
          }
        };

        verifyToken();
      } catch (error) {
        console.error("Error during token verification:", error);
        sessionStorage.clear();
      }
    }
  }, [navigate]);

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

      const response = await api.post('/api/auth/google-login', userData);
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
        navigate("/AdminDashboard", { replace: true });
      } else if (data.role === "Lawyer") {
        navigate("/LawyerDashboard", { replace: true });
      } else if (data.role === "Client") {
        navigate("/ClientDashboard", { replace: true });
      }

      alert(`User role: ${data.role.toLowerCase()}`);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuspensionDetails(null);
    
    try {
      if (!formData.email || !formData.password) {
        setError("Please provide both email and password");
        return;
      }

      const loginData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      };

      console.log('Login Data:', loginData); // Log login data

      const response = await api.post('/api/auth/login', loginData);

      console.log('Login Response:', response.data); // Log response data

      if (response.data.success) {
        const { token, user } = response.data;
        
        // Store auth data in sessionStorage
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("userid", user._id);
        sessionStorage.setItem("name", user.fullName);
        sessionStorage.setItem("email", user.email);
        sessionStorage.setItem("role", user.role);
        sessionStorage.setItem("phone", user.phone || ''); // Add fallback empty string

        console.log('Session Storage:', {
          token: sessionStorage.getItem("token"),
          userid: sessionStorage.getItem("userid"),
          name: sessionStorage.getItem("name"),
          email: sessionStorage.getItem("email"),
          role: sessionStorage.getItem("role"),
          phone: sessionStorage.getItem("phone") // Log phone number
        });

        // Use the login function from AuthContext
        login({
          ...user,
          token,
        });

        // Redirect based on role with replace: true
        const userRole = user.role.toLowerCase();
        switch(userRole) {
          case "lawyer":
            navigate("/lawyerdashboard", { replace: true });
            break;
          case "client":
            navigate("/clientdashboard", { replace: true });
            break;
          case "admin":
            navigate("/admindashboard", { replace: true });
            break;
          default:
            setError("Invalid user role");
        }
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login Error:", error); // Log any errors
      if (error.response?.status === 403) {
        const suspensionData = error.response.data.details || error.response.data;
        setSuspensionDetails({
          reason: suspensionData.reason || suspensionData.message || "Your account has been suspended",
          suspendedAt: suspensionData.suspendedAt || null,
          message: suspensionData.message || "Please contact administrator for assistance."
        });
      } else {
        setError(error.response?.data?.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={styles.loginPage}>
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
              {error && <div className="error-message">{error}</div>}
              
              {suspensionDetails && (
                <SuspensionModal 
                  details={suspensionDetails} 
                  onClose={() => setSuspensionDetails(null)}
                />
              )}

              <button
                id="login"
                type="submit"
                style={styles.btnLogin}
                className={`btn-login glass-button ${suspensionDetails ? 'disabled' : ''}`}
                disabled={loading || suspensionDetails}
              >
                {loading ? "Signing in..." : "Login"}
              </button>

              {/* Google Sign-in button commented out
              <button
                onClick={() => setIsRoleModalOpen(true)}
                style={styles.googleButton}
                className="google-button glass-button"
                disabled={loading}
              >
                {loading ? "Signing in with Google..." : "Sign in with Google"}
              </button>
              */}

              <Link to="/forgotpassword" style={styles.forgotPassword}>
                Lost your password?
              </Link>
              <Link to="/register" style={styles.registerLink}>
                Don't have an account? Register here
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
      </div>

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

          .suspension-notice {
            background-color: #fee2e2;
            border: 1px solid #ef4444;
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
            color: #991b1b;
          }

          .suspension-header {
            font-weight: 600;
            font-size: 1.1rem;
            margin-bottom: 8px;
          }

          .suspension-details {
            font-size: 0.95rem;
          }

          .suspension-contact {
            margin-top: 8px;
            font-style: italic;
          }

          .login-button.disabled {
            background-color: #d1d5db;
            cursor: not-allowed;
          }

          .registerLink:hover, .forgotPassword:hover {
            color: #e0e0e0;
            text-decoration: underline;
            transition: all 0.3s ease;
          }
        `}
      </style>
    </>
  );
};

const styles = {
  loginPage: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundImage: "url('/assets/loginpicture.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    fontFamily: "'Open Sans', sans-serif",
    overflow: "hidden",
    paddingTop: "80px",
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  loginContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.9)",
    maxWidth: "400px",
    width: "90%",
    maxHeight: "90vh",
    overflowY: "auto",
    textAlign: "center",
    marginRight: 0,
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
    transition: "all 0.3s ease",
  },

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

  registerLink: {
    fontSize: "0.9rem",
    color: "#fff",
    textDecoration: "none",
    display: "block",
    marginTop: "0.5rem",
    transition: "all 0.3s ease",
  },
};

export default Login;
