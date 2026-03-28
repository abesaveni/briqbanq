import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

/** Decode a JWT payload without a library — never throws. */
const decodeJwt = (token) => {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(
      decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      )
    );
  } catch {
    return null;
  }
};

/** Normalise a user object returned from the backend into a predictable shape. */
const normaliseUser = (userData) => {
  if (!userData) return null;
  // user_roles is an array of {role_type: "ADMIN", status: "APPROVED", ...}
  // prefer an APPROVED role; fall back to first role; fall back to userData.role
  const approvedRole = userData.user_roles?.find(r =>
    r.status === "APPROVED" || r.status === "approved"
  )?.role_type;
  const firstRole = userData.user_roles?.[0]?.role_type;
  const roleRaw = userData.role || approvedRole || firstRole || "borrower";
  const role = roleRaw.toLowerCase();
  return {
    ...userData,
    role,
    first_name: userData.first_name || userData.name?.split(" ")[0] || "User",
    last_name:
      userData.last_name ||
      userData.name?.split(" ").slice(1).join(" ") ||
      "",
    name:
      userData.name ||
      (userData.first_name
        ? `${userData.first_name} ${userData.last_name || ""}`.trim()
        : "User"),
  };
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [currentRole, setCurrentRole] = useState(
    () => localStorage.getItem("currentRole") || "investor"
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("currentRole");
    setToken(null);
    setUser(null);
  }, []);

  // Listen for unauthorized events from the API interceptor
  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout]);

  // Fetch fresh profile whenever the token changes
  useEffect(() => {
    if (!token) return;

    const decoded = decodeJwt(token);
    if (!decoded) {
      logout();
      return;
    }

    // Check expiry
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      logout();
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await api.get("/api/v1/identity/me");
        if (cancelled) return;
        const normalised = normaliseUser(res.data);
        setUser(normalised);
        localStorage.setItem("user", JSON.stringify(normalised));
        // Only update currentRole if none is already set (don't override user's selection)
        if (!localStorage.getItem("currentRole") && normalised?.role) {
          setCurrentRole(normalised.role);
          localStorage.setItem("currentRole", normalised.role);
        }
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401) {
          logout();
        }
      }
    })();

    return () => { cancelled = true; };
  }, [token, logout]);

  const login = (newToken, userData, role) => {
    const normalised = normaliseUser(userData);
    localStorage.setItem("token", newToken);
    if (normalised) {
      localStorage.setItem("user", JSON.stringify(normalised));
      localStorage.setItem("currentRole", normalised.role);
    } else if (role) {
      localStorage.setItem("currentRole", role);
    }
    setToken(newToken);
    setUser(normalised);
    if (normalised) setCurrentRole(normalised.role);
    else if (role) setCurrentRole(role);
  };

  const switchRole = (role) => {
    setCurrentRole(role);
    localStorage.setItem("currentRole", role);
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedData };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, updateUser, currentRole, switchRole }}
    >
      {children}
    </AuthContext.Provider>
  );
};
