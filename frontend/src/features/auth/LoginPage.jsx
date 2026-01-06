import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider.jsx";

export default function LoginPage() {
  const nav = useNavigate();
  const auth = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function login() {
    setBusy(true);
    setError("");
    try {
      await auth.login(email, password);
      nav("/app");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="loginWrap">
      <div className="panel loginCard">
        <div className="brand" style={{ marginBottom: 12 }}>
          <div>
            <div className="h1">Zaloguj się</div>
          </div>
        </div>

        <div className="grid2">
          <div>
            <div className="sub" style={{ marginBottom: 6 }}>
              Email
            </div>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
            />
          </div>
          <div>
            <div className="sub" style={{ marginBottom: 6 }}>
              Hasło
            </div>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="hasło"
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button
            className="btn btnPrimary"
            disabled={busy}
            onClick={login}
            style={{ flex: 1 }}
          >
            Zaloguj
          </button>
          <Link
            className="btn"
            to="/register"
            style={{ flex: 1, textDecoration: "none", textAlign: "center" }}
          >
            Rejestracja
          </Link>
        </div>

        <div className="hr" />

        <div className="note">
          Swagger API:{" "}
          <a href="http://localhost:4000/api-docs" target="_blank" rel="noreferrer">
            http://localhost:4000/api-docs
          </a>
        </div>

        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}
