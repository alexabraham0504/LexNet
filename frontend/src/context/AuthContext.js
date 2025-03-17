import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUserStatus = async () => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) return false;

      const response = await axios.get("https://lexnet-backend.onrender.com/api/auth/check-status", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.status === "suspended") {
        handleSuspension(response.data);
        return false;
      }
      return true;
    } catch (error) {
      if (error.response?.status === 403) {
        handleSuspension(error.response.data);
      }
      return false;
    }
  };

  const handleSuspension = (data) => {
    logout();
    toast.error(
      <div>
        <h4>Account Suspended</h4>
        <p>{data.message}</p>
        {data.suspensionReason && <p>Reason: {data.suspensionReason}</p>}
        <p>Please contact administrator for assistance.</p>
      </div>,
      {
        duration: 10000,
        position: "top-center",
      }
    );
  };

  useEffect(() => {
    const checkAuth = async () => {
      await checkUserStatus();
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Check status more frequently (every 30 seconds)
  useEffect(() => {
    if (user) {
      const intervalId = setInterval(checkUserStatus, 30000);
      return () => clearInterval(intervalId);
    }
  }, [user]);

  const login = (userData) => {
    if (!userData.token) {
      console.error("No token provided in userData");
      return;
    }

    console.log("Setting user data:", userData);
    setUser(userData);

    // Store auth data in sessionStorage
    sessionStorage.setItem("token", userData.token);
    sessionStorage.setItem("userid", userData._id);
    sessionStorage.setItem("name", userData.fullName);
    sessionStorage.setItem("email", userData.email);
    sessionStorage.setItem("role", userData.role);
    sessionStorage.setItem("phone", userData.phone);
  };

  const logout = () => {
    console.log("Logging out user");
    setUser(null);
    sessionStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
