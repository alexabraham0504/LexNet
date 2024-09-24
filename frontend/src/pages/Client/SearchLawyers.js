import React, { useState } from 'react';
import axios from 'axios';

const SearchLawyers = () => {
  const [filters, setFilters] = useState({
    location: '',
    expertise: '',
    fees: '',
  });
  const [results, setResults] = useState([]);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    axios.get('/api/lawyers/search', { params: filters }).then((response) => {
      setResults(response.data);
    });
  };

  return (
    <div>
      <h2>Search Lawyers</h2>
      <input type="text" name="location" placeholder="Location" onChange={handleChange} />
      <input type="text" name="expertise" placeholder="Expertise" onChange={handleChange} />
      <input type="number" name="fees" placeholder="Max Fees" onChange={handleChange} />
      <button onClick={handleSearch}>Search</button>

      <ul>
        {results.map((lawyer) => (
          <li key={lawyer.id}>
            {lawyer.name} - {lawyer.expertise} - {lawyer.fees}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchLawyers;
