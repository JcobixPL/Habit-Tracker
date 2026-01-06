import React from "react";

export default function AppShell({ children, onLogout }) {
  return (
    <div className="container">
      <div className="topbar">
        <div className="brand">
          <div>
            <div className="h1">Habit Tracker</div>
          </div>
        </div>

        <button className="btn btnDanger" onClick={onLogout}>
          Wyloguj
        </button>
      </div>

      {children}
    </div>
  );
}
