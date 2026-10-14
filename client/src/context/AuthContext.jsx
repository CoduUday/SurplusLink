import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() =>
    localStorage.getItem("surpluslink_token"),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check user session on initial mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedToken = localStorage.getItem("surpluslink_token");
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        if (response.data?.success) {
          setUser(response.data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.warn(
          "Session expired or invalid token:",
          err.response?.data?.message || err.message,
        );
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // Register function
  const register = async (userData) => {
    setError(null);
    try {
      const response = await api.post("/auth/register", userData);
      const { token: receivedToken, user: receivedUser } = response.data;

      if (receivedToken) {
        localStorage.setItem("surpluslink_token", receivedToken);
        setToken(receivedToken);
        setUser(receivedUser);
      }
      return { success: true, user: receivedUser };
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Registration failed. Please check your inputs.";
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // Login function
  const login = async (email, password) => {
    setError(null);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token: receivedToken, user: receivedUser } = response.data;

      if (receivedToken) {
        localStorage.setItem("surpluslink_token", receivedToken);
        setToken(receivedToken);
        setUser(receivedUser);
      }
      return { success: true, user: receivedUser };
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Login failed. Invalid email or password.";
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("surpluslink_token");
    setToken(null);
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        error,
        login,
        register,
        logout,
        setError,
      }}
    >
      {children}
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

export default AuthContext;
