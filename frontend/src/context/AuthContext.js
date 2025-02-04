import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      const token = sessionStorage.getItem("token");
      if (token) {
        try {
          // Verify token hasn't expired
          const decodedToken = JSON.parse(atob(token.split(".")[1]));
          if (decodedToken.exp * 1000 < Date.now()) {
            console.log("Token expired, logging out");
            logout();
            return;
          }

          const userData = {
            _id: sessionStorage.getItem("userid"),
            fullName: sessionStorage.getItem("name"),
            email: sessionStorage.getItem("email"),
            role: sessionStorage.getItem("role"),
            token,
          };
          console.log("Restoring auth state:", userData);
          setUser(userData);
        } catch (error) {
          console.error("Error parsing token:", error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

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
