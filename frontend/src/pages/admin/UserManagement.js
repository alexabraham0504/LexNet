import React, { useEffect, useState } from 'react';
// import './UserManagement.css'; // Optional CSS for styling

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Sample users (replace with API call)
        setUsers([
            { id: 1, name: 'John Doe', role: 'Client', email: 'john@example.com' },
            { id: 2, name: 'Jane Smith', role: 'Lawyer', email: 'jane@example.com' },
        ]);
    }, []);

    const handleDeactivate = (id) => {
        setUsers(users.map(user => user.id === id ? { ...user, active: false } : user));
    };

    const handleDelete = (id) => {
        setUsers(users.filter(user => user.id !== id));
    };

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="user-management">
            <h1>User Management</h1>
            <input 
                type="text" 
                placeholder="Search Users..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <table className="user-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.map(user => (
                        <tr key={user.id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                            <td>
                                <button onClick={() => handleDeactivate(user.id)}>Deactivate</button>
                                <button onClick={() => handleDelete(user.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <style jsx>{`
                .user-management { padding: 20px; }
                h1 { text-align: center; }
                input { padding: 10px; margin: 20px 0; width: 80%; }
                .user-table { width: 100%; border-collapse: collapse; }
                th, td { padding: 12px; border: 1px solid #ddd; }
                th { background-color: #f2f2f2; }
                tr:hover { background-color: #f1f1f1; }
                button { padding: 8px 12px; margin-right: 5px; cursor: pointer; }
            `}</style>
        </div>
    );
};

export default UserManagement;
