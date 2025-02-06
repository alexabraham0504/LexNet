import React, { useState, useEffect } from "react";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import axios from "axios";
import styled from "styled-components";
import Footer from "../../components/footer/footer-admin";
import Navbar from "../../components/navbar/navbar-admin";
import io from "socket.io-client";
import Modal from "react-modal";
import AdminIconPanel from "../../components/AdminIconPanel";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.div`
  flex: 1;
  background-color: #f5f5f5;
  padding: 20px 0;
`;

const DashboardContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const MetricCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ChartContainer = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  height: 300px;
  display: flex;
  flex-direction: column;
`;

const ChartWrapper = styled.div`
  flex: 1;
  position: relative;
  width: 100%;
  height: 100%;
`;

const TableContainer = styled(ChartContainer)`
  height: auto;
  margin-top: 20px;
  overflow-x: auto;

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
    min-width: 800px;
  }

  th,
  td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
    white-space: nowrap;

    &:last-child {
      // Style for date column
      color: #666;
      font-size: 0.9em;
    }
  }

  th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #2c3e50;
  }

  tbody tr:hover {
    background-color: #f5f5f5;
  }

  td span {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.9em;
  }
`;

const StatsCard = styled(MetricCard)`
  h3 {
    color: #2c3e50;
    margin-bottom: 15px;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: #3498db;
  }

  .stat-label {
    color: #7f8c8d;
    font-size: 14px;
  }

  .trend-up {
    color: #2ecc71;
  }

  .trend-down {
    color: #e74c3c;
  }
`;

const ChartTitle = styled.h3`
  color: #2c3e50;
  margin-bottom: 20px;
  text-align: center;
`;

const TableTitle = styled.h3`
  color: #2c3e50;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #eee;
`;

const TablesContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-top: 20px;
`;

const ModalContent = styled.div`
  padding: 20px;

  h2 {
    color: #2c3e50;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #eee;
  }

  .detail-row {
    display: flex;
    margin-bottom: 15px;

    .label {
      font-weight: bold;
      width: 150px;
      color: #34495e;
    }

    .value {
      color: #2c3e50;
    }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  right: 20px;
  top: 20px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #7f8c8d;

  &:hover {
    color: #34495e;
  }
`;

const ChartSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
`;

const PieChartContainer = styled(ChartContainer)`
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-5px);
  }
`;

const ReportsAnalytics = () => {
  const [socket, setSocket] = useState(null);
  const [userMetrics, setUserMetrics] = useState(null);
  const [appointmentMetrics, setAppointmentMetrics] = useState(null);
  const [lawyerMetrics, setLawyerMetrics] = useState(null);
  const [lawyers, setLawyers] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'lawyer' or 'client'
  const [showLawyersList, setShowLawyersList] = useState(true);
  const [showClientsList, setShowClientsList] = useState(true);

  // Update defaultMetrics to remove financial metrics
  const defaultMetrics = {
    userMetrics: {
      totalUsers: 0,
      activeUsers: 0,
      userTypes: {
        clients: 0,
        lawyers: 0,
        admins: 0,
      },
    },
    appointmentMetrics: {
      totalAppointments: 0,
      completedAppointments: 0,
      canceledAppointments: 0,
    },
    lawyerMetrics: {
      topLawyers: [],
      specializations: [],
    },
  };

  // Split the useEffect to avoid dependency issues
  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleAnalyticsUpdate = (data) => {
      setUserMetrics(data.userMetrics || defaultMetrics.userMetrics);
      setAppointmentMetrics(
        data.appointmentMetrics || defaultMetrics.appointmentMetrics
      );
      setLawyerMetrics(data.lawyerMetrics || defaultMetrics.lawyerMetrics);
    };

    socket.on("analytics_update", handleAnalyticsUpdate);

    const fetchInitialData = async () => {
      try {
        const baseURL = "http://localhost:5000";
        const [users, appointments, lawyers] = await Promise.all([
          axios.get(`${baseURL}/api/admin/analytics/users`),
          axios.get(`${baseURL}/api/admin/analytics/appointments`),
          axios.get(`${baseURL}/api/admin/analytics/lawyers`),
        ]);

        setUserMetrics(users.data || defaultMetrics.userMetrics);
        setAppointmentMetrics(
          appointments.data || defaultMetrics.appointmentMetrics
        );
        setLawyerMetrics(lawyers.data || defaultMetrics.lawyerMetrics);
      } catch (error) {
        console.error("Error fetching initial metrics:", error);
        setUserMetrics(defaultMetrics.userMetrics);
        setAppointmentMetrics(defaultMetrics.appointmentMetrics);
        setLawyerMetrics(defaultMetrics.lawyerMetrics);
      }
    };

    fetchInitialData();

    return () => {
      socket.off("analytics_update", handleAnalyticsUpdate);
    };
  }, [socket]);

  // Add separate useEffects for fetching lawyers and clients
  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/admin/analytics/lawyers"
        );
        console.log("Lawyers data:", response.data);
        if (response.data && response.data.topLawyers) {
          setLawyers(response.data.topLawyers);
        }
      } catch (error) {
        console.error("Error fetching lawyers:", error);
        setLawyers([]);
      }
    };

    fetchLawyers();
  }, []);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/admin/analytics/clients"
        );
        console.log("Raw clients response:", response);
        console.log("Clients data:", response.data);

        if (Array.isArray(response.data)) {
          setClients(response.data);
        } else {
          console.error("Received non-array clients data:", response.data);
          setClients([]);
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
        if (error.response) {
          console.error("Error response:", error.response.data);
        }
        setClients([]);
      }
    };

    fetchClients();
  }, []);

  // Add animation for updating values
  const AnimatedValue = ({ value, prefix = "" }) => {
    const [displayValue, setDisplayValue] = useState(value);

    useEffect(() => {
      setDisplayValue(value);
    }, [value]);

    return (
      <span className="animated-value">
        {prefix}
        {displayValue}
      </span>
    );
  };

  // Add formatDate function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error(
        "Error formatting date:",
        error,
        "Date string:",
        dateString
      );
      return "N/A";
    }
  };

  if (!userMetrics || !appointmentMetrics || !lawyerMetrics) {
    return (
      <DashboardContainer>
        <h1>Analytics Dashboard</h1>
        <p>Loading metrics...</p>
      </DashboardContainer>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        font: {
          size: 16,
        },
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#2c3e50",
        bodyColor: "#2c3e50",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        padding: 12,
        bodyFont: {
          size: 14,
        },
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.raw || 0;
            return `${label}: ${value}`;
          },
        },
      },
    },
  };

  const userTypeData = {
    labels: ["Clients", "Lawyers", "Admins"],
    datasets: [
      {
        data: userMetrics
          ? [
              userMetrics.userTypes.clients || 0,
              userMetrics.userTypes.lawyers || 0,
              userMetrics.userTypes.admins || 0,
            ]
          : [0, 0, 0],
        backgroundColor: [
          "rgba(54, 162, 235, 0.8)",
          "rgba(75, 192, 192, 0.8)",
          "rgba(255, 206, 86, 0.8)",
        ],
        borderColor: [
          "rgba(54, 162, 235, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(255, 206, 86, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const appointmentData = {
    labels: ["Completed", "Canceled"],
    datasets: [
      {
        data: appointmentMetrics
          ? [
              appointmentMetrics.completedAppointments || 0,
              appointmentMetrics.canceledAppointments || 0,
            ]
          : [0, 0],
        backgroundColor: ["#4CAF50", "#f44336"],
        borderColor: ["#43A047", "#e53935"],
        borderWidth: 1,
      },
    ],
  };

  // Update the lawyer table rendering
  const renderLawyerTable = () => {
    if (!lawyers?.length) {
      return <p>No lawyer data available</p>;
    }

    return (
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Specialization</th>
            <th>Rating</th>
            <th>Appointments</th>
            <th>Status</th>
            <th>Registration Date</th>
          </tr>
        </thead>
        <tbody>
          {lawyers.map((lawyer) => (
            <tr
              key={lawyer._id}
              onClick={() => handleItemClick(lawyer, "lawyer")}
              style={{ cursor: "pointer" }}
            >
              <td>{lawyer.fullname || "N/A"}</td>
              <td>{lawyer.email || "N/A"}</td>
              <td>{lawyer.phone || "N/A"}</td>
              <td>{lawyer.specialization || "N/A"}</td>
              <td>{lawyer.rating ? `${lawyer.rating.toFixed(1)}⭐` : "N/A"}</td>
              <td>{lawyer.appointments || 0}</td>
              <td>
                <span
                  style={{
                    color: lawyer.isVerified ? "#2ecc71" : "#e74c3c",
                    fontWeight: "bold",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    backgroundColor: lawyer.isVerified
                      ? "rgba(46, 204, 113, 0.1)"
                      : "rgba(231, 76, 60, 0.1)",
                  }}
                >
                  {lawyer.isVerified ? "Verified" : "Pending"}
                </span>
              </td>
              <td>{formatDate(lawyer.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Update the client table rendering to show role for debugging
  const renderClientTable = () => {
    if (!clients?.length) {
      return <p>No client data available</p>;
    }

    return (
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Joined Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr
              key={client._id}
              onClick={() => handleItemClick(client, "client")}
              style={{ cursor: "pointer" }}
            >
              <td>{client.fullname || "N/A"}</td>
              <td>{client.email || "N/A"}</td>
              <td>{client.phone || "N/A"}</td>
              <td>{client.role || "N/A"}</td>
              <td>
                {client.createdAt
                  ? new Date(client.createdAt).toLocaleDateString()
                  : "N/A"}
              </td>
              <td>
                <span
                  style={{
                    color: client.isActive ? "#2ecc71" : "#e74c3c",
                    fontWeight: "bold",
                  }}
                >
                  {client.isActive ? "Active" : "Inactive"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Add these functions for chart data
  const getLawyerChartData = () => {
    if (!lawyers)
      return {
        labels: ["No Data"],
        datasets: [
          {
            data: [1],
            backgroundColor: ["#95a5a6"],
            borderWidth: 0,
          },
        ],
      };

    const verifiedCount = lawyers.filter((l) => l.isVerified).length;
    const pendingCount = lawyers.length - verifiedCount;

    return {
      labels: ["Verified Lawyers", "Pending Verification"],
      datasets: [
        {
          data: [verifiedCount, pendingCount],
          backgroundColor: ["#2ecc71", "#e74c3c"],
          borderWidth: 0,
        },
      ],
    };
  };

  const getClientChartData = () => {
    const activeCount = clients.filter((c) => c.isActive).length;
    const inactiveCount = clients.length - activeCount;

    return {
      labels: ["Active Clients", "Inactive Clients"],
      datasets: [
        {
          data: [activeCount, inactiveCount],
          backgroundColor: ["#3498db", "#95a5a6"],
          borderWidth: 0,
        },
      ],
    };
  };

  // Add modal handlers
  const handleItemClick = (item, type) => {
    setSelectedItem(item);
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  // Add modal content renderer
  const renderModalContent = () => {
    if (!selectedItem) return null;

    if (modalType === "lawyer") {
      return (
        <ModalContent>
          <h2>Lawyer Details</h2>
          <CloseButton onClick={closeModal}>&times;</CloseButton>
          <div className="detail-row">
            <span className="label">Name:</span>
            <span className="value">{selectedItem.fullname}</span>
          </div>
          <div className="detail-row">
            <span className="label">Email:</span>
            <span className="value">{selectedItem.email}</span>
          </div>
          <div className="detail-row">
            <span className="label">Phone:</span>
            <span className="value">{selectedItem.phone}</span>
          </div>
          <div className="detail-row">
            <span className="label">Specialization:</span>
            <span className="value">{selectedItem.specialization}</span>
          </div>
          <div className="detail-row">
            <span className="label">Rating:</span>
            <span className="value">
              {selectedItem.rating
                ? `${selectedItem.rating.toFixed(1)}⭐`
                : "N/A"}
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Status:</span>
            <span
              className="value"
              style={{ color: selectedItem.isVerified ? "#2ecc71" : "#e74c3c" }}
            >
              {selectedItem.isVerified ? "Verified" : "Pending"}
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Joined Date:</span>
            <span className="value">{formatDate(selectedItem.createdAt)}</span>
          </div>
        </ModalContent>
      );
    }

    if (modalType === "client") {
      return (
        <ModalContent>
          <h2>Client Details</h2>
          <CloseButton onClick={closeModal}>&times;</CloseButton>
          <div className="detail-row">
            <span className="label">Name:</span>
            <span className="value">{selectedItem.fullname}</span>
          </div>
          <div className="detail-row">
            <span className="label">Email:</span>
            <span className="value">{selectedItem.email}</span>
          </div>
          <div className="detail-row">
            <span className="label">Phone:</span>
            <span className="value">{selectedItem.phone}</span>
          </div>
          <div className="detail-row">
            <span className="label">Status:</span>
            <span
              className="value"
              style={{ color: selectedItem.isActive ? "#2ecc71" : "#e74c3c" }}
            >
              {selectedItem.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Joined Date:</span>
            <span className="value">{formatDate(selectedItem.createdAt)}</span>
          </div>
        </ModalContent>
      );
    }
  };

  // Add this helper function at the component level
  const calculateAverageRating = (lawyers) => {
    if (!lawyers || lawyers.length === 0) return 0;
    const totalRating = lawyers.reduce(
      (sum, lawyer) => sum + (lawyer.rating || 0),
      0
    );
    return (totalRating / lawyers.length).toFixed(1);
  };

  return (
    <PageContainer>
      <Navbar />
      <AdminIconPanel />
      <MainContent style={{ marginLeft: '60px' }}>
        <DashboardContainer>
          <h1>Analytics Dashboard</h1>
          <RealTimeIndicator>
            <span className="pulse"></span>
            Real-time Updates Active
          </RealTimeIndicator>

          <MetricsGrid>
            <StatsCard>
              <h3>User Metrics</h3>
              <div className="stat-value">
                <AnimatedValue value={userMetrics?.totalUsers || 0} />
              </div>
              <div className="stat-label">Total Users</div>
              <div className="trend-up">
                ↑ Active Users: {userMetrics?.activeUsers || 0}
              </div>
            </StatsCard>

            <StatsCard>
              <h3>Appointment Metrics</h3>
              <div className="stat-value">
                <AnimatedValue
                  value={appointmentMetrics?.totalAppointments || 0}
                />
              </div>
              <div className="stat-label">Total Appointments</div>
              <div className="stat-details">
                <div>
                  Completed: {appointmentMetrics?.completedAppointments || 0}
                </div>
                <div>
                  Canceled: {appointmentMetrics?.canceledAppointments || 0}
                </div>
              </div>
            </StatsCard>

            <StatsCard>
              <h3>Lawyer Metrics</h3>
              <div className="stat-value">
                <AnimatedValue value={lawyers?.length || 0} />
              </div>
              <div className="stat-label">Total Lawyers</div>
              <div className="trend-up">
                Verified: {lawyers?.filter((l) => l.isVerified)?.length || 0}
              </div>
              <div className="trend-up">
                Avg Rating: {calculateAverageRating(lawyers)}⭐
              </div>
            </StatsCard>
          </MetricsGrid>

          <ChartSection>
            <PieChartContainer>
              <ChartTitle>Lawyers Distribution</ChartTitle>
              <ChartWrapper>
                <Pie data={getLawyerChartData()} options={chartOptions} />
              </ChartWrapper>
            </PieChartContainer>

            <PieChartContainer>
              <ChartTitle>Clients Distribution</ChartTitle>
              <ChartWrapper>
                <Pie data={getClientChartData()} options={chartOptions} />
              </ChartWrapper>
            </PieChartContainer>
          </ChartSection>

          <TablesContainer>
            {showLawyersList && (
              <TableContainer>
                <TableTitle>Lawyers List</TableTitle>
                {renderLawyerTable()}
              </TableContainer>
            )}

            {showClientsList && (
              <TableContainer>
                <TableTitle>Clients List</TableTitle>
                {renderClientTable()}
              </TableContainer>
            )}
          </TablesContainer>
        </DashboardContainer>
      </MainContent>
      <Footer />

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        style={{
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            width: "500px",
            maxHeight: "80vh",
            overflow: "auto",
            borderRadius: "8px",
            padding: "20px",
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.75)",
          },
        }}
      >
        {renderModalContent()}
      </Modal>

      <style>
        {`
          @media (max-width: 768px) {
            div[style*="margin-left: 60px"] {
              margin-left: 50px !important;
            }
          }
        `}
      </style>
    </PageContainer>
  );
};

// Move RealTimeIndicator styled component before the main component
const RealTimeIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #2ecc71;
  margin-bottom: 20px;

  .pulse {
    width: 8px;
    height: 8px;
    background-color: #2ecc71;
    border-radius: 50%;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7);
    }
    70% {
      transform: scale(1);
      box-shadow: 0 0 0 10px rgba(46, 204, 113, 0);
    }
    100% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(46, 204, 113, 0);
    }
  }
`;

export default ReportsAnalytics;
