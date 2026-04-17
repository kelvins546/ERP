import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = "erp_local_auth_session";
const SUPERADMIN_EMAIL = "arksuperadmin@gmail.com";
const SUPERADMIN_PASSWORD = "123456";

export const AuthProvider = ({ children }) => {
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
    setIsLoadingPublicSettings(false);
    setAuthError(null);
    setAppPublicSettings({ id: "local-app", public_settings: {} });
    setIsLoadingAuth(true);

    try {
      const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        if (parsed?.email?.toLowerCase() === SUPERADMIN_EMAIL) {
          setUser(parsed);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Failed to restore auth session:", error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const login = async ({ email, password, projectSite }) => {
    const normalizedEmail = (email || "").trim().toLowerCase();
    const normalizedPassword = (password || "").trim();

    if (!projectSite?.id) {
      return { success: false, message: "Please select a project site." };
    }

    if (
      normalizedEmail !== SUPERADMIN_EMAIL ||
      normalizedPassword !== SUPERADMIN_PASSWORD
    ) {
      return {
        success: false,
        message: "Invalid email or password.",
      };
    }

    const authUser = {
      id: "superadmin-local",
      email: SUPERADMIN_EMAIL,
      first_name: "Ark",
      last_name: "Superadmin",
      role: "super admin",
      project_site_id: projectSite.id,
      project_site_name: projectSite.name,
    };

    setUser(authUser);
    setIsAuthenticated(true);
    setAuthError(null);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const navigateToLogin = () => {
    setAuthError({ type: "auth_required" });
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
        login,
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
