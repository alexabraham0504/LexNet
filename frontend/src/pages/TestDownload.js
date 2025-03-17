import React from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const TestDownload = () => {
  const handleDirectDownload = () => {
    const loadingToast = toast.loading('Downloading document...');
    
    // Direct URL to the file
    axios({
      url: 'http://localhost:5000/api/cases/emergency-download/any/any',
      method: 'GET',
      responseType: 'blob',
    })
    .then((response) => {
      toast.dismiss(loadingToast);
      
      // Determine file type from Content-Type header
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      let filename = 'document';
      
      // Set extension based on content type
      if (contentType.includes('pdf')) {
        filename += '.pdf';
      } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
        filename += '.jpg';
      } else if (contentType.includes('png')) {
        filename += '.png';
      } else {
        // Try to get filename from Content-Disposition header
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename=([^;]+)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/"/g, '');
          }
        }
      }
      
      // Create blob with the correct content type
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Append to html page
      document.body.appendChild(link);
      
      // Start download
      link.click();
      
      // Clean up and remove the link
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success(`Document downloaded successfully as ${filename}`);
    })
    .catch((error) => {
      console.error('Download error:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to download document. Please try again.');
    });
  };

  return (
    <div className="container mt-5">
      <h1>Test Download Page</h1>
      <button 
        className="btn btn-primary mt-3"
        onClick={handleDirectDownload}
      >
        Download Document Directly
      </button>
    </div>
  );
};

export default TestDownload; 