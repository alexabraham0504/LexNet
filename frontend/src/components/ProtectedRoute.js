import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SuspensionNotice from './SuspensionNotice';
import axios from 'axios';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionDetails, setSuspensionDetails] = useState(null);

  useEffect(() => {
    const verifySession = async () => {
      // Check if we're in the process of logging out
      if (sessionStorage.getItem("isLoggingOut")) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        const token = sessionStorage.getItem('token');
        const role = sessionStorage.getItem('role');

        if (!token || !role) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Verify token with backend
        const response = await axios.get('https://lexnet-backend.onrender.com/api/auth/check-status', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.status === 'suspended') {
          setIsSuspended(true);
          setSuspensionDetails({
            reason: response.data.suspensionReason,
            suspendedAt: response.data.suspendedAt
          });
          logout();
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Session verification failed:', error);
        if (error.response?.status === 403) {
          setIsSuspended(true);
          setSuspensionDetails({
            reason: error.response.data.suspensionReason,
            suspendedAt: error.response.data.suspendedAt
          });
          logout();
        } else {
          sessionStorage.clear();
          setIsAuthenticated(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, [logout]);

  if (isLoading) {
    return <div>Loading...</div>; // Add a loading spinner or placeholder
  }

  if (isSuspended) {
    return <SuspensionNotice {...suspensionDetails} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
