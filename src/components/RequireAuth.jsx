import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { PageLoading } from "./DataState";

export default function RequireAuth({ children }) {
  const { isLoggedIn, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <PageLoading label="Checking staff access..." />;
  if (!isLoggedIn) return <Navigate to="/admin" state={{ from: loc.pathname }} replace />;
  return children;
}
