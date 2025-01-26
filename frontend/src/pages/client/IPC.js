import React, { useState, useEffect } from "react";
import Footer from "../../components/footer/footer-admin";
import Navbar from "../../components/navbar/navbar-client";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaSearch,
  FaBook,
  FaGavel,
  FaBalanceScale,
  FaScroll,
} from "react-icons/fa";

const IPC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIpcSections();
  }, []);

  const fetchIpcSections = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/ipc");
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error fetching IPC sections:", error);
    }
  };

  const handleSearch = () => {
    if (!searchTerm) return;
    const filteredResults = results.filter(
      (item) =>
        item.section.includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setResults(filteredResults);
  };

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
    `;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return (
    <div className="bg-legal">
      <AnimatedBackground />
      <Navbar />
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
                      placeholder="Enter IPC section or keyword..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
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

                <div className="row g-4">
                  {results.map((result, index) => (
                    <div key={index} className="col-12">
                      <div className="card result-card h-100 border-0 shadow-sm">
                        <div className="card-body p-4">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h3 className="h4 text-primary mb-0">
                              <FaGavel className="me-2" />
                              Section {result.section}
                            </h3>
                            <span className="badge bg-primary rounded-pill">
                              IPC
                            </span>
                          </div>
                          <p className="card-text lead mb-4">
                            {result.description}
                          </p>
                          <div className="case-study-section">
                            <div className="d-flex align-items-center mb-2">
                              <FaScroll className="text-muted me-2" />
                              <h4 className="h6 text-muted mb-0">Case Study</h4>
                            </div>
                            <p className="text-muted fst-italic mb-0">
                              {result.caseStudy}
                            </p>
                          </div>
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
      <Footer />
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
