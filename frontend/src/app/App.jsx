import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./providers/AuthProvider.jsx";
import AppRouter from "./router.jsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AuthProvider>
  );
}
