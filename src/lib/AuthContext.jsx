import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "@/api/base44Client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // We keep all the exact same variables so your layout doesn't crash
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    // 1. Bypass the Base44 "Public Settings" check
    setIsLoadingPublicSettings(false);
    setAuthError(null);
    setAppPublicSettings({ id: "local-app", public_settings: {} });

    // 2. Inject a Dummy Admin User to bypass the login screen
    setIsLoadingAuth(true);

    // Fake network delay to let the UI transition smoothly
    setTimeout(() => {
      setUser({
        id: "admin-123",
        email: "admin@erp.local",
        first_name: "Kelvin",
        last_name: "Admin",
        role: "super admin",
      });
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
    }, 500);
  };

  const logout = () => {
    console.log("Logout clicked - Local dev mode active");
  };

  const navigateToLogin = () => {
    console.log("Login navigation bypassed - Local dev mode active");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAppState,
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
