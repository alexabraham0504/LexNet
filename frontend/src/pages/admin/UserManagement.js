import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
} from "@mui/material";
import { FaCheck, FaTimes, FaUserShield, FaUsers } from "react-icons/fa";
import styled from "styled-components";
import Footer from "../../components/footer/footer-admin";
import Navbar from "../../components/navbar/navbar-admin";
import AdminIconPanel from "../../components/AdminIconPanel";

// Update PageWrapper back to light theme
const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  font-family: 'Inter', sans-serif;
  position: relative;
`;

const Container = styled.div`
  padding: 2rem;
  flex: 1;
  max-width: 1400px;
  margin: 0 auto;
  width: 95%;
  position: relative;
  z-index: 1;
`;

const HeaderSection = styled.div`
  margin: 1rem auto 3rem;
  text-align: center;
  position: relative;
  padding: 3rem 0;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 150px;
    height: 4px;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    border-radius: 2px;
  }
`;

const Title = styled(Typography)`
  font-family: 'Inter', sans-serif;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 3.2rem;
  margin: 0 auto;
  text-align: center;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  padding: 0 1rem;

  svg {
    font-size: 2.8rem;
    color: #6366f1;
    filter: drop-shadow(0 2px 4px rgba(99, 102, 241, 0.2));
  }
`;

const StyledTableContainer = styled(TableContainer)`
  border-radius: 16px;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.1);
  
  .MuiTable-root {
    background: transparent;
  }

  .MuiTableHead-root {
    background: #f1f5f9;
    
    .MuiTableCell-head {
      font-weight: 700;
      color: #1e293b;
      font-size: 0.95rem;
      padding: 1.2rem;
      font-family: 'Inter', sans-serif;
      text-transform: uppercase;
      letter-spacing: 1px;
      border: none;
      text-align: center;
    }
  }

  .MuiTableBody-root {
    .MuiTableRow-root {
      transition: all 0.2s ease;
      
      &:hover {
        background: #f8fafc;
        transform: translateY(-1px);
      }
    }

    .MuiTableCell-body {
      padding: 1rem;
      font-family: 'Inter', sans-serif;
      color: #334155;
      text-align: center;
      border-bottom: 1px solid #e2e8f0;
    }
  }
`;

const UserInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px;
  transition: all 0.2s ease;
`;

const UserName = styled.div`
  font-weight: 600;
  color: #1e293b;
  font-size: 1rem;
  position: relative;
  padding-bottom: 4px;

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: #6366f1;
    transition: width 0.2s ease;
  }

  &:hover:after {
    width: 100%;
  }
`;

const UserEmail = styled.div`
  color: #64748b;
  font-size: 0.9rem;
  padding: 4px 12px;
  background: #f1f5f9;
  border-radius: 20px;
  transition: all 0.2s ease;

  &:hover {
    background: #e2e8f0;
    color: #1e293b;
  }
`;

const UserRole = styled(Box)`
  font-weight: 600;
  color: #6366f1;
  background: #eff6ff;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
  }
`;

const StatusChip = styled.span`
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  
  ${props => {
    switch (props.status) {
      case 'pending':
        return `
          background: #fef3c7;
          color: #92400e;
        `;
      case 'suspended':
        return `
          background: #fee2e2;
          color: #991b1b;
        `;
      case 'active':
        return `
          background: #dcfce7;
          color: #166534;
        `;
      default:
        return `
          background: #f1f5f9;
          color: #475569;
        `;
    }
  }}

  &:before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
`;

const ActionButton = styled(Button)`
  text-transform: none;
  border-radius: 8px;
  padding: 6px 16px;
  font-weight: 600;
  font-size: 0.875rem;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s ease;
  min-width: 120px;
  
  &:hover {
    transform: translateY(-2px);
  }

  &.MuiButton-containedSuccess {
    background: #22c55e;
    &:hover {
      background: #16a34a;
    }
  }

  &.MuiButton-containedError {
    background: #ef4444;
    &:hover {
      background: #dc2626;
    }
  }

  &.MuiButton-containedWarning {
    background: #f59e0b;
    &:hover {
      background: #d97706;
    }
  }

  .icon {
    margin-right: 6px;
    font-size: 1rem;
  }
`;

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8.1px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;

  .loading-text {
    color: #E0E0E0;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 1.2rem;
  }
`;

// Update toast styles in component functions
const toastStyles = {
  success: {
    style: {
      background: '#2ecc71',
      color: '#fff',
      borderRadius: '8px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: '500',
      padding: '16px',
    },
    progressStyle: { 
      background: 'rgba(255, 255, 255, 0.3)'
    }
  },
  error: {
    style: {
      background: '#e74c3c',
      color: '#fff',
      borderRadius: '8px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: '500',
      padding: '16px',
    },
    progressStyle: { 
      background: 'rgba(255, 255, 255, 0.3)'
    }
  },
  warning: {
    style: {
      background: '#f39c12',
      color: '#fff',
      borderRadius: '8px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: '500',
      padding: '16px',
    },
    progressStyle: { 
      background: 'rgba(255, 255, 255, 0.3)'
    }
  }
};

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/auth/users");
      const filteredUsers = response.data.filter(
        (user) => user.role && user.role !== "Admin"
      );
      setUsers(filteredUsers);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
    }
  };

  const handleApproval = async (userId, action) => {
    try {
      await axios.post(
        `http://localhost:5000/api/auth/users/${userId}/approve`,
        { action }
      );
      fetchUsers();
      
      if (action === "approve") {
        toast.success(`User has been approved successfully!`, toastStyles.success);
      } else {
        toast.error(`User has been rejected!`, toastStyles.error);
      }
    } catch (error) {
      console.error("Error handling approval:", error);
      toast.error("Error handling approval!", toastStyles.error);
    }
  };

  const handleToggleSuspend = async (userId, currentStatus) => {
    const action = currentStatus === "suspended" ? "activate" : "suspend";

    try {
      const response = await axios.post(
        `http://localhost:5000/api/auth/users/${userId}/${action}`
      );

      if (response.data.success) {
        if (action === "activate") {
          toast.success(response.data.message, toastStyles.success);
        } else {
          toast.warning(response.data.message, toastStyles.warning);
        }
        await fetchUsers();
      } else {
        toast.error(response.data.message || `Failed to ${action} user`, toastStyles.error);
      }
    } catch (error) {
      console.error(`Error trying to ${action} user:`, error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        `Failed to ${action} user. Please try again.`;

      toast.error(errorMessage, toastStyles.error);
    }
  };

  return (
    <PageWrapper>
      <Navbar />
      <AdminIconPanel />
      <Container style={{ marginLeft: '60px' }}>
        <HeaderSection>
          <FaUsers size={32} color="#2c3e50" />
          <Title variant="h4">User Account Management</Title>
        </HeaderSection>
        
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          style={{
            fontFamily: 'Inter, sans-serif'
          }}
          toastStyle={{
            borderRadius: '15px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            fontWeight: '500',
            padding: '16px'
          }}
        />

        {loading ? (
          <LoadingWrapper>
            <Typography variant="h6" style={{ color: '#2c3e50' }}>
              Loading users...
            </Typography>
          </LoadingWrapper>
        ) : (
          <StyledTableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <UserInfoContainer>
                        <UserName>{user.fullName}</UserName>
                      </UserInfoContainer>
                    </TableCell>
                    <TableCell>
                      <UserInfoContainer>
                        <UserEmail>{user.email}</UserEmail>
                      </UserInfoContainer>
                    </TableCell>
                    <TableCell>
                      <UserRole>{user.role}</UserRole>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={user.status}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </StatusChip>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ 
                        display: 'flex', 
                        gap: '10px', 
                        justifyContent: 'center',
                        flexWrap: 'wrap' 
                      }}>
                        {user.role === "Lawyer" && user.status === "pending" && (
                          <>
                            <ActionButton
                              variant="contained"
                              color="success"
                              onClick={() => handleApproval(user._id, "approve")}
                            >
                              <FaCheck className="icon" /> Approve
                            </ActionButton>
                            <ActionButton
                              variant="contained"
                              color="error"
                              onClick={() => handleApproval(user._id, "reject")}
                            >
                              <FaTimes className="icon" /> Reject
                            </ActionButton>
                          </>
                        )}
                        <ActionButton
                          variant="contained"
                          color={user.status === "suspended" ? "success" : "warning"}
                          onClick={() => handleToggleSuspend(user._id, user.status)}
                          disabled={loading}
                        >
                          {user.status === "suspended" ? (
                            <>
                              <FaCheck className="icon" /> Activate
                            </>
                          ) : (
                            <>
                              <FaUserShield className="icon" /> Suspend
                            </>
                          )}
                        </ActionButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </StyledTableContainer>
        )}
      </Container>
      <Footer />

      <style jsx="true">{`
        @media (max-width: 768px) {
          div[style*="margin-left: 60px"] {
            margin-left: 50px !important;
          }
        }
      `}</style>
    </PageWrapper>
  );
};

export default AdminUserManagement;
