import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./providers/AuthProvider.jsx";

import LoginPage from "../features/auth/LoginPage.jsx";
import RegisterPage from "../features/auth/RegisterPage.jsx";
import DashboardPage from "../features/dashboard/DashboardPage.jsx";

function Protected({ children }) {
  const { isAuthed, status } = useAuth();
  if (status === "idle") return null;
  return isAuthed ? children : <Navigate to="/login" replace />;
}

export default function AppRouter() {
  const { isAuthed } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthed ? "/app" : "/login"} replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/app"
        element={
          <Protected>
            <DashboardPage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
