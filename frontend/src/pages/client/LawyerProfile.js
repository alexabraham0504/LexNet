import React from "react";

const LawyerProfile = ({ lawyer, onMessageClick, onScheduleClick }) => {
  return (
    <div style={styles.profileContainer}>
      <h2 style={styles.header}>{lawyer.name}</h2>
      <div style={styles.detailsContainer}>
        <div style={styles.detail}>
          <h3 style={styles.subHeader}>Expertise</h3>
          <p style={styles.text}>{lawyer.expertise}</p>
        </div>
        <div style={styles.detail}>
          <h3 style={styles.subHeader}>Qualifications</h3>
          <p style={styles.text}>{lawyer.qualifications}</p>
        </div>
        <div style={styles.detail}>
          <h3 style={styles.subHeader}>Years of Experience</h3>
          <p style={styles.text}>{lawyer.yearsOfExperience}</p>
        </div>
        <div style={styles.detail}>
          <h3 style={styles.subHeader}>Availability</h3>
          <p style={styles.text}>{lawyer.availability}</p>
        </div>
        <div style={styles.detail}>
          <h3 style={styles.subHeader}>Client Reviews</h3>
          <p style={styles.text}>
            {lawyer.reviews.map((review, index) => (
              <div key={index}>
                <strong>{review.clientName}:</strong> {review.comment} ⭐{review.rating}
              </div>
            ))}
          </p>
        </div>
      </div>
      <div style={styles.buttonContainer}>
        <button onClick={onMessageClick} style={styles.button}>
          Message Lawyer
        </button>
        <button onClick={onScheduleClick} style={styles.button}>
          Schedule Appointment
        </button>
      </div>
    </div>
  );
};

// Sample Lawyer Data
const sampleLawyer = {
  name: "John Doe",
  expertise: "Family Law",
  qualifications: "JD from Harvard Law School",
  yearsOfExperience: 10,
  availability: "Mon-Fri, 9 AM - 5 PM",
  reviews: [
    { clientName: "Alice", comment: "Very helpful!", rating: 5 },
    { clientName: "Bob", comment: "Great experience.", rating: 4 },
  ],
};

// Styles
const styles = {
  profileContainer: {
    padding: "20px",
    maxWidth: "800px",
    margin: "0 auto",
    border: "1px solid #ccc",
    borderRadius: "6px",
    backgroundColor: "#f9f9f9",
  },
  header: {
    textAlign: "center",
    fontSize: "28px",
    marginBottom: "20px",
    color: "#2d6da5",
  },
  detailsContainer: {
    marginBottom: "20px",
  },
  detail: {
    marginBottom: "15px",
  },
  subHeader: {
    fontSize: "20px",
    marginBottom: "5px",
    color: "#333",
  },
  text: {
    margin: "0",
    color: "#555",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-between",
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#2d6da5",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    flex: "1",
    margin: "0 10px",
  },
};

const App = () => {
  const handleMessageClick = () => {
    alert("Message functionality not implemented yet.");
  };

  const handleScheduleClick = () => {
    alert("Scheduling functionality not implemented yet.");
  };

  return <LawyerProfile lawyer={sampleLawyer} onMessageClick={handleMessageClick} onScheduleClick={handleScheduleClick} />;
};

export default App;
