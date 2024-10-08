import React, { useEffect, useState } from 'react';
// import './ContentModeration.css'; // Optional CSS for styling

const ContentModeration = () => {
    const [feedback, setFeedback] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Sample feedback data (replace with actual API call)
        setFeedback([
            { id: 1, user: 'Client1', content: 'Inappropriate behavior', flagged: true },
            { id: 2, user: 'Client2', content: 'Great service!', flagged: false },
        ]);
    }, []);

    const handleResolve = (id) => {
        setFeedback(feedback.map(item => item.id === id ? { ...item, flagged: false } : item));
    };

    const handleDelete = (id) => {
        setFeedback(feedback.filter(item => item.id !== id));
    };

    const filteredFeedback = feedback.filter(item => 
        item.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="content-moderation">
            <h1>Content Moderation</h1>
            <input 
                type="text" 
                placeholder="Search Feedback..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <table className="feedback-table">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Feedback</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredFeedback.map(item => (
                        <tr key={item.id}>
                            <td>{item.user}</td>
                            <td>{item.content}</td>
                            <td>{item.flagged ? 'Flagged' : 'Resolved'}</td>
                            <td>
                                {item.flagged && (
                                    <>
                                        <button onClick={() => handleResolve(item.id)}>Resolve</button>
                                        <button onClick={() => handleDelete(item.id)}>Delete</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <style jsx>{`
                .content-moderation { padding: 20px; }
                h1 { text-align: center; }
                input { padding: 10px; margin: 20px 0; width: 80%; }
                .feedback-table { width: 100%; border-collapse: collapse; }
                th, td { padding: 12px; border: 1px solid #ddd; }
                th { background-color: #f2f2f2; }
                tr:hover { background-color: #f1f1f1; }
                button { padding: 8px 12px; margin-right: 5px; cursor: pointer; }
                button:hover { background-color: #e0e0e0; }
            `}</style>
        </div>
    );
};

export default ContentModeration;
