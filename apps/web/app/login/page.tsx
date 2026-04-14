"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "../../lib/api/auth";
import { setToken } from "../../lib/auth/token";
import { ApiError } from "../../lib/api/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@vivanta.local");
  const [password, setPassword] = useState("ChangeMe123!");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await login(email, password);
      setToken(res.data.accessToken);
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Login failed");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="loginWrap">
      <div className="loginInner">
        <div className="stack">
          <h1 style={{ marginBottom: 0 }}>Vivanta Ops</h1>
          <p style={{ marginTop: 6 }}>
            Operator login for the internal UI. A JWT is stored in localStorage after sign-in.
          </p>
        </div>

        <form className="card stack" onSubmit={onSubmit}>
          <div className="cardTitle">Sign in</div>
          <div className="formGrid formGridSingle">
            <div className="stack">
              <label className="kvKey">Email</label>
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="stack">
              <label className="kvKey">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          {error ? (
            <div className="callout" style={{ borderColor: "rgba(180, 35, 24, 0.35)", background: "rgba(180, 35, 24, 0.06)" }}>
              <div className="row">
                <span className="pill pillDanger">Error</span>
                <strong>Could not sign in</strong>
              </div>
              <div className="muted" style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>
                {error}
              </div>
            </div>
          ) : null}

          <div className="row">
            <button className="btn btnPrimary" disabled={busy}>
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
