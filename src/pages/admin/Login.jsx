import React, { useEffect, useState } from "react";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../../lib/store";
import { useAuth } from "../../lib/auth";
import { useSEO } from "../../lib/seo";

export default function AdminLogin() {
  useSEO({ title: "Staff login", description: "Company staff login for the Haven admin panel.", path: "/admin", noindex: true });
  const navigate = useNavigate();
  const loc = useLocation();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      const dest = loc.state?.from && loc.state.from !== "/admin" ? loc.state.from : "/admin/dashboard";
      navigate(dest, { replace: true });
    }
  }, [authLoading, isLoggedIn, navigate, loc.state]);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await login(email, password);
    setSubmitting(false);
    if (!res.ok) setError(res.error || "Incorrect email or password.");
    // On success, the AuthProvider's session listener picks up the new
    // session and the effect above handles the redirect.
  }

  return (
    <main className="admin-login container">
      <div className="admin-login-card">
        <div className="admin-login-icon"><ShieldCheck size={22} /></div>
        <h1>Staff login</h1>
        <p className="muted">Only authorized Haven staff can manage properties, agents and content from here.</p>
        <form onSubmit={submit}>
          <label className="sr-only" htmlFor="staff-email">Staff email</label>
          <input id="staff-email" required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          <label className="sr-only" htmlFor="staff-password">Staff password</label>
          <div className="mini-input" style={{ height: 46 }}>
            <Lock size={14} />
            <input id="staff-password" required type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="dark-btn full" type="submit" disabled={submitting}>{submitting ? "Signing in..." : "Sign in"} <ArrowRight size={15} /></button>
        </form>
        <p className="admin-demo-note">
          Staff accounts are created under Authentication → Users, then authorized by adding the user to <code>staff_profiles</code>. There is no public staff sign-up.
        </p>
      </div>
    </main>
  );
}
