import React, { useState } from "react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logic to handle password reset request goes here
    console.log("Forgot password submitted for", email);
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <h2 className="forgot-password-title">Forgot Password</h2>
        <p className="forgot-password-instructions">
          Enter your email address below, and we will send you instructions to reset your password.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn-reset-password">
            Send Reset Instructions
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
