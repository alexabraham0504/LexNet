import React, { useState } from 'react';
import axios from 'axios';

const IPCLookup = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = () => {
    axios.get(`/api/ipc?query=${searchQuery}`).then((response) => {
      setResults(response.data);
    });
  };

  return (
    <div>
      <h2>IPC Lookup</h2>
      <input
        type="text"
        placeholder="Enter IPC section number or keyword"
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>

      <ul>
        {results.map((section) => (
          <li key={section.id}>
            <h3>{section.number}: {section.title}</h3>
            <p>{section.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default IPCLookup;
