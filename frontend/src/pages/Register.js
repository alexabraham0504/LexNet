// import React, { useState } from "react";

// const Register = () => {
//   const [formData, setFormData] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     phone: "",
//     password: "",
//     confirmPassword: "",
//   });

//   const [errors, setErrors] = useState({});

//   // Form field validation logic
//   const validateForm = () => {
//     let newErrors = {};

//     // First Name validation: only alphabets
//     if (!formData.firstName.trim()) {
//       newErrors.firstName = "First name is required";
//     } else if (!/^[A-Za-z]+$/.test(formData.firstName)) {
//       newErrors.firstName = "First name must contain only alphabets";
//     }

//     // Last Name validation: only alphabets
//     if (!formData.lastName.trim()) {
//       newErrors.lastName = "Last name is required";
//     } else if (!/^[A-Za-z]+$/.test(formData.lastName)) {
//       newErrors.lastName = "Last name must contain only alphabets";
//     }

//     // Email validation with enhanced regex for standard email format
//     if (!formData.email) {
//       newErrors.email = "Email is required";
//     } else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/.test(formData.email)) {
//       newErrors.email = "Please enter a valid email address";
//     }

//     // Phone validation: must be 10 digits
//     if (!formData.phone) {
//       newErrors.phone = "Phone number is required";
//     } else if (!/^\d{10}$/.test(formData.phone)) {
//       newErrors.phone = "Phone number must be a 10-digit number";
//     }

//     // Password validation: combination of letters, numbers, special characters, min 4 max 10
//     if (!formData.password) {
//       newErrors.password = "Password is required";
//     } else if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{4,10}$/.test(formData.password)) {
//       newErrors.password =
//         "Password must be 4-10 characters long and include letters, numbers, and special characters";
//     }

//     // Confirm Password validation: must match password
//     if (formData.password !== formData.confirmPassword) {
//       newErrors.confirmPassword = "Passwords do not match";
//     }

//     return newErrors;
//   };

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const validationErrors = validateForm();
//     if (Object.keys(validationErrors).length > 0) {
//       setErrors(validationErrors);
//     } else {
//       // Form submission logic goes here (e.g., API call)
//       console.log("Form submitted", formData);
//       setErrors({});
//     }
//   };

//   return (
//     <div className="register-page">
//       <div className="register-container">
//         <h2 className="register-title">Client Registration</h2>
//         <form onSubmit={handleSubmit}>
//           {/* First Name */}
//           <div className="form-group">
//             <label htmlFor="firstName">First Name</label>
//             <input
//               type="text"
//               id="firstName"
//               name="firstName"
//               value={formData.firstName}
//               onChange={handleChange}
//               className={errors.firstName ? "error" : ""}
//               required
//             />
//             {errors.firstName && (
//               <p className="error-message">{errors.firstName}</p>
//             )}
//           </div>

//           {/* Last Name */}
//           <div className="form-group">
//             <label htmlFor="lastName">Last Name</label>
//             <input
//               type="text"
//               id="lastName"
//               name="lastName"
//               value={formData.lastName}
//               onChange={handleChange}
//               className={errors.lastName ? "error" : ""}
//               required
//             />
//             {errors.lastName && (
//               <p className="error-message">{errors.lastName}</p>
//             )}
//           </div>

//           {/* Email */}
//           <div className="form-group">
//             <label htmlFor="email">Email</label>
//             <input
//               type="email"
//               id="email"
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               className={errors.email ? "error" : ""}
//               required
//             />
//             {errors.email && <p className="error-message">{errors.email}</p>}
//           </div>

//           {/* Phone */}
//           <div className="form-group">
//             <label htmlFor="phone">Phone</label>
//             <input
//               type="tel"
//               id="phone"
//               name="phone"
//               value={formData.phone}
//               onChange={handleChange}
//               className={errors.phone ? "error" : ""}
//               required
//             />
//             {errors.phone && <p className="error-message">{errors.phone}</p>}
//           </div>

//           {/* Password */}
//           <div className="form-group">
//             <label htmlFor="password">Password</label>
//             <input
//               type="password"
//               id="password"
//               name="password"
//               value={formData.password}
//               onChange={handleChange}
//               className={errors.password ? "error" : ""}
//               required
//             />
//             {errors.password && (
//               <p className="error-message">{errors.password}</p>
//             )}
//           </div>

//           {/* Confirm Password */}
//           <div className="form-group">
//             <label htmlFor="confirmPassword">Confirm Password</label>
//             <input
//               type="password"
//               id="confirmPassword"
//               name="confirmPassword"
//               value={formData.confirmPassword}
//               onChange={handleChange}
//               className={errors.confirmPassword ? "error" : ""}
//               required
//             />
//             {errors.confirmPassword && (
//               <p className="error-message">{errors.confirmPassword}</p>
//             )}
//           </div>

//           <button type="submit" className="btn-register">
//             Register
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default Register;
// import React, { useState } from "react";
// import { Link } from "react-router-dom";

// const Register = () => {
//   const [formData, setFormData] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     phone: "",
//     password: "",
//   });
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(""); // Reset error state

//     try {
//       const response = await fetch("/auth/register", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(formData),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || "Failed to register");
//       }

//       // Handle successful registration (e.g., redirect to login)
//       console.log("Registration successful");
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={styles.registerPage}>
//       <div style={styles.registerContainer}>
//         <h2 style={styles.registerTitle}>Client Register</h2>
//         <form onSubmit={handleSubmit}>
//           <div style={styles.formGroup}>
//             <label htmlFor="firstName" style={styles.formLabel}>
//               First Name
//             </label>
//             <input
//               type="text"
//               id="firstName"
//               name="firstName"
//               value={formData.firstName}
//               onChange={handleChange}
//               required
//               style={styles.formInput}
//             />
//           </div>

//           <div style={styles.formGroup}>
//             <label htmlFor="lastName" style={styles.formLabel}>
//               Last Name
//             </label>
//             <input
//               type="text"
//               id="lastName"
//               name="lastName"
//               value={formData.lastName}
//               onChange={handleChange}
//               required
//               style={styles.formInput}
//             />
//           </div>

//           <div style={styles.formGroup}>
//             <label htmlFor="email" style={styles.formLabel}>
//               Email
//             </label>
//             <input
//               type="email"
//               id="email"
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               required
//               style={styles.formInput}
//             />
//           </div>

//           <div style={styles.formGroup}>
//             <label htmlFor="phone" style={styles.formLabel}>
//               Phone
//             </label>
//             <input
//               type="text"
//               id="phone"
//               name="phone"
//               value={formData.phone}
//               onChange={handleChange}
//               required
//               style={styles.formInput}
//             />
//           </div>

//           <div style={styles.formGroup}>
//             <label htmlFor="password" style={styles.formLabel}>
//               Password
//             </label>
//             <input
//               type="password"
//               id="password"
//               name="password"
//               value={formData.password}
//               onChange={handleChange}
//               required
//               style={styles.formInput}
//             />
//           </div>

//           <button type="submit" style={styles.btnRegister} disabled={loading}>
//             {loading ? "Registering..." : "Register"}
//           </button>

//           {error && <p style={styles.errorMessage}>{error}</p>}

//           <div style={styles.formOptions}>
//             <Link to="/login" style={styles.centeredLink}>
//               Already have an account? Login
//             </Link>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// // Updated Inline Styles with Background Image
// const styles = {
//   registerPage: {
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     minHeight: "100vh",
//     backgroundImage: "url('/assets/registerpic.jpg')", // Path to your background image
//     backgroundSize: "cover", // Make the image cover the whole page
//     backgroundPosition: "center", // Center the image
//   },
//   registerContainer: {
//     backgroundColor: "rgba(255, 255, 255, 0.6)", // Add transparency for a sleek look
//     padding: "2rem",
//     borderRadius: "12px",
//     boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
//     maxWidth: "420px",
//     width: "100%",
//   },
//   registerTitle: {
//     textAlign: "center",
//     color: "#2d6da5",
//     fontSize: "1.8rem",
//     fontWeight: "bold",
//     marginBottom: "1.5rem",
//   },
//   formGroup: {
//     marginBottom: "1.5rem",
//   },
//   formLabel: {
//     display: "block",
//     fontSize: "1rem",
//     fontWeight: "500",
//     marginBottom: "0.5rem",
//     color: "#333",
//   },
//   formInput: {
//     width: "100%",
//     padding: "0.9rem",
//     border: "1px solid #c2b697",
//     borderRadius: "6px",
//     fontSize: "1rem",
//     backgroundColor: "#f9f9f9",
//     transition: "border-color 0.3s ease",
//   },
//   errorMessage: {
//     color: "red",
//     fontSize: "0.85rem",
//     marginTop: "0.5rem",
//   },
//   btnRegister: {
//     display: "block",
//     width: "100%",
//     padding: "0.9rem",
//     backgroundColor: "#2d6da5",
//     color: "#fff",
//     border: "none",
//     borderRadius: "6px",
//     fontSize: "1rem",
//     fontWeight: "500",
//     cursor: "pointer",
//     transition: "background-color 0.3s ease",
//   },
//   formOptions: {
//     textAlign: "center",
//     marginTop: "1.5rem",
//   },
//   centeredLink: {
//     textDecoration: "none",
//     color: "#2d6da5",
//     fontWeight: "500",
//     fontSize: "0.95rem",
//   },
// };

// export default Register;

import React, { useState } from "react";
import { Link } from "react-router-dom";
// Import FontAwesome icons (make sure you have FontAwesome installed: npm install @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons)
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Password visibility state

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "firstName":
      case "lastName":
        if (!/^[a-zA-Z]+$/.test(value)) {
          error = `${name === "firstName" ? "First" : "Last"} name should contain only alphabets.`;
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
        } else if (/^(\d)\1+$/.test(value)) {
          error = "Phone number cannot contain the same digit repeated.";
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
      const response = await fetch("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to register");
      }

      console.log("Registration successful");
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div style={styles.registerPage}>
      <div style={styles.registerContainer}>
        <h2 style={styles.registerTitle}>Client Register</h2>
        <form onSubmit={handleSubmit}>
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
            {errors.firstName && <p style={styles.errorMessage}>{errors.firstName}</p>}
          </div>

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
            {errors.lastName && <p style={styles.errorMessage}>{errors.lastName}</p>}
          </div>

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

          <div style={styles.formGroup}>
            <label htmlFor="phone" style={styles.formLabel}>
              Phone
            </label>
            <input
              type="text"
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
              <span onClick={togglePasswordVisibility} style={styles.passwordToggleIcon}>
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </span>
            </div>
            {errors.password && <p style={styles.errorMessage}>{errors.password}</p>}
          </div>

          <button
            type="submit"
            style={styles.btnRegister}
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>

          {errors.submit && <p style={styles.errorMessage}>{errors.submit}</p>}

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
  registerContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    maxWidth: "420px",
    width: "100%",
  },
  registerTitle: {
    textAlign: "center",
    color: "#2d6da5",
    fontSize: "1.8rem",
    fontWeight: "bold",
    marginBottom: "1.5rem",
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
    backgroundColor: "white",
    padding: "5px",
    borderRadius: "50%",
    fontSize: "1.2rem",
    color: "#333",
    boxShadow: "0 0 4px rgba(0, 0, 0, 0.2)",
  },
  errorMessage: {
    color: "red",
    fontSize: "0.85rem",
    marginTop: "0.5rem",
  },
  btnRegister: {
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
    transition: "background-color 0.3s ease",
  },
  formOptions: {
    textAlign: "center",
    marginTop: "1.5rem",
  },
  centeredLink: {
    textDecoration: "none",
    color: "#2d6da5",
    fontWeight: "500",
    fontSize: "0.95rem",
  },
};

export default Register;

