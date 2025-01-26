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
} from "@mui/material";
import { FaCheck, FaTimes, FaUserShield } from "react-icons/fa";
import styled from "styled-components";
import Footer from "../../components/footer/footer-admin";
import Navbar from "../../components/navbar/navbar-admin";

const Container = styled.div`
  padding: 20px;
  background-color: #f9f9f9;
`;

const Title = styled(Typography)`
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: bold;
`;

const ActionButton = styled(Button)`
  margin-right: 5px;
`;

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
      toast.success(`User has been ${action}d successfully!`);
    } catch (error) {
      console.error("Error handling approval:", error);
      toast.error("Error handling approval!");
    }
  };

  const handleToggleSuspend = async (userId, currentStatus) => {
    const action = currentStatus === "suspended" ? "activate" : "suspend";

    try {
      const response = await axios.post(
        `http://localhost:5000/api/auth/users/${userId}/${action}`
      );

      if (response.data.success) {
        toast.success(response.data.message);
        await fetchUsers(); // Refresh the user list
      } else {
        toast.error(response.data.message || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Error trying to ${action} user:`, error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        `Failed to ${action} user. Please try again.`;

      toast.error(errorMessage);
    }
  };

  return (
    <>
      <Navbar />
      <Container>
        <ToastContainer />
        <Title variant="h4">User Account Management</Title>
        {loading ? (
          <Typography>Loading users...</Typography>
        ) : (
          <TableContainer component={Paper}>
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
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.status}</TableCell>
                    <TableCell>
                      <div style={{ display: "flex", gap: "10px" }}>
                        {user.role === "Lawyer" &&
                          user.status === "pending" && (
                            <>
                              <ActionButton
                                variant="contained"
                                color="success"
                                onClick={() =>
                                  handleApproval(user._id, "approve")
                                }
                              >
                                <FaCheck /> Approve
                              </ActionButton>
                              <ActionButton
                                variant="contained"
                                color="error"
                                onClick={() =>
                                  handleApproval(user._id, "reject")
                                }
                              >
                                <FaTimes /> Reject
                              </ActionButton>
                            </>
                          )}
                        <ActionButton
                          variant="contained"
                          color={
                            user.status === "suspended" ? "success" : "warning"
                          }
                          onClick={() =>
                            handleToggleSuspend(user._id, user.status)
                          }
                          disabled={loading}
                        >
                          {user.status === "suspended" ? (
                            <>
                              <FaCheck style={{ marginRight: "5px" }} />{" "}
                              Activate
                            </>
                          ) : (
                            <>
                              <FaUserShield style={{ marginRight: "5px" }} />{" "}
                              Suspend
                            </>
                          )}
                        </ActionButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
      <Footer />
    </>
  );
};

export default AdminUserManagement;
