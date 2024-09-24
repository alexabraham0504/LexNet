import React, { useState } from "react";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  // Form field validation logic
  const validateForm = () => {
    let newErrors = {};

    // First Name validation: only alphabets
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (!/^[A-Za-z]+$/.test(formData.firstName)) {
      newErrors.firstName = "First name must contain only alphabets";
    }

    // Last Name validation: only alphabets
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (!/^[A-Za-z]+$/.test(formData.lastName)) {
      newErrors.lastName = "Last name must contain only alphabets";
    }

    // Email validation with enhanced regex for standard email format
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation: must be 10 digits
    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone number must be a 10-digit number";
    }

    // Password validation: combination of letters, numbers, special characters, min 4 max 10
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{4,10}$/.test(formData.password)) {
      newErrors.password =
        "Password must be 4-10 characters long and include letters, numbers, and special characters";
    }

    // Confirm Password validation: must match password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
    } else {
      // Form submission logic goes here (e.g., API call)
      console.log("Form submitted", formData);
      setErrors({});
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <h2 className="register-title">Client Registration</h2>
        <form onSubmit={handleSubmit}>
          {/* First Name */}
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={errors.firstName ? "error" : ""}
              required
            />
            {errors.firstName && (
              <p className="error-message">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={errors.lastName ? "error" : ""}
              required
            />
            {errors.lastName && (
              <p className="error-message">{errors.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "error" : ""}
              required
            />
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? "error" : ""}
              required
            />
            {errors.phone && <p className="error-message">{errors.phone}</p>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? "error" : ""}
              required
            />
            {errors.password && (
              <p className="error-message">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? "error" : ""}
              required
            />
            {errors.confirmPassword && (
              <p className="error-message">{errors.confirmPassword}</p>
            )}
          </div>

          <button type="submit" className="btn-register">
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
