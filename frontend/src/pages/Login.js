import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGoogleSignIn = () => {
    window.open("http://localhost:5000/auth/google/callback", "_self");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        formData
      );
      const data = response.data;

      if (data.message === "Login successful.") {
        // alert("Login success");
        console.log(data);
        localStorage.setItem("token", data.token); // Store the JWT token
        localStorage.setItem("name", data.firstName); // Store the user's first name

        // Navigate based on the role
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
      setError(
        err.response?.data?.message || "An error occurred. Please try again."
      );
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
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}
            </button>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <Link to="/forgotpassword" style={styles.forgotPassword}>
              Lost your password?
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
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
    marginRight: "10px", // Add space between logo and app name
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
    fontWeight: "bold",
  },
  formLabel: {
    display: "block",
    fontSize: "0.9rem",
    marginBottom: "0.5rem",
    color: "#333",
    fontWeight: "bold",
  },
  formInput: {
    width: "100%",
    padding: "0.6rem",
    border: "1px solid #ccc",
    borderRadius: "13px",
    fontSize: "0.9rem",
    color: "#333",
    marginBottom: "1rem",
  },
  rememberMe: {
    display: "flex",
    alignItems: "center",
    marginBottom: "1rem",
    fontWeight: "bold",
  },
  rememberMeLabel: {
    marginLeft: "0.5rem",
    fontSize: "0.9rem",
    color: "#333",
  },
  btnLogin: {
    display: "block",
    width: "100%",
    padding: "0.8rem",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    marginTop: "1rem",
    fontWeight: "bold",
  },
  btnSignUp: {
    display: "block",
    width: "100%",
    padding: "0.8rem",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    marginTop: "1rem",
    fontWeight: "bold",
  },
  forgotPassword: {
    display: "block",
    color: "#fff",
    fontSize: "0.9rem",
    marginTop: "1rem",
    fontWeight: "bold",
  },
};

export default Login;
