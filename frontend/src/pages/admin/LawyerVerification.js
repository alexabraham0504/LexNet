
import React, { useEffect, useState } from 'react';
// import './LawyerVerification.css'; // Optional CSS for styling

const LawyerVerification = () => {
    const [lawyers, setLawyers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Sample lawyer data (replace with actual API call)
        setLawyers([
            { id: 1, name: 'Alice Johnson', email: 'alice@example.com', verified: false },
            { id: 2, name: 'Bob Smith', email: 'bob@example.com', verified: false },
        ]);
    }, []);

    const handleApprove = (id) => {
        setLawyers(lawyers.map(lawyer => lawyer.id === id ? { ...lawyer, verified: true } : lawyer));
    };

    const handleReject = (id) => {
        setLawyers(lawyers.filter(lawyer => lawyer.id !== id));
    };

    const filteredLawyers = lawyers.filter(lawyer => 
        lawyer.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="lawyer-verification">
            <h1>Lawyer Verification</h1>
            <input 
                type="text" 
                placeholder="Search Lawyers..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <table className="lawyer-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredLawyers.map(lawyer => (
                        <tr key={lawyer.id}>
                            <td>{lawyer.name}</td>
                            <td>{lawyer.email}</td>
                            <td>{lawyer.verified ? 'Verified' : 'Pending'}</td>
                            <td>
                                <button onClick={() => handleApprove(lawyer.id)}>Approve</button>
                                <button onClick={() => handleReject(lawyer.id)}>Reject</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <style jsx>{`
                .lawyer-verification { padding: 20px; }
                h1 { text-align: center; }
                input { padding: 10px; margin: 20px 0; width: 80%; }
                .lawyer-table { width: 100%; border-collapse: collapse; }
                th, td { padding: 12px; border: 1px solid #ddd; }
                th { background-color: #f2f2f2; }
                tr:hover { background-color: #f1f1f1; }
                button { padding: 8px 12px; margin-right: 5px; cursor: pointer; }
                button:hover { background-color: #e0e0e0; }
            `}</style>
        </div>
    );
};

export default LawyerVerification;
