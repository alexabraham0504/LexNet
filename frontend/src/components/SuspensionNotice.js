import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const NoticeContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #fee2e2;
  color: #991b1b;
  padding: 1rem;
  text-align: center;
  z-index: 9999;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const SuspensionNotice = ({ reason, suspendedAt }) => {
  const navigate = useNavigate();

  React.useEffect(() => {
    // Redirect to login after showing the message
    const timer = setTimeout(() => {
      navigate('/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <NoticeContainer>
      <h3>Account Suspended</h3>
      <p>Your account has been suspended{reason ? `: ${reason}` : '.'}</p>
      {suspendedAt && (
        <p>Suspended on: {new Date(suspendedAt).toLocaleDateString()}</p>
      )}
      <p>You will be redirected to the login page in 5 seconds...</p>
    </NoticeContainer>
  );
};

export default SuspensionNotice; 