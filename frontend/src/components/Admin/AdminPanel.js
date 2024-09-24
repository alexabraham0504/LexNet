import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios.get('/api/users').then((response) => setUsers(response.data));
  }, []);

  const handleDelete = (userId) => {
    axios.delete(`/api/users/${userId}`).then(() => {
      setUsers(users.filter((user) => user.id !== userId));
    });
  };

  return (
    <div>
      <h2>User Management</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} - {user.role}
            <button onClick={() => handleDelete(user.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminPanel;
