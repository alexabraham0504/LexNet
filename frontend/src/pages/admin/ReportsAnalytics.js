import React, { useEffect, useState } from "react";
import axios from "axios";
import Chart from "chart.js/auto";
import Footer from "../../components/footer/footer-admin";
import Navbar from "../../components/navbar/navbar-admin";

const ReportsAnalytics = () => {
  const [userActivity, setUserActivity] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch user activity reports
      const activityResponse = await axios.get(
        "http://localhost:5000https://lexnet-backend.onrender.com/api/auth/user-activity"
      );
      console.log("User Activity Response:", activityResponse.data); // Debug log
      setUserActivity(activityResponse.data);

      // Fetch performance metrics
      const performanceResponse = await axios.get(
        "http://localhost:5000https://lexnet-backend.onrender.com/api/auth/performance-metrics"
      );
      console.log("Performance Metrics Response:", performanceResponse.data); // Debug log
      setPerformanceMetrics(performanceResponse.data);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      setLoading(false);
    }
  };

  const styles = {
    container: { padding: "20px" },
    heading: { marginBottom: "20px" },
    reportSection: { marginBottom: "40px" },
    table: { width: "100%", borderCollapse: "collapse", marginBottom: "20px" },
    th: {
      padding: "12px",
      textAlign: "left",
      backgroundColor: "#f4f4f4",
      borderBottom: "1px solid #ddd",
    },
    td: { padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" },
    chartContainer: { width: "600px", margin: "0 auto" },
  };

  const renderUserActivityTable = () => (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Lawyer Name</th>
          <th style={styles.th}>Client Inquiries</th>
          <th style={styles.th}>Legal Service Requests</th>
        </tr>
      </thead>
      <tbody>
        {userActivity.map((activity, index) => (
          <tr key={index}>
            <td style={styles.td}>{activity.lawyerName}</td>
            <td style={styles.td}>{activity.clientInquiries}</td>
            <td style={styles.td}>{activity.serviceRequests}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderPerformanceMetrics = () => (
    <div>
      {performanceMetrics.map((metric, index) => (
        <div key={index} style={styles.reportSection}>
          <h3>{metric.title}</h3>
          <p>{metric.description}</p>
          <div style={styles.chartContainer}>
            <canvas id={`chart-${index}`} width="400" height="200"></canvas>
          </div>
        </div>
      ))}
    </div>
  );

  useEffect(() => {
    if (performanceMetrics.length > 0) {
      performanceMetrics.forEach((metric, index) => {
        const ctx = document.getElementById(`chart-${index}`);
        if (ctx) {
          new Chart(ctx, {
            type: "line",
            data: {
              labels: metric.data.labels,
              datasets: [
                {
                  label: metric.title,
                  data: metric.data.values,
                  borderColor: "#4caf50",
                  backgroundColor: "rgba(76, 175, 80, 0.2)",
                  fill: true,
                },
              ],
            },
          });
        }
      });
    }
  }, [performanceMetrics]);

  return (
    <div>
      <Navbar />

      <div style={styles.container}>
        <h2 style={styles.heading}>Analytics and Reporting</h2>
        {loading ? (
          <p>Loading analytics data...</p>
        ) : (
          <>
            <div style={styles.reportSection}>
              <h3>User Activity Reports</h3>
              {userActivity.length > 0 ? (
                renderUserActivityTable()
              ) : (
                <p>No user activity data available.</p>
              )}
            </div>

            <div style={styles.reportSection}>
              <h3>Performance Metrics</h3>
              {performanceMetrics.length > 0 ? (
                renderPerformanceMetrics()
              ) : (
                <p>No performance metrics data available.</p>
              )}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ReportsAnalytics;
