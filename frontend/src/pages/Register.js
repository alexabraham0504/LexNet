import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "Client", // Default to Client
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "firstName":
      case "lastName":
        if (!/^[a-zA-Z]+$/.test(value)) {
          error = `${
            name === "firstName" ? "First" : "Last"
          } name should contain only alphabets.`;
        }
        break;
      case "email":
        if (!/^[a-z0-9]+@[a-z]+\.[a-z]{2,3}$/.test(value)) {
          error = "Email must be in lowercase and a valid format.";
        }
        break;
        case "phone":
          if (!/^\d{10}$/.test(value)) {
            error = "Phone number must be a valid 10-digit number.";
          } else if (/^(\d)\1{2,}$/.test(value)) {
            error =
              "Phone number cannot contain the same digit repeated more than three times.";
          } else if (/^0/.test(value)) {
            error = "Phone number cannot start with 0.";
          } else if (/^.{0,2}0/.test(value)) {
            error = "The first three digits of the phone number cannot contain 0.";
          }
        break;
      case "password":
        if (value.length < 8) {
          error = "Password must be at least 8 characters long.";
        } else if (!/[A-Z]/.test(value)) {
          error = "Password must contain at least one uppercase letter.";
        } else if (!/[a-z]/.test(value)) {
          error = "Password must contain at least one lowercase letter.";
        } else if (!/[0-9]/.test(value)) {
          error = "Password must contain at least one number.";
        } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
          error = "Password must contain at least one special character.";
        }
        break;
      case "confirmPassword":
        if (value !== formData.password) {
          error = "Passwords do not match.";
        }
        break;
      default:
        break;
    }
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error,
    }));
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    Object.keys(formData).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        formData
      );
      const data = await response.data;

      if (data.message === "User registered successfully.") {
        alert("User registered successfully.");
        navigate("/login");
      } else {
        alert("Registration failed", data.message);
        navigate("/register");
      }
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div style={styles.registerPage}>
      <div style={styles.registerContainer}>
        <h2 style={styles.registerTitle}>Register</h2>
        <form onSubmit={handleSubmit}>
          {/* First Name */}
          <div style={styles.formGroup}>
            <label htmlFor="firstName" style={styles.formLabel}>
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              style={{
                ...styles.formInput,
                borderColor: errors.firstName ? "red" : "#c2b697",
              }}
            />
            {errors.firstName && (
              <p style={styles.errorMessage}>{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div style={styles.formGroup}>
            <label htmlFor="lastName" style={styles.formLabel}>
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              style={{
                ...styles.formInput,
                borderColor: errors.lastName ? "red" : "#c2b697",
              }}
            />
            {errors.lastName && (
              <p style={styles.errorMessage}>{errors.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.formLabel}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                ...styles.formInput,
                borderColor: errors.email ? "red" : "#c2b697",
              }}
            />
            {errors.email && <p style={styles.errorMessage}>{errors.email}</p>}
          </div>

          {/* Phone */}
          <div style={styles.formGroup}>
            <label htmlFor="phone" style={styles.formLabel}>
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              style={{
                ...styles.formInput,
                borderColor: errors.phone ? "red" : "#c2b697",
              }}
            />
            {errors.phone && <p style={styles.errorMessage}>{errors.phone}</p>}
          </div>

          {/* Password */}
          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.formLabel}>
              Password
            </label>
            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                style={{
                  ...styles.formInput,
                  borderColor: errors.password ? "red" : "#c2b697",
                }}
              />
              <span
                onClick={togglePasswordVisibility}
                style={styles.passwordToggleIcon}
              >
                <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
              </span>
            </div>
            {errors.password && (
              <p style={styles.errorMessage}>{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div style={styles.formGroup}>
            <label htmlFor="confirmPassword" style={styles.formLabel}>
              Confirm Password
            </label>
            <div style={styles.passwordWrapper}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                style={{
                  ...styles.formInput,
                  borderColor: errors.confirmPassword ? "red" : "#c2b697",
                }}
              />
              <span
                onClick={toggleConfirmPasswordVisibility}
                style={styles.passwordToggleIcon}
              >
                <FontAwesomeIcon
                  icon={showConfirmPassword ? faEye : faEyeSlash}
                />
              </span>
            </div>
            {errors.confirmPassword && (
              <p style={styles.errorMessage}>{errors.confirmPassword}</p>
            )}
          </div>

          {/* Role Dropdown */}
          <div style={styles.formGroup}>
            <label htmlFor="role" style={styles.formLabel}>
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={styles.formInput}
              required
            >
              <option value="Client">Client</option>
              <option value="Lawyer">Lawyer</option>
            </select>
          </div>

          {errors.submit && <p style={styles.errorMessage}>{errors.submit}</p>}

          <button type="submit" style={styles.btnRegister} disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>

          <div style={styles.formOptions}>
            <Link to="/login" style={styles.centeredLink}>
              Already have an account? Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

// Styles
const styles = {
  registerPage: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundImage: "url('/assets/registerpic.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Dark overlay for better text contrast
    display: "flex",
    justifyContent: "flex-end", // Align overlay to right
    alignItems: "center",
  },
  registerContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.3)", // Make it transparent
    padding: "3rem",
    borderRadius: "30px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.9)",
    maxWidth: "400px",
    width: "80%",
    textAlign: "left",
    marginLeft: "45rem", // Add some margin to the right
  },
  registerTitle: {
    textAlign: "center",
    color: "#02182b",
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginBottom: "1rem",
  },
  formGroup: {
    marginBottom: "0.8rem",
  },
  formLabel: {
    display: "block",
    fontSize: "0.9rem",
    fontWeight: "500",
    marginBottom: "0rem",
    color: "#02182b",
    // fontWeight: "bold",
  },
  formInput: {
    width: "100%",
    padding: "0.5rem", // Smaller padding
    border: "1px solid #c2b697",
    borderRadius: "13px",
    fontSize: "0.8rem", // Smaller font size
    backgroundColor: "#f9f9f9",
    transition: "border-color 0.3s ease",
  },
  passwordWrapper: {
    position: "relative",
  },
  passwordToggleIcon: {
    position: "absolute",
    top: "50%",
    right: "10px",
    cursor: "pointer",
    transform: "translateY(-50%)",
    padding: "5px",
    borderRadius: "50%",
    fontSize: ".75rem", // Icon size
  },
  errorMessage: {
    color: "red",
    fontSize: "0.75rem", // Error message size
    marginTop: "0.3rem",
  },
  btnRegister: {
    display: "block",
    width: "100%",
    padding: "0.5rem", // Reduced button padding
    backgroundColor: "#2d6da5",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.85rem", // Button font size
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  formOptions: {
    textAlign: "center",
    marginTop: "0.3rem",
    marginBottom: "1rem", // Adjusted margin
    borderRadius: "5px",
  },
  centeredLink: {
    textDecoration: "none",
    color: "#02182b",
    fontWeight: "500",
    fontSize: "bold", // Smaller link font size
  },
};

export default Register;
