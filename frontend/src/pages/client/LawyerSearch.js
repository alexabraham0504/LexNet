import React, { useState } from "react";

const LawyerSearch = () => {
  const [searchFilters, setSearchFilters] = useState({
    expertise: "",
    location: "",
    fees: "",
    availability: "",
    reviews: "",
  });

  const [lawyers, setLawyers] = useState([
    {
      id: 1,
      name: "John Doe",
      expertise: "Family Law",
      location: "New York",
      fees: "$200/hr",
      availability: "Available",
      reviews: 4.5,
    },
    {
      id: 2,
      name: "Jane Smith",
      expertise: "Corporate Law",
      location: "California",
      fees: "$300/hr",
      availability: "Busy",
      reviews: 4.8,
    },
    {
      id: 3,
      name: "Michael Johnson",
      expertise: "Criminal Law",
      location: "Texas",
      fees: "$250/hr",
      availability: "Available",
      reviews: 4.2,
    },
    // Add more lawyer profiles as needed
  ]);

  const [filteredLawyers, setFilteredLawyers] = useState(lawyers);
  const [shortlistedLawyers, setShortlistedLawyers] = useState([]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters({
      ...searchFilters,
      [name]: value,
    });
  };

  const applyFilters = () => {
    const filtered = lawyers.filter((lawyer) => {
      return (
        (searchFilters.expertise ? lawyer.expertise.includes(searchFilters.expertise) : true) &&
        (searchFilters.location ? lawyer.location.includes(searchFilters.location) : true) &&
        (searchFilters.fees ? lawyer.fees === searchFilters.fees : true) &&
        (searchFilters.availability ? lawyer.availability === searchFilters.availability : true) &&
        (searchFilters.reviews ? lawyer.reviews >= parseFloat(searchFilters.reviews) : true)
      );
    });
    setFilteredLawyers(filtered);
  };

  const handleShortlist = (lawyer) => {
    if (!shortlistedLawyers.includes(lawyer)) {
      setShortlistedLawyers([...shortlistedLawyers, lawyer]);
    }
  };

  return (
    <div style={styles.searchContainer}>
      <h2 style={styles.header}>Find a Lawyer</h2>
      <div style={styles.filtersContainer}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Expertise</label>
          <input
            type="text"
            name="expertise"
            value={searchFilters.expertise}
            onChange={handleFilterChange}
            placeholder="e.g. Family Law"
            style={styles.input}
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Location</label>
          <input
            type="text"
            name="location"
            value={searchFilters.location}
            onChange={handleFilterChange}
            placeholder="e.g. New York"
            style={styles.input}
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Fees</label>
          <input
            type="text"
            name="fees"
            value={searchFilters.fees}
            onChange={handleFilterChange}
            placeholder="e.g. $200/hr"
            style={styles.input}
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Availability</label>
          <input
            type="text"
            name="availability"
            value={searchFilters.availability}
            onChange={handleFilterChange}
            placeholder="e.g. Available"
            style={styles.input}
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Reviews</label>
          <input
            type="number"
            name="reviews"
            value={searchFilters.reviews}
            onChange={handleFilterChange}
            placeholder="e.g. 4.5"
            style={styles.input}
          />
        </div>
        <button onClick={applyFilters} style={styles.button}>
          Apply Filters
        </button>
      </div>

      <div style={styles.resultsContainer}>
        <h3 style={styles.resultsHeader}>Search Results</h3>
        {filteredLawyers.length > 0 ? (
          filteredLawyers.map((lawyer) => (
            <div key={lawyer.id} style={styles.lawyerCard}>
              <h4 style={styles.lawyerName}>{lawyer.name}</h4>
              <p style={styles.lawyerInfo}>
                Expertise: {lawyer.expertise}
                <br />
                Location: {lawyer.location}
                <br />
                Fees: {lawyer.fees}
                <br />
                Availability: {lawyer.availability}
                <br />
                Reviews: {lawyer.reviews} ⭐
              </p>
              <button
                onClick={() => handleShortlist(lawyer)}
                style={styles.shortlistButton}
              >
                Shortlist
              </button>
            </div>
          ))
        ) : (
          <p style={styles.noResults}>No lawyers found. Please adjust your filters.</p>
        )}
      </div>

      {shortlistedLawyers.length > 0 && (
        <div style={styles.shortlistContainer}>
          <h3 style={styles.shortlistHeader}>Shortlisted Lawyers</h3>
          {shortlistedLawyers.map((lawyer) => (
            <div key={lawyer.id} style={styles.lawyerCard}>
              <h4 style={styles.lawyerName}>{lawyer.name}</h4>
              <p style={styles.lawyerInfo}>
                Expertise: {lawyer.expertise}
                <br />
                Location: {lawyer.location}
                <br />
                Fees: {lawyer.fees}
                <br />
                Availability: {lawyer.availability}
                <br />
                Reviews: {lawyer.reviews} ⭐
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Styles
const styles = {
  searchContainer: {
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    fontSize: "24px",
    marginBottom: "20px",
    color: "#2d6da5",
  },
  filtersContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "15px",
    marginBottom: "20px",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    marginBottom: "5px",
    fontWeight: "bold",
    color: "#333",
  },
  input: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    width: "100%",
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#2d6da5",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    gridColumn: "span 5",
    marginTop: "10px",
  },
  resultsContainer: {
    marginTop: "30px",
  },
  resultsHeader: {
    fontSize: "20px",
    marginBottom: "15px",
    color: "#333",
  },
  lawyerCard: {
    border: "1px solid #ccc",
    borderRadius: "6px",
    padding: "15px",
    marginBottom: "15px",
  },
  lawyerName: {
    fontSize: "18px",
    marginBottom: "10px",
    color: "#2d6da5",
  },
  lawyerInfo: {
    marginBottom: "10px",
    color: "#555",
  },
  shortlistButton: {
    padding: "8px 16px",
    backgroundColor: "#f39c12",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  noResults: {
    color: "#e74c3c",
    textAlign: "center",
  },
  shortlistContainer: {
    marginTop: "40px",
  },
  shortlistHeader: {
    fontSize: "20px",
    marginBottom: "15px",
    color: "#333",
  },
};

export default LawyerSearch;
