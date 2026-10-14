import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { PageLoading } from "./DataState";

export default function RequireRole({ roles, children }) {
  const { loading, staff } = useAuth();
  const loc = useLocation();
  if (loading) return <PageLoading label="Checking staff access..." />;
  if (!staff || !roles.includes(staff.role)) return <Navigate to="/admin/dashboard" state={{ from: loc.pathname }} replace />;
  return children;
}
