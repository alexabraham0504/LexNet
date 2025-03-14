import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const ErrorDisplay = ({ message, retry }) => {
  return (
    <div className="error-container p-4 text-center">
      <FontAwesomeIcon icon={faExclamationTriangle} size="3x" className="text-danger mb-3" />
      <h5>Something went wrong</h5>
      <p className="text-muted">{message || 'An unexpected error occurred'}</p>
      {retry && (
        <button className="btn btn-outline-primary mt-2" onClick={retry}>
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay; 