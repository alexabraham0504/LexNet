import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api.config';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileAlt, 
  faUser, 
  faGavel, 
  faCalendar,
  faEye 
} from '@fortawesome/free-solid-svg-icons';
import Navbar from '../../components/navbar/navbar-lawyer';
import Footer from '../../components/footer/footer-lawyer';

const CaseHub = () => {
  const [assignedCases, setAssignedCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lawyerData, setLawyerData] = useState(null);

  useEffect(() => {
    const fetchLawyerData = async () => {
      try {
        const userEmail = localStorage.getItem("userEmail") || 
                         sessionStorage.getItem("email") || 
                         sessionStorage.getItem("userEmail");
        
        if (userEmail) {
          const response = await api.get(`/api/lawyers/user-details/${userEmail}`);
          setLawyerData(response.data);
        }
      } catch (error) {
        console.error("Error fetching lawyer data:", error);
      }
    };

    fetchLawyerData();
  }, []);

  useEffect(() => {
    if (lawyerData?._id) {
      fetchAssignedCases();
    }
  }, [lawyerData]);

  const fetchAssignedCases = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/cases/assignments/lawyer/${lawyerData._id}`);
      
      if (response.data.success) {
        const processedAssignments = response.data.assignments.map(assignment => ({
          ...assignment.caseId,
          clientId: assignment.clientId,
          assignmentId: assignment._id,
          assignmentStatus: assignment.status,
          clientNotes: assignment.clientNotes,
          assignmentDate: new Date(assignment.assignmentDate),
          displayDate: new Date(assignment.assignmentDate).toLocaleDateString(),
          displayTime: new Date(assignment.assignmentDate).toLocaleTimeString()
        }));

        setAssignedCases(processedAssignments.sort((a, b) => 
          b.assignmentDate - a.assignmentDate
        ));
      }
    } catch (error) {
      console.error('Error fetching assigned cases:', error);
      toast.error('Failed to load assigned cases');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page col flex-grow-1">
        <div className="container mt-5">
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <h2 className="mb-0">
                <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                Recent Case Assignments
              </h2>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : assignedCases.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Case Title</th>
                        <th>Client</th>
                        <th>Case Type</th>
                        <th>Status</th>
                        <th>Assigned</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedCases.map(caseItem => (
                        <tr key={caseItem._id || caseItem.assignmentId}>
                          <td>
                            <FontAwesomeIcon icon={faGavel} className="me-2" />
                            {caseItem.title || 'Untitled Case'}
                          </td>
                          <td>
                            <FontAwesomeIcon icon={faUser} className="me-2" />
                            {caseItem.clientId?.name || "Client"}
                          </td>
                          <td>
                            <span className={`badge bg-${getCaseTypeBadge(caseItem.caseType)}`}>
                              {caseItem.caseType || 'Other'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge bg-${getStatusBadge(caseItem.assignmentStatus)}`}>
                              {caseItem.assignmentStatus || 'Pending'}
                            </span>
                          </td>
                          <td>
                            <FontAwesomeIcon icon={faCalendar} className="me-2" />
                            <div>
                              {caseItem.displayDate}
                              <div className="text-muted small">
                                {caseItem.displayTime}
                              </div>
                            </div>
                          </td>
                          <td>
                            <Link 
                              to={`/lawyer/case/${caseItem._id}`}
                              className="btn btn-sm btn-primary"
                            >
                              <FontAwesomeIcon icon={faEye} className="me-1" />
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-info">
                  No cases have been assigned to you yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

// Helper functions
const getCaseTypeBadge = (caseType) => {
  switch(caseType?.toLowerCase()) {
    case 'criminal': return 'danger';
    case 'civil': return 'primary';
    case 'family': return 'success';
    case 'corporate': return 'info';
    default: return 'secondary';
  }
};

const getStatusBadge = (status) => {
  switch(status?.toLowerCase()) {
    case 'pending': return 'warning';
    case 'accepted': return 'success';
    case 'completed': return 'info';
    case 'rejected': return 'danger';
    default: return 'secondary';
  }
};

export default CaseHub; 