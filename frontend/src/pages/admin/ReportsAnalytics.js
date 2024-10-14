import React, { useEffect, useState } from 'react';
// import './ReportsAnalytics.css'; // Optional CSS for styling

const ReportsAnalytics = () => {
    const [userActivity, setUserActivity] = useState([]);
    const [lawyerPerformance, setLawyerPerformance] = useState([]);
    const [systemHealth, setSystemHealth] = useState({ uptime: '99.9%', status: 'All systems operational' });

    useEffect(() => {
        // Sample data (replace with actual API calls)
        setUserActivity([
            { id: 1, user: 'Client1', activity: 'Viewed Legal Document', timestamp: '2024-09-24 10:00 AM' },
            { id: 2, user: 'Lawyer1', activity: 'Consultation Scheduled', timestamp: '2024-09-24 11:30 AM' },
        ]);
        setLawyerPerformance([
            { id: 1, name: 'Lawyer A', casesHandled: 10, earnings: 'Rs.5,000' },
            { id: 2, name: 'Lawyer B', casesHandled: 15, earnings: 'Rs.7,500' },
        ]);
    }, []);

    return (
        <div className="reports-analytics">
            <h1>Reports & Analytics</h1>
            
            <div className="report-section">
                <h2>User Activity</h2>
                <table className="activity-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Activity</th>
                            <th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {userActivity.map(item => (
                            <tr key={item.id}>
                                <td>{item.user}</td>
                                <td>{item.activity}</td>
                                <td>{item.timestamp}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="report-section">
                <h2>Lawyer Performance</h2>
                <table className="performance-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Cases Handled</th>
                            <th>Earnings</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lawyerPerformance.map(item => (
                            <tr key={item.id}>
                                <td>{item.name}</td>
                                <td>{item.casesHandled}</td>
                                <td>{item.earnings}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="report-section">
                <h2>Platform Health</h2>
                <p>Status: {systemHealth.status}</p>
                <p>Uptime: {systemHealth.uptime}</p>
            </div>

            <style jsx>{`
                .reports-analytics { padding: 20px; }
                h1 { text-align: center; }
                .report-section { margin: 20px 0; }
                .activity-table, .performance-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { padding: 12px; border: 1px solid #ddd; }
                th { background-color: #f2f2f2; }
                tr:hover { background-color: #f1f1f1; }
            `}</style>
        </div>
    );
};

export default ReportsAnalytics;
