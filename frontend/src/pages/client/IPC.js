import React, { useState, useEffect } from "react";
import Footer from "../../components/footer/footer-admin";
import Navbar from "../../components/navbar/navbar-client";
import ClientSidebar from '../../components/sidebar/ClientSidebar';
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaSearch,
  FaBook,
  FaGavel,
  FaBalanceScale,
  FaScroll,
} from "react-icons/fa";
import { useLocation } from 'react-router-dom';

const sectionTitles = {
  420: "Dishonesty and Cheating",
  // Add more mappings for other sections as needed
};

const IPC = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(
    location.state?.initialSearchTerm || ""
  );
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sectionTitle, setSectionTitle] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      handleSearch();
    }
  };

  const handleInputChange = (e) => {
    // Remove number-only restriction
    setSearchTerm(e.target.value);
  };

  const handleSearch = () => {
    if (!searchTerm) {
      console.error("Search term is empty. Please enter a valid term.");
      return;
    }

    // Add "IPC Section" before the number when searching
    const searchQuery = `IPC Section ${searchTerm}`;
    console.log("Searching for:", searchQuery);

    fetchIpcSections(searchQuery);
  };

  const fetchIpcSections = async (searchQuery) => {
    try {
      setLoading(true);
      // Modify search query to find IPC sections related to the keyword
      const titleResponse = await fetch(
        `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(
          "IPC Section related to " + searchTerm
        )}`,
        {
          method: "GET",
          headers: {
            "Ocp-Apim-Subscription-Key": "21f82301b9544a57bd153b1b4d7f3a03",
          },
        }
      );

      if (titleResponse.ok) {
        const titleData = await titleResponse.json();
        if (titleData.webPages?.value?.[0]) {
          // Extract section number and title from the search result
          const snippet = titleData.webPages.value[0].snippet;
          const sectionMatch = snippet.match(/Section\s+(\d+)/i);
          const sectionNumber = sectionMatch ? sectionMatch[1] : "";
          setSectionTitle(snippet);
          setSearchTerm(sectionNumber); // Update searchTerm with found section number
        }
      }

      // Existing case studies fetch
      const response = await fetch(
        `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(
          searchQuery + " case study judgement"
        )}`,
        {
          method: "GET",
          headers: {
            "Ocp-Apim-Subscription-Key": "21f82301b9544a57bd153b1b4d7f3a03",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.webPages && data.webPages.value) {
        const results = data.webPages.value.map((item) => ({
          section: item.name,
          description: item.snippet,
          caseStudy: {
            title: item.name,
            summary: item.snippet,
            url: item.url,
            datePublished: item.datePublished || "N/A",
          },
        }));
        setResults(results);
      } else {
        console.error("Unexpected response structure:", data);
      }
    } catch (error) {
      console.error("Error fetching IPC sections:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.autoSearch && location.state?.initialSearchTerm) {
      // Clear the location state to prevent re-searching on page refresh
      window.history.replaceState({}, document.title);
      // Perform the search
      const searchQuery = `IPC Section ${location.state.initialSearchTerm}`;
      fetchIpcSections(searchQuery);
    }
  }, [location.state]);

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      .bg-legal {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        min-height: 100vh;
      }

      .hero-section {
        padding: 3rem 0;
      }

      .animate-icon {
        animation: float 3s ease-in-out infinite;
        color: #4a90e2;
      }

      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }

      .search-input {
        border: 2px solid #e9ecef;
        padding: 1.5rem 1rem;
        font-size: 1.1rem;
        transition: all 0.3s ease;
      }

      .search-input:focus {
        border-color: #4a90e2;
        box-shadow: 0 0 0 0.25rem rgba(74, 144, 226, 0.25);
      }

      .result-card {
        transition: all 0.3s ease;
        border-radius: 1rem;
        overflow: hidden;
      }

      .result-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 1rem 3rem rgba(0,0,0,.175)!important;
      }

      .case-study-section {
        background: rgba(74, 144, 226, 0.05);
        padding: 1.5rem;
        border-radius: 0.5rem;
        border-left: 4px solid #4a90e2;
      }

      .badge {
        padding: 0.5em 1em;
        font-weight: 500;
      }

      .search-card {
        position: relative;
        z-index: 1;
      }

      .search-card::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(74, 144, 226, 0.2), transparent);
        z-index: -1;
      }

      .btn-primary {
        background-color: #4a90e2;
        border-color: #4a90e2;
        padding: 0.75rem 1.5rem;
        font-weight: 500;
        transition: all 0.3s ease;
      }

      .btn-primary:hover {
        background-color: #357abd;
        border-color: #357abd;
        transform: translateY(-2px);
      }

      .section-header {
        position: relative;
        padding-bottom: 1rem;
        border-bottom: 2px solid #e9ecef;
      }

      .text-primary {
        color: #4a90e2 !important;
      }

      .section-title {
        font-family: 'Times New Roman', Times, serif;
        border-bottom: 2px solid #4a90e2;
        padding-bottom: 1rem;
        margin-bottom: 2rem;
      }

      .section-number {
        font-size: 1.5rem;
        font-weight: bold;
        color: #2c3e50;
        text-transform: uppercase;
        margin-bottom: 0.5rem;
      }

      .section-description {
        font-size: 1.25rem;
        color: #4a90e2;
        font-style: italic;
      }

      .results-section {
        background: #fff;
        padding: 2rem;
        border-radius: 1rem;
        box-shadow: 0 0 20px rgba(0,0,0,0.05);
      }
    `;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return (
    <div className="page-container">
      <Navbar />
      <ClientSidebar onToggle={setIsSidebarCollapsed} />
      <div className={`main-content ${isSidebarCollapsed ? '' : 'sidebar-expanded'}`}>
        <div className="bg-legal">
          <AnimatedBackground />
          <div className="container py-5">
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="hero-section text-center mb-5">
                  <div className="icon-wrapper mb-4">
                    <FaBalanceScale className="display-1 text-primary animate-icon" />
                  </div>
                  <h1 className="display-4 fw-bold text-dark mb-3">
                    IPC Section Lookup
                  </h1>
                  <p className="lead text-muted">
                    Search through Indian Penal Code sections
                  </p>
                </div>

                <div className="search-card">
                  <div className="card border-0 shadow-lg">
                    <div className="card-body p-4">
                      <div className="input-group input-group-lg">
                        <input
                          type="text"
                          className="form-control search-input"
                          placeholder="Search by keywords (e.g., murder, theft, cheating)..."
                          value={searchTerm}
                          onChange={handleInputChange}
                          onKeyPress={handleKeyPress}
                        />
                        <button
                          className="btn btn-primary px-4"
                          onClick={handleSearch}
                          disabled={loading}
                        >
                          {loading ? (
                            <span className="spinner-border spinner-border-sm me-2" />
                          ) : (
                            <FaSearch className="me-2" />
                          )}
                          {loading ? "Searching..." : "Search"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {results.length > 0 && (
                  <div className="results-section mt-5">
                    <div className="section-header d-flex align-items-center mb-4">
                      <FaBook className="text-primary me-3" size={24} />
                      <h2 className="h3 mb-0">Search Results</h2>
                    </div>
                    <div className="section-title">
                      <div className="section-number">SECTION {searchTerm} IPC</div>
                      <div className="section-description">
                        {sectionTitle || "Loading..."}
                      </div>
                    </div>
                    <div className="row g-4">
                      {results.map((item, index) => (
                        <div key={index} className="col-12 mb-4">
                          <div className="result-card card shadow-sm">
                            <div className="card-body">
                              <div className="case-header border-bottom pb-3 mb-3">
                                <h5 className="card-title text-primary mb-2">
                                  {item.section}
                                </h5>
                                <div className="case-meta">
                                  <span className="badge bg-primary me-2">
                                    IPC Section {searchTerm}
                                  </span>
                                  <span className="badge bg-secondary">
                                    {new Date(
                                      item.caseStudy?.datePublished
                                    ).getFullYear() || "Year N/A"}
                                  </span>
                                </div>
                              </div>

                              <p className="card-text">{item.description}</p>

                              {item.caseStudy && (
                                <div className="case-study-section mt-4">
                                  <div className="case-study-header mb-3">
                                    <div className="d-flex align-items-center mb-2">
                                      <FaGavel className="text-primary me-2" />
                                      <h6 className="mb-0 fw-bold">Case Details</h6>
                                    </div>
                                    <div className="case-info bg-light p-3 rounded">
                                      <h6 className="text-primary mb-2">
                                        {item.caseStudy.title}
                                      </h6>
                                      <div className="case-meta-details">
                                        <small className="text-muted d-block mb-1">
                                          <strong>Date of Judgment:</strong>{" "}
                                          {new Date(
                                            item.caseStudy.datePublished
                                          ).toLocaleDateString()}
                                        </small>
                                        <small className="text-muted d-block mb-1">
                                          <strong>Court:</strong>{" "}
                                          {item.caseStudy.title.split(" vs ")[0]}
                                        </small>
                                        <small className="text-muted d-block">
                                          <strong>Parties:</strong>{" "}
                                          {item.caseStudy.title.includes(" vs ")
                                            ? item.caseStudy.title
                                                .split(" vs ")
                                                .join(" vs. ")
                                            : "Details not available"}
                                        </small>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="case-study-content">
                                    <h6 className="mb-2 text-secondary">
                                      Case Summary
                                    </h6>
                                    <p className="mb-3">{item.caseStudy.summary}</p>
                                    <div className="text-end">
                                      <a
                                        href={item.caseStudy.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-outline-primary btn-sm"
                                      >
                                        <FaScroll className="me-2" />
                                        Read Full Judgment
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      <style jsx="true">{`
        .page-container {
          min-height: 100vh;
          position: relative;
          width: 100%;
        }

        .main-content {
          padding: 20px;
          width: 100%;
          margin-left: 0;
          transition: margin-left 0.3s ease;
        }

        .main-content.sidebar-expanded {
          margin-left: 280px;
        }

        .bg-legal {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          min-height: 100vh;
        }

        @media (max-width: 768px) {
          .main-content.sidebar-expanded {
            margin-left: 240px;
          }
        }

        /* ... rest of your existing styles ... */
      `}</style>
    </div>
  );
};

const AnimatedBackground = () => {
  useEffect(() => {
    const container = document.querySelector(".animated-background");
    const symbols = ["§", "⚖️", "📜", "⚡", "👨‍⚖️"];

    const createSymbol = () => {
      const symbol = document.createElement("div");
      symbol.className = "legal-symbol";
      symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      symbol.style.left = `${Math.random() * 100}%`;
      symbol.style.fontSize = `${Math.random() * 20 + 10}px`;
      symbol.style.animationDuration = `${Math.random() * 10 + 5}s`;
      symbol.style.animationIterationCount = "infinite";
      symbol.style.position = "absolute";
      container.appendChild(symbol);
    };

    for (let i = 0; i < 100; i++) {
      createSymbol();
    }
  }, []);

  return <div className="animated-background"></div>;
};

export default IPC;
