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

// Dark theme styled components
const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #0f1535;
  color: #ffffff;
`;

const MainContent = styled.div`
  flex: 1;
  background-color: #0f1535;
  padding: 20px 0;
`;

const DashboardContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  
  h1 {
    font-size: 28px;
    font-weight: 600;
    color: #ffffff;
    margin: 0;
  }
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px 16px;
  width: 250px;
  
  input {
    background: transparent;
    border: none;
    color: #ffffff;
    width: 100%;
    padding: 5px;
    outline: none;
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }
  }
  
  svg {
    color: rgba(255, 255, 255, 0.5);
    margin-right: 8px;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const MetricCard = styled.div`
  background: rgba(30, 41, 82, 0.8);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, #3a7bd5, #00d2ff);
  }
`;

const ChartContainer = styled.div`
  background: rgba(30, 41, 82, 0.8);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
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
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    white-space: nowrap;
    color: #ffffff;

    &:last-child {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9em;
    }
  }

  th {
    background-color: rgba(255, 255, 255, 0.05);
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
  }

  tbody tr:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  td span {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.9em;
  }
`;

const StatsCard = styled(MetricCard)`
  h3 {
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 15px;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 5px;
  }

  .stat-label {
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
  }

  .trend-up {
    color: #4ade80;
    margin-top: 10px;
    font-size: 14px;
  }

  .trend-down {
    color: #f87171;
    margin-top: 10px;
    font-size: 14px;
  }
  
  .icon {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(58, 123, 213, 0.2);
    color: #3a7bd5;
  }
`;

const ChartTitle = styled.h3`
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 600;
`;

const TableTitle = styled.h3`
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 16px;
  font-weight: 600;
`;

const TablesContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-top: 20px;
`;

const ModalContent = styled.div`
  padding: 20px;
  background: #1e2952;
  color: #ffffff;

  h2 {
    color: #ffffff;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .detail-row {
    display: flex;
    margin-bottom: 15px;

    .label {
      font-weight: bold;
      width: 150px;
      color: rgba(255, 255, 255, 0.7);
    }

    .value {
      color: #ffffff;
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
  color: rgba(255, 255, 255, 0.7);

  &:hover {
    color: #ffffff;
  }
`;

const ChartSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const GlobeSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const GlobeContainer = styled(ChartContainer)`
  height: 400px;
`;

const PieChartContainer = styled(ChartContainer)`
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-5px);
  }
`;

const SalesOverviewContainer = styled(ChartContainer)`
  height: 400px;
`;

const CountryTable = styled.div`
  margin-top: 20px;
  
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  th {
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }
  
  .flag {
    width: 24px;
    height: 16px;
    margin-right: 8px;
    vertical-align: middle;
  }
  
  .country-name {
    display: flex;
    align-items: center;
  }
  
  .positive {
    color: #4ade80;
  }
`;

const ActiveUsersContainer = styled(ChartContainer)`
  height: auto;
  
  .stats-row {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
  }
  
  .stat-item {
    text-align: center;
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 5px;
  }
  
  .stat-label {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 10px;
  }
  
  .blue {
    background: rgba(58, 123, 213, 0.2);
    color: #3a7bd5;
  }
  
  .green {
    background: rgba(74, 222, 128, 0.2);
    color: #4ade80;
  }
  
  .purple {
    background: rgba(168, 85, 247, 0.2);
    color: #a855f7;
  }
`;

// Define RealTimeIndicator here (only once)
const RealTimeIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4ade80;
  margin-bottom: 20px;

  .pulse {
    width: 8px;
    height: 8px;
    background-color: #4ade80;
    border-radius: 50%;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7);
    }
    70% {
      transform: scale(1);
      box-shadow: 0 0 0 10px rgba(74, 222, 128, 0);
    }
    100% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(74, 222, 128, 0);
    }
  }
`;

const WorldMapContainer = styled(ChartContainer)`
  height: 400px;
  position: relative;
  
  .world-map-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.7);
    
    svg {
      width: 80%;
      height: 80%;
      opacity: 0.6;
    }
    
    p {
      margin-top: 15px;
      font-size: 14px;
    }
  }
`;

// Add a date range filter at the top of the dashboard
const DateRangeFilter = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  
  select {
    background: rgba(30, 41, 82, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #ffffff;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    
    &:focus {
      outline: none;
      border-color: #3a7bd5;
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  
  button {
    background: rgba(30, 41, 82, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #ffffff;
    padding: 8px 15px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
    
    &:hover {
      background: rgba(58, 123, 213, 0.3);
    }
    
    svg {
      width: 16px;
      height: 16px;
    }
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
  const [globeData, setGlobeData] = useState([]);
  const [dateRange, setDateRange] = useState('last7days');
  const [lawyerSearch, setLawyerSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');

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
    const newSocket = io("https://lexnet-backend.onrender.com");
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
        const baseURL = "https://lexnet-backend.onrender.com";
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
          "https://lexnet-backend.onrender.com/api/admin/analytics/lawyers"
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
          "https://lexnet-backend.onrender.com/api/admin/analytics/clients"
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

  // Generate mock globe data
  useEffect(() => {
    // Mock data for visualization
    const mockGlobeData = [
      { lat: 40.7128, lng: -74.0060, value: 50, name: "United States", code: "US", users: 2500, growth: "+12.5%" },
      { lat: 34.0522, lng: -118.2437, value: 45, name: "Canada", code: "CA", users: 1200, growth: "+8.3%" },
      { lat: 51.5074, lng: -0.1278, value: 40, name: "United Kingdom", code: "GB", users: 980, growth: "+5.7%" },
      { lat: 48.8566, lng: 2.3522, value: 35, name: "Germany", code: "DE", users: 750, growth: "+10.2%" },
      { lat: 35.6762, lng: 139.6503, value: 30, name: "France", code: "FR", users: 620, growth: "+4.1%" },
    ];
    
    setGlobeData(mockGlobeData);
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

  // Add refresh function
  const refreshData = async () => {
    try {
      const baseURL = "https://lexnet-backend.onrender.com";
      const [users, appointments, lawyers, clientsData] = await Promise.all([
        axios.get(`${baseURL}/api/admin/analytics/users`),
        axios.get(`${baseURL}/api/admin/analytics/appointments`),
        axios.get(`${baseURL}/api/admin/analytics/lawyers`),
        axios.get(`${baseURL}/api/admin/analytics/clients`)
      ]);

      setUserMetrics(users.data || defaultMetrics.userMetrics);
      setAppointmentMetrics(appointments.data || defaultMetrics.appointmentMetrics);
      setLawyerMetrics(lawyers.data || defaultMetrics.lawyerMetrics);
      
      if (Array.isArray(clientsData.data)) {
        setClients(clientsData.data);
      }
      
      if (lawyers.data && lawyers.data.topLawyers) {
        setLawyers(lawyers.data.topLawyers);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  // Add export function
  const exportData = (type) => {
    let dataToExport;
    let filename;
    
    if (type === 'lawyers') {
      dataToExport = lawyers;
      filename = 'lawyers-data.csv';
    } else if (type === 'clients') {
      dataToExport = clients;
      filename = 'clients-data.csv';
    } else {
      return;
    }
    
    if (!dataToExport || dataToExport.length === 0) {
      alert('No data to export');
      return;
    }
    
    // Create CSV content
    const headers = Object.keys(dataToExport[0]).join(',');
    const rows = dataToExport.map(item => 
      Object.values(item).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    ).join('\n');
    
    const csvContent = `${headers}\n${rows}`;
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!userMetrics || !appointmentMetrics || !lawyerMetrics) {
    return (
      <PageContainer>
        <Navbar />
        <AdminIconPanel />
        <MainContent style={{ marginLeft: '60px' }}>
          <DashboardContainer>
            <h1>Analytics Dashboard</h1>
            <p>Loading metrics...</p>
          </DashboardContainer>
        </MainContent>
        <Footer />
      </PageContainer>
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
            color: 'rgba(255, 255, 255, 0.7)'
          },
          color: 'rgba(255, 255, 255, 0.7)'
        },
      },
      title: {
        display: true,
        font: {
          size: 16,
          color: 'rgba(255, 255, 255, 0.9)'
        },
      },
      tooltip: {
        backgroundColor: "rgba(30, 41, 82, 0.9)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "rgba(255, 255, 255, 0.1)",
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
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        }
      }
    }
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
          "rgba(58, 123, 213, 0.8)",
          "rgba(74, 222, 128, 0.8)",
          "rgba(168, 85, 247, 0.8)",
        ],
        borderColor: [
          "rgba(58, 123, 213, 1)",
          "rgba(74, 222, 128, 1)",
          "rgba(168, 85, 247, 1)",
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
        backgroundColor: ["rgba(74, 222, 128, 0.8)", "rgba(248, 113, 113, 0.8)"],
        borderColor: ["rgba(74, 222, 128, 1)", "rgba(248, 113, 113, 1)"],
        borderWidth: 1,
      },
    ],
  };

  // Sales overview data (mock data for the line chart)
  const salesOverviewData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Appointments',
        data: [30, 40, 35, 50, 49, 60, 70, 91, 125, 110, 120, 130],
        borderColor: '#3a7bd5',
        backgroundColor: 'rgba(58, 123, 213, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ],
  };

  // Active users data (mock data for the bar chart)
  const activeUsersData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Active Users',
        data: [65, 59, 80, 81, 56, 55, 40],
        backgroundColor: 'rgba(58, 123, 213, 0.8)',
        borderRadius: 4,
      }
    ],
  };

  // Add filtered data getters
  const getFilteredLawyers = () => {
    if (!lawyerSearch.trim()) return lawyers;
    
    return lawyers.filter(lawyer => 
      lawyer.fullname?.toLowerCase().includes(lawyerSearch.toLowerCase()) ||
      lawyer.email?.toLowerCase().includes(lawyerSearch.toLowerCase()) ||
      lawyer.specialization?.toLowerCase().includes(lawyerSearch.toLowerCase())
    );
  };

  const getFilteredClients = () => {
    if (!clientSearch.trim()) return clients;
    
    return clients.filter(client => 
      client.fullname?.toLowerCase().includes(clientSearch.toLowerCase()) ||
      client.email?.toLowerCase().includes(clientSearch.toLowerCase())
    );
  };

  // Update the lawyer table rendering
  const renderLawyerTable = () => {
    const filteredLawyers = getFilteredLawyers();
    
    if (!filteredLawyers?.length) {
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
          {filteredLawyers.map((lawyer) => (
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
                    color: lawyer.isVerified ? "#4ade80" : "#f87171",
                    fontWeight: "bold",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    backgroundColor: lawyer.isVerified
                      ? "rgba(74, 222, 128, 0.1)"
                      : "rgba(248, 113, 113, 0.1)",
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
    const filteredClients = getFilteredClients();
    
    if (!filteredClients?.length) {
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
          {filteredClients.map((client) => (
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
                    color: client.isActive ? "#4ade80" : "#f87171",
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
            backgroundColor: ["rgba(148, 163, 184, 0.8)"],
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
          backgroundColor: ["rgba(74, 222, 128, 0.8)", "rgba(248, 113, 113, 0.8)"],
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
          backgroundColor: ["rgba(58, 123, 213, 0.8)", "rgba(148, 163, 184, 0.8)"],
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

          <DateRangeFilter>
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisYear">This Year</option>
            </select>
          </DateRangeFilter>

          <ActionButtons>
            <button onClick={refreshData}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
            <button onClick={() => exportData('lawyers')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Lawyers
            </button>
            <button onClick={() => exportData('clients')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Clients
            </button>
          </ActionButtons>

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
                <SearchBar>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Search lawyers..." 
                    value={lawyerSearch}
                    onChange={(e) => setLawyerSearch(e.target.value)}
                  />
                </SearchBar>
                {renderLawyerTable()}
              </TableContainer>
            )}

            {showClientsList && (
              <TableContainer>
                <TableTitle>Clients List</TableTitle>
                <SearchBar>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Search clients..." 
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                  />
                </SearchBar>
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

export default ReportsAnalytics;
