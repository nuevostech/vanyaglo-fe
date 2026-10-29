
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedAdminRoute() {
  const token = localStorage.getItem("admin_access_token");

  let user = null;

  try {
    user = JSON.parse(
      localStorage.getItem("admin_user") || "null"
    );
  } catch {
    user = null;
  }

  if (!token || user?.role !== "ADMIN") {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
