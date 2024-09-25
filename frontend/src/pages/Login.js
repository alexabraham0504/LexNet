// import React, { useState } from "react";
// import { Link } from "react-router-dom";

// const Login = () => {
//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//   });

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
    
//   };

//   return (
//     <div style={styles.loginPage}>
//       <div style={styles.loginContainer}>
//         <h2 style={styles.loginTitle}>Client Login</h2>
//         <form onSubmit={handleSubmit}>
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

//           <button type="submit" style={styles.btnLogin}>
//             Login
//           </button>

//           {/* Centered Sign Up and Forgot Password */}
//           <div style={styles.formOptions}>
//             <Link to="/register" style={styles.centeredLink}>
//               Sign Up
//             </Link>
//             <Link to="/forgotpassword" style={styles.centeredLink}>
//               Forgot Password?
//             </Link>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// // CSS Styles as JS object
// const styles = {
//   loginPage: {
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     minHeight: "100vh",
//     backgroundColor: "#f4f4f4",
//     fontFamily: "'Open Sans', sans-serif",
//   },
//   loginContainer: {
//     backgroundColor: "#fff",
//     padding: "2rem",
//     borderRadius: "8px",
//     boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
//     maxWidth: "400px",
//     width: "100%",
//     textAlign: "center", // Center content inside the container
//   },
//   loginTitle: {
//     color: "#2d6da5",
//     fontSize: "1.5rem",
//     marginBottom: "1.5rem",
//     fontWeight: "bold",
//   },
//   formGroup: {
//     marginBottom: "1rem",
//     textAlign: "left",
//   },
//   formLabel: {
//     display: "block",
//     fontSize: "0.9rem",
//     marginBottom: "0.5rem",
//     color: "#053661",
//   },
//   formInput: {
//     width: "100%",
//     padding: "0.8rem",
//     border: "1px solid #c2b697",
//     borderRadius: "4px",
//     fontSize: "0.9rem",
//     color: "#333",
//   },
//   btnLogin: {
//     display: "block",
//     width: "100%",
//     padding: "0.8rem",
//     backgroundColor: "#2d6da5",
//     color: "#fff",
//     border: "none",
//     borderRadius: "4px",
//     fontSize: "1rem",
//     cursor: "pointer",
//     transition: "background-color 0.3s ease",
//     marginTop: "1.5rem",
//   },
//   formOptions: {
//     marginTop: "2rem", // Add space between form and links
//   },
//   centeredLink: {
//     display: "block",
//     color: "#053661",
//     fontSize: "0.9rem",
//     fontWeight: "600",
//     textDecoration: "none",
//     marginBottom: "0.5rem", // Space between the two links
//     transition: "color 0.3s",
//     textAlign: "center", // Center the link
//   },
// };

// export default Login;


import React, { useState } from "react";
import { Link,useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const navigate=useNavigate();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(""); // Reset error state

    try {
      const response = await axios.post("http://localhost:3000/login",formData);

      const data = await response.data;

      if (data.message === "Login successful.") {
        alert("login success")
       navigate("/")
      }
      else{
        alert("login failed",data.message)
      }

      // Handle successful login (e.g., redirect, save token, etc.)
      // console.log("Login successful");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.loginPage}>
      <div style={styles.loginContainer}>
        <h2 style={styles.loginTitle}>Client Login</h2>
        <form onSubmit={handleSubmit}>
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
              style={styles.formInput}
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
            />
          </div>

          <button type="submit" style={styles.btnLogin} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <div style={styles.formOptions}>
            <Link to="/register" style={styles.centeredLink}>
              Sign Up
            </Link>
            <Link to="/forgotpassword" style={styles.centeredLink}>
              Forgot Password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

// Updated styles
const styles = {
  loginPage: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundImage: "url('/assets/loginpicture.jpg')", // Path to your background image
    backgroundSize: "cover", // Make the image cover the whole page
    backgroundPosition: "center", // Center the image
    fontFamily: "'Open Sans', sans-serif",
  },
  loginContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.6)", // Add transparency for a sleek look
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    maxWidth: "400px",
    width: "100%",
    textAlign: "center", // Center content inside the container
  },
  loginTitle: {
    color: "#2d6da5",
    fontSize: "1.5rem",
    marginBottom: "1.5rem",
    fontWeight: "bold",
  },
  formGroup: {
    marginBottom: "1rem",
    textAlign: "left",
  },
  formLabel: {
    display: "block",
    fontSize: "0.9rem",
    marginBottom: "0.5rem",
    color: "#053661",
  },
  formInput: {
    width: "100%",
    padding: "0.8rem",
    border: "1px solid #c2b697",
    borderRadius: "4px",
    fontSize: "0.9rem",
    color: "#333",
  },
  btnLogin: {
    display: "block",
    width: "100%",
    padding: "0.8rem",
    backgroundColor: "#2d6da5",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    marginTop: "1.5rem",
  },
  formOptions: {
    marginTop: "2rem", // Add space between form and links
  },
  centeredLink: {
    display: "block",
    color: "#053661",
    fontSize: "0.9rem",
    fontWeight: "600",
    textDecoration: "none",
    marginBottom: "0.5rem", // Space between the two links
    transition: "color 0.3s",
    textAlign: "center", // Center the link
  },
};

export default Login;
