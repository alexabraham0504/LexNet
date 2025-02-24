import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Navbar from '../../components/navbar/navbar-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrashRestore, faTrash, faFile, faSync, 
  faExclamationCircle, faImage, faSearch,
  faCalendarAlt, faFilter, faTimes
} from '@fortawesome/free-solid-svg-icons';
import Footer from '../../components/footer/footer-admin';
import ClientSidebar from '../../components/sidebar/ClientSidebar';
import './DeletedCases.css';
import { useNavigate } from 'react-router-dom';

const DeletedCases = () => {
  const [deletedCases, setDeletedCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    caseType: 'all',
    dateRange: 'all',
    status: 'all'
  });
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedCases, setSelectedCases] = useState(new Set());

  const navigate = useNavigate();

  useEffect(() => {
    fetchDeletedCases();
  }, []);

  const fetchDeletedCases = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('http://localhost:5000/api/cases/deleted', {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      console.log('Deleted cases response:', response.data); // Add this for debugging
      setDeletedCases(response.data);
    } catch (error) {
      console.error('Error fetching deleted cases:', error);
      setError('Failed to fetch deleted cases. Please try again later.');
      toast.error('Failed to fetch deleted cases');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreCase = async (caseId) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/cases/${caseId}/restore`,
        {},
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        const restoredCase = response.data.case;
        
        // Create history entry for Case Analysis Dashboard with all required fields
        const analysisEntry = {
          _id: restoredCase._id,
          fileName: restoredCase.title || 'Restored Case',
          dateAnalyzed: new Date(),
          sections: restoredCase.relatedSections?.map(section => ({
            section: section.section,
            description: section.description,
            confidence: section.confidence
          })) || [],
          analysis: {
            text: restoredCase.documents?.[0]?.extractedText || '',
            primaryCrime: restoredCase.crime || 'Not specified',
            // Add these fields to ensure deletability
            result: restoredCase.analysisResults?.result || {},
            crimeTypes: restoredCase.analysisResults?.crimeTypes || []
          },
          documents: restoredCase.documents?.map(doc => ({
            ...doc,
            fileType: doc.fileType || 'text/plain',
            fileName: doc.fileName || 'document.txt'
          })) || [],
          evidenceContext: restoredCase.evidenceContext || [],
          timestamp: new Date().toISOString(),
          // Add these fields to ensure proper restoration
          caseType: restoredCase.caseType || 'other',
          status: 'active',
          clientId: sessionStorage.getItem('userid')
        };

        // Save to analysis results in localStorage
        const existingResults = JSON.parse(localStorage.getItem('analysisResults') || '[]');
        const updatedResults = [analysisEntry, ...existingResults];
        localStorage.setItem('analysisResults', JSON.stringify(updatedResults));

        toast.success('Case restored to Analysis Dashboard');
        fetchDeletedCases();
        
        if (selectedCase?._id === caseId) {
          setSelectedCase(null);
        }
      }
    } catch (error) {
      console.error('Error restoring case:', error);
      toast.error('Failed to restore case');
    }
  };

  const handlePermanentDelete = async (caseId) => {
    if (!window.confirm('This action cannot be undone. Are you sure?')) {
      return;
    }

    try {
      const response = await axios.delete(`http://localhost:5000/api/cases/${caseId}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        toast.success('Case permanently deleted');
        fetchDeletedCases();
      }
    } catch (error) {
      console.error('Error permanently deleting case:', error);
      toast.error('Failed to delete case permanently');
    }
  };

  const handleSelectCase = (caseId) => {
    setSelectedCases(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(caseId)) {
        newSelected.delete(caseId);
      } else {
        newSelected.add(caseId);
      }
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (selectedCases.size === deletedCases.length) {
      setSelectedCases(new Set());
    } else {
      setSelectedCases(new Set(deletedCases.map(c => c._id)));
    }
  };

  const handleBulkRestore = async () => {
    if (selectedCases.size === 0) {
      toast.warning('Please select cases to restore');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to restore ${selectedCases.size} cases?`);
    if (!confirmed) return;

    try {
      const restorePromises = Array.from(selectedCases).map(async (caseId) => {
        const response = await axios.put(
          `http://localhost:5000/api/cases/${caseId}/restore`,
          {},
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem('token')}`
            }
          }
        );

        if (response.data.success) {
          const restoredCase = response.data.case;
          
          // Create analysis entry for each restored case with all required fields
          return {
            _id: restoredCase._id,
            fileName: restoredCase.title || 'Restored Case',
            dateAnalyzed: new Date(),
            sections: restoredCase.relatedSections?.map(section => ({
              section: section.section,
              description: section.description,
              confidence: section.confidence
            })) || [],
            analysis: {
              text: restoredCase.documents?.[0]?.extractedText || '',
              primaryCrime: restoredCase.crime || 'Not specified',
              // Add these fields to ensure deletability
              result: restoredCase.analysisResults?.result || {},
              crimeTypes: restoredCase.analysisResults?.crimeTypes || []
            },
            documents: restoredCase.documents?.map(doc => ({
              ...doc,
              fileType: doc.fileType || 'text/plain',
              fileName: doc.fileName || 'document.txt'
            })) || [],
            evidenceContext: restoredCase.evidenceContext || [],
            timestamp: new Date().toISOString(),
            // Add these fields to ensure proper restoration
            caseType: restoredCase.caseType || 'other',
            status: 'active',
            clientId: sessionStorage.getItem('userid')
          };
        }
        return null;
      });

      const restoredEntries = (await Promise.all(restorePromises)).filter(Boolean);

      // Update localStorage with restored cases
      const existingResults = JSON.parse(localStorage.getItem('analysisResults') || '[]');
      const updatedResults = [...restoredEntries, ...existingResults];
      localStorage.setItem('analysisResults', JSON.stringify(updatedResults));

      toast.success(`Successfully restored ${selectedCases.size} cases to Analysis Dashboard`);
      setSelectedCases(new Set());
      fetchDeletedCases();
    } catch (error) {
      console.error('Error restoring cases:', error);
      toast.error('Failed to restore some cases');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCases.size === 0) {
      toast.warning('Please select cases to delete');
      return;
    }

    const confirmed = window.confirm(
      `This action cannot be undone. Are you sure you want to permanently delete ${selectedCases.size} cases?`
    );
    if (!confirmed) return;

    try {
      const promises = Array.from(selectedCases).map(caseId =>
        axios.delete(`http://localhost:5000/api/cases/${caseId}`, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('token')}`
          }
        })
      );

      await Promise.all(promises);
      toast.success(`Successfully deleted ${selectedCases.size} cases`);
      setSelectedCases(new Set());
      fetchDeletedCases();
    } catch (error) {
      console.error('Error deleting cases:', error);
      toast.error('Failed to delete some cases');
    }
  };

  const filteredCases = deletedCases.filter(caseItem => {
    const matchesSearch = searchTerm === '' || 
      caseItem.ipcSection?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.caseType?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCaseType = filters.caseType === 'all' || caseItem.caseType === filters.caseType;
    const matchesStatus = filters.status === 'all' || caseItem.status === filters.status;

    let matchesDate = true;
    if (filters.dateRange !== 'all') {
      const caseDate = new Date(caseItem.deletedAt);
      const today = new Date();
      switch (filters.dateRange) {
        case 'today':
          matchesDate = caseDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.setDate(today.getDate() - 7));
          matchesDate = caseDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.setMonth(today.getMonth() - 1));
          matchesDate = caseDate >= monthAgo;
          break;
        default:
          matchesDate = true;
      }
    }

    return matchesSearch && matchesCaseType && matchesStatus && matchesDate;
  });

  return (
    <div className="wrapper">
      <Navbar />
      <div className="main">
        <ClientSidebar />
        <div className="content">
          <div className="deleted-cases-container">
            {/* Left Panel - List View */}
            <div className="cases-list-panel">
              <div className="panel-header">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4>Deleted Cases</h4>
                  {filteredCases.length > 0 && (
                    <div className="bulk-actions">
                      <button
                        className="btn btn-outline-primary me-2"
                        onClick={handleBulkRestore}
                        disabled={selectedCases.size === 0}
                      >
                        <FontAwesomeIcon icon={faTrashRestore} className="me-2" />
                        Restore Selected ({selectedCases.size})
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={handleBulkDelete}
                        disabled={selectedCases.size === 0}
                      >
                        <FontAwesomeIcon icon={faTrash} className="me-2" />
                        Delete Selected ({selectedCases.size})
                      </button>
                    </div>
                  )}
                </div>
                <div className="search-bar">
                  <FontAwesomeIcon icon={faSearch} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search cases..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button 
                      className="clear-search"
                      onClick={() => setSearchTerm('')}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  )}
                </div>
                <div className="filter-controls">
                  <select
                    value={filters.caseType}
                    onChange={(e) => setFilters(prev => ({ ...prev, caseType: e.target.value }))}
                    className="filter-select"
                  >
                    <option value="all">All Types</option>
                    <option value="criminal">Criminal</option>
                    <option value="civil">Civil</option>
                    <option value="family">Family</option>
                    <option value="corporate">Corporate</option>
                  </select>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                    className="filter-select"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              </div>

              <div className="cases-list">
                {loading ? (
                  <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading cases...</p>
                  </div>
                ) : error ? (
                  <div className="error-state">
                    <FontAwesomeIcon icon={faExclamationCircle} />
                    <p>{error}</p>
                  </div>
                ) : filteredCases.length > 0 ? (
                  <>
                    <div className="select-all-row">
                      <label className="d-flex align-items-center">
                        <input
                          type="checkbox"
                          checked={selectedCases.size === filteredCases.length}
                          onChange={handleSelectAll}
                          className="me-2"
                        />
                        Select All ({filteredCases.length})
                      </label>
                    </div>
                    {filteredCases.map((caseItem) => (
                      <div 
                        key={caseItem._id} 
                        className={`case-list-item ${selectedCase?._id === caseItem._id ? 'selected' : ''}`}
                      >
                        <div className="d-flex align-items-center">
                          <input
                            type="checkbox"
                            checked={selectedCases.has(caseItem._id)}
                            onChange={() => handleSelectCase(caseItem._id)}
                            onClick={(e) => e.stopPropagation()}
                            className="me-3"
                          />
                          <div 
                            className="case-content w-100"
                            onClick={() => setSelectedCase(caseItem)}
                          >
                            <div className="case-list-header">
                              <span className="case-type-badge">{caseItem.caseType}</span>
                              <span className="case-date">
                                <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                                {new Date(caseItem.deletedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="case-list-content">
                              <h6>IPC Section: {caseItem.ipcSection}</h6>
                              <div className="case-list-meta">
                                <span className="document-count">
                                  <FontAwesomeIcon icon={faFile} className="me-1" />
                                  {caseItem.documents.length} documents
                                </span>
                                <span className={`status-badge status-${caseItem.status}`}>
                                  {caseItem.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="empty-state">
                    <FontAwesomeIcon icon={faTrash} size="2x" />
                    <p>No deleted cases found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Case Details */}
            <div className="case-details-panel">
              <div className="panel-header d-flex justify-content-between align-items-center">
                <h5>{selectedCase ? 'Case Details' : 'Select a Case'}</h5>
                <button 
                  className="btn btn-link close-panel"
                  onClick={() => navigate(-1)}
                  title="Close panel"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              
              {selectedCase ? (
                <div className="case-details">
                  <div className="details-header">
                    <div className="action-buttons">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => handleRestoreCase(selectedCase._id)}
                      >
                        <FontAwesomeIcon icon={faTrashRestore} className="me-2" />
                        Restore Case
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handlePermanentDelete(selectedCase._id)}
                      >
                        <FontAwesomeIcon icon={faTrash} className="me-2" />
                        Delete Permanently
                      </button>
                    </div>
                  </div>

                  <div className="details-content">
                    <div className="detail-section">
                      <h6>IPC Analysis</h6>
                      <div className="ipc-details">
                        <div className="primary-section">
                          Section {selectedCase.ipcSection}
                        </div>
                        <p className="ipc-description">{selectedCase.ipcDescription}</p>
                      </div>
                    </div>

                    <div className="detail-section">
                      <h6>Related Sections</h6>
                      <div className="related-sections">
                        {selectedCase.relatedSections && selectedCase.relatedSections.length > 0 ? (
                          selectedCase.relatedSections.map((section, index) => (
                            <div key={index} className="related-section">
                              <div className="section-info">
                                <div className="section-number">Section {section.section}</div>
                                <div className="confidence-score">
                                  <div className="confidence-bar" style={{ 
                                    width: `${Math.round(section.confidence * 100)}%` 
                                  }}></div>
                                  <span>{Math.round(section.confidence * 100)}% match</span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-sections">
                            <p>No related sections found</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="detail-section">
                      <h6>Documents</h6>
                      <div className="documents-grid">
                        {selectedCase.documents.map((doc, index) => (
                          <a
                            key={index}
                            href={`http://localhost:5000/${doc.filePath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="document-card"
                          >
                            <FontAwesomeIcon 
                              icon={doc.fileType.includes('image') ? faImage : faFile}
                              size="2x"
                            />
                            <span className="document-name">{doc.fileName}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-selection">
                  <FontAwesomeIcon icon={faFile} size="3x" />
                  <p>Select a case to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default DeletedCases; 