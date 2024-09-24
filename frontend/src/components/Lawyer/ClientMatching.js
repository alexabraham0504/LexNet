import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ClientMatching = () => {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    axios.get('/api/clients/matching').then((response) => setClients(response.data));
  }, []);

  return (
    <div>
      <h2>Matched Clients</h2>
      <ul>
        {clients.map((client) => (
          <li key={client.id}>
            {client.name} - {client.legalNeed}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClientMatching;
