"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  authAPI,
  getStoredToken,
  setStoredToken,
  getStoredUser,
  setStoredUser,
  clearStoredAuth,
} from "@/lib/api";

const AuthContext = createContext({
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
  clearError: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Log out and wipe auth state from memory and storage
   */
  const logout = useCallback(() => {
    clearStoredAuth();
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  /**
   * Fetch current user profile from backend using stored token
   */
  const refreshUser = useCallback(async () => {
    try {
      const activeToken = getStoredToken();
      if (!activeToken) {
        setUser(null);
        setToken(null);
        return null;
      }

      const res = await authAPI.getMe();
      if (res?.success && res.user) {
        setUser(res.user);
        setStoredUser(res.user);
        setToken(activeToken);
        return res.user;
      } else {
        logout();
        return null;
      }
    } catch (err) {
      // If 401 Unauthorized or invalid token, log out
      if (err.status === 401) {
        logout();
      }
      return null;
    }
  }, [logout]);

  /**
   * Initialize session from localStorage on application load
   */
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const storedToken = getStoredToken();
        const storedUser = getStoredUser();

        if (storedToken && storedUser) {
          // Fast hydrate from local storage
          setUser(storedUser);
          setToken(storedToken);

          // Verify token against backend in background
          try {
            const freshUser = await authAPI.getMe();
            if (isMounted && freshUser?.success && freshUser.user) {
              setUser(freshUser.user);
              setStoredUser(freshUser.user);
            }
          } catch (err) {
            if (isMounted && err.status === 401) {
              logout();
            }
          }
        } else {
          clearStoredAuth();
        }
      } catch (err) {
        console.error("Error during auth initialization:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [logout]);

  /**
   * Authenticate user (Student or Admin)
   * @param {{ email: string, password: string }} credentials
   */
  const login = async ({ email, password }) => {
    setError(null);
    try {
      const res = await authAPI.login({ email, password });
      if (res?.success && res.token && res.user) {
        setStoredToken(res.token);
        setStoredUser(res.user);
        setToken(res.token);
        setUser(res.user);
        return { success: true, user: res.user, role: res.user.role };
      }
      throw new Error(res?.message || "Login failed. Please try again.");
    } catch (err) {
      const msg = err.message || "Failed to authenticate. Please check your credentials.";
      setError(msg);
      return { success: false, error: msg };
    }
  };

  /**
   * Register a new student account
   * @param {{ name: string, email: string, password: string, department: string }} userData
   */
  const register = async (userData) => {
    setError(null);
    try {
      const res = await authAPI.register(userData);
      if (res?.success && res.token && res.user) {
        setStoredToken(res.token);
        setStoredUser(res.user);
        setToken(res.token);
        setUser(res.user);
        return { success: true, user: res.user, role: res.user.role };
      }
      throw new Error(res?.message || "Registration failed. Please try again.");
    } catch (err) {
      const msg = err.message || "Failed to register student account.";
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: Boolean(user && token),
    isLoading,
    error,
    login,
    register,
    logout,
    refreshUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
