import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider.jsx";

export default function RegisterPage() {
  const nav = useNavigate();
  const auth = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function register() {
    setError("");
    if (password !== password2) {
      setError("Hasła muszą być takie same.");
      return;
    }
    setBusy(true);
    try {
      await auth.register(email, password);
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
            <div className="h1">Rejestracja</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div className="sub" style={{ marginBottom: 6 }}>
              Email
            </div>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="np. email@email.pl"
            />
          </div>

          <div className="grid2">
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
            <div>
              <div className="sub" style={{ marginBottom: 6 }}>
                Powtórz hasło
              </div>
              <input
                className="input"
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="powtórz hasło"
              />
            </div>
          </div>

          <button className="btn btnPrimary" disabled={busy} onClick={register}>
            Utwórz konto
          </button>

          <Link
            className="btn"
            to="/login"
            style={{ textDecoration: "none", textAlign: "center" }}
          >
            Wróć do logowania
          </Link>

          {error && <div className="error">{error}</div>}
        </div>
      </div>
    </div>
  );
}
