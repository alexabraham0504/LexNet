import React from "react";

function VerifyYourEmail() {
  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "20px",
      textAlign: "center",
      backgroundColor: "#f5f5f5"
    },
    title: {
      color: "#333",
      marginBottom: "20px"
    },
    message: {
      color: "#666",
      maxWidth: "600px",
      lineHeight: "1.6"
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Verify Your Email</h2>
      <p style={styles.message}>
        We've sent a verification link to your email address. 
        Please check your inbox and click the link to activate your account. 
        If you don't see the email, please check your spam folder.
      </p>
    </div>
  );
}

export default VerifyYourEmail;
