import React, { useState, useEffect } from "react";
import Footer from "../../components/footer/footer-lawyer";
import Navbar from "../../components/navbar/navbar-lawyer";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaSearch,
  FaBook,
  FaGavel,
  FaBalanceScale,
  FaScroll,
} from "react-icons/fa";
import { useLocation } from 'react-router-dom';
import LawyerIconPanel from '../../components/LawyerIconPanel';

const sectionTitles = {
  420: "Dishonesty and Cheating",
  // Add more mappings for other sections as needed
};

const IPCSection = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(
    location.state?.initialSearchTerm || ""
  );
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sectionTitle, setSectionTitle] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem('lawyerRecentIPCSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      handleSearch();
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const updateRecentSearches = (term) => {
    const updatedSearches = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem('lawyerRecentIPCSearches', JSON.stringify(updatedSearches));
  };

  const handleSearch = () => {
    if (!searchTerm) {
      console.error("Search term is empty. Please enter a valid term.");
      return;
    }

    const searchQuery = `IPC Section ${searchTerm}`;
    console.log("Searching for:", searchQuery);
    updateRecentSearches(searchTerm);
    fetchIpcSections(searchQuery);
  };

  const fetchIpcSections = async (searchQuery) => {
    try {
      setLoading(true);
      // Fetch section title and details
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
          const snippet = titleData.webPages.value[0].snippet;
          const sectionMatch = snippet.match(/Section\s+(\d+)/i);
          const sectionNumber = sectionMatch ? sectionMatch[1] : "";
          setSectionTitle(snippet);
          setSearchTerm(sectionNumber);
        }
      }

      // Fetch case studies
      const response = await fetch(
        `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(
          searchQuery + " case study judgement supreme court high court"
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
      }
    } catch (error) {
      console.error("Error fetching IPC sections:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.autoSearch && location.state?.initialSearchTerm) {
      window.history.replaceState({}, document.title);
      const searchQuery = `IPC Section ${location.state.initialSearchTerm}`;
      fetchIpcSections(searchQuery);
    }
  }, [location.state]);

  return (
    <div className="page-container">
      <Navbar />
      <LawyerIconPanel />
      <div className="main-content">
        <div className="bg-legal">
          <div className="container py-5">
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="hero-section text-center mb-5">
                  <div className="icon-wrapper mb-4">
                    <FaBalanceScale className="display-1 text-primary" />
                  </div>
                  <h1 className="display-4 fw-bold text-dark mb-3">
                    IPC Section Search
                  </h1>
                  <p className="lead text-muted">
                    Search and analyze Indian Penal Code sections with case law references
                  </p>
                </div>

                <div className="search-section bg-white p-4 rounded shadow-sm">
                  <div className="input-group mb-3">
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="Enter IPC section number or keywords..."
                      value={searchTerm}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                    />
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleSearch}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="spinner-border spinner-border-sm me-2" />
                      ) : (
                        <FaSearch className="me-2" />
                      )}
                      Search
                    </button>
                  </div>

                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="recent-searches mt-3">
                      <small className="text-muted">Recent searches: </small>
                      {recentSearches.map((term, index) => (
                        <button
                          key={index}
                          className="btn btn-sm btn-outline-secondary me-2 mb-2"
                          onClick={() => {
                            setSearchTerm(term);
                            fetchIpcSections(`IPC Section ${term}`);
                          }}
                        >
                          Section {term}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search Results */}
                {loading && (
                  <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )}

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

                    {/* Results Cards */}
                    <div className="row g-4">
                      {results.map((item, index) => (
                        <div key={index} className="col-12 mb-4">
                          <div className="card shadow-sm">
                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                  <span className="badge bg-primary me-2">
                                    IPC Section {searchTerm}
                                  </span>
                                  <span className="badge bg-secondary">
                                    {new Date(item.caseStudy?.datePublished).getFullYear() || "Year N/A"}
                                  </span>
                                </div>
                              </div>

                              <p className="card-text">{item.description}</p>

                              {/* Case Study Section */}
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
                                          {new Date(item.caseStudy.datePublished).toLocaleDateString()}
                                        </small>
                                        <small className="text-muted d-block mb-1">
                                          <strong>Court:</strong>{" "}
                                          {item.caseStudy.title.split(" vs ")[0]}
                                        </small>
                                        <small className="text-muted d-block">
                                          <strong>Parties:</strong>{" "}
                                          {item.caseStudy.title.includes(" vs ")
                                            ? item.caseStudy.title.split(" vs ").join(" vs. ")
                                            : "Details not available"}
                                        </small>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="case-study-content">
                                    <h6 className="mb-2 text-secondary">Case Summary</h6>
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
        }

        .main-content {
          padding: 20px;
          margin-left: 60px;
        }

        .bg-legal {
          background: #f8f9fa;
          min-height: 100vh;
        }

        .search-section {
          background: #ffffff;
          border-radius: 15px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .section-number {
          font-size: 1.5rem;
          font-weight: bold;
          color: #1a237e;
          margin-bottom: 0.5rem;
        }

        .section-description {
          color: #424242;
          font-size: 1.1rem;
          line-height: 1.6;
        }

        .case-study-section {
          border-top: 1px solid #e0e0e0;
          padding-top: 1.5rem;
        }

        .case-info {
          border-left: 4px solid #1976d2;
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
            padding: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default IPCSection; 