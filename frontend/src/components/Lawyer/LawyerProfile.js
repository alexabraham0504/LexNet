import React, { useState } from 'react';
import axios from 'axios';

const LawyerProfile = () => {
  const [profile, setProfile] = useState({
    name: '',
    expertise: '',
    fees: '',
    availability: '',
  });

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('/api/lawyers/profile', profile).then((response) => {
      console.log('Profile created', response.data);
    });
  };

  return (
    <div>
      <h2>Create Lawyer Profile</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Name" onChange={handleChange} />
        <input type="text" name="expertise" placeholder="Expertise" onChange={handleChange} />
        <input type="number" name="fees" placeholder="Fees" onChange={handleChange} />
        <input type="text" name="availability" placeholder="Availability" onChange={handleChange} />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default LawyerProfile;
