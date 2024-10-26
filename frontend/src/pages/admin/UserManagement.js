import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/auth/users");
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
    }
  };

  const handleApproval = async (userId, action) => {
    try {
      await axios.post(`http://localhost:5000/api/auth/users/${userId}/approve`, { action });
      fetchUsers();
    } catch (error) {
      console.error("Error handling approval:", error);
    }
  };

  const handleToggleSuspend = async (userId, currentStatus) => {
    const action = currentStatus === "suspended" ? "activate" : "suspend";
    try {
      await axios.post(`http://localhost:5000/api/auth/users/${userId}/${action}`);
      fetchUsers();
    } catch (error) {
      console.error(`Error trying to ${action} user:`, error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`http://localhost:5000/api/auth/users/${userId}`);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const styles = {
    container: { padding: "20px" },
    heading: { marginBottom: "20px" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { padding: "12px", textAlign: "left", backgroundColor: "#f4f4f4", borderBottom: "1px solid #ddd" },
    td: { padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" },
    button: { padding: "8px 12px", border: "none", color: "white", cursor: "pointer", marginRight: "5px" },
    approveBtn: { backgroundColor: "#4caf50" }, // Green for approve
    rejectBtn: { backgroundColor: "#f44336" }, // Red for reject
    suspendBtn: { backgroundColor: "#ff9800" }, // Orange for suspend
    activateBtn: { backgroundColor: "#4caf50" }, // Green for activate
    deleteBtn: { backgroundColor: "#e91e63" }, // Pink for delete
    actionsTh: { 
        padding: "12px", 
        textAlign: "center", 
        backgroundColor: "#f4f4f4", 
        borderBottom: "1px solid #ddd" 
      },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>User Account Management</h2>
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Status</th>
              <th style={styles.actionsTh}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td style={styles.td}>{user.fullName}</td>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.td}>{user.role}</td>
                <td style={styles.td}>{user.status}</td>
                <td style={styles.td}>
                  {user.role === "lawyer" && user.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleApproval(user._id, "approve")}
                        style={{ ...styles.button, ...styles.approveBtn }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproval(user._id, "reject")}
                        style={{ ...styles.button, ...styles.rejectBtn }}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleToggleSuspend(user._id, user.status)}
                    style={{
                      ...styles.button,
                      ...(user.status === "suspended"
                        ? styles.activateBtn // Green when the button is to "Activate"
                        : styles.suspendBtn), // Orange when the button is to "Suspend"
                    }}
                  >
                    {user.status === "suspended" ? "Activate" : "Suspend"}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user._id)}
                    style={{ ...styles.button, ...styles.deleteBtn }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminUserManagement;
