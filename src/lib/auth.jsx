import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { getSession, getStaffProfile, onAuthStateChange, logout as doLogout } from "./store";

const AuthContext = createContext({ session: null, staff: null, loading: true, error: null, hasRole: () => false, logout: async () => {} });

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function hydrate(s) {
    if (!s?.user?.id) {
      setSession(null); setStaff(null); setError(null); setLoading(false); return;
    }
    try {
      const profile = await getStaffProfile(s.user.id);
      if (!profile) {
        await doLogout();
        setSession(null); setStaff(null);
      } else {
        setSession(s); setStaff(profile);
      }
      setError(null);
    } catch (err) {
      setSession(null); setStaff(null);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    getSession().then((s) => { if (active) hydrate(s); }).catch((err) => { setError(err); setLoading(false); });
    const unsubscribe = onAuthStateChange((s) => { if (active) setTimeout(() => { if (active) hydrate(s); }, 0); });
    return () => { active = false; unsubscribe(); };
  }, []);

  async function logout() {
    await doLogout();
    setSession(null); setStaff(null); setError(null);
  }

  const contextValue = useMemo(() => {
    const roleHierarchy = { owner: 3, admin: 2, editor: 1 };
    
    function hasRole(requiredRole) {
      if (!staff || !staff.role) return false;
      const staffLevel = roleHierarchy[staff.role] || 0;
      const requiredLevel = roleHierarchy[requiredRole] || 0;
      return staffLevel >= requiredLevel;
    }

    return { session, staff, loading, error, isLoggedIn: !!session && !!staff, hasRole, logout };
  }, [session, staff, loading, error]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
