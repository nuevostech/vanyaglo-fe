
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            (response.status === 404
              ? "Admin login endpoint not found. Check the backend route."
              : "Invalid admin credentials.")
        );
      }

      const data = result.data;

      if (
        !data?.access_token ||
        data?.user?.role !== "ADMIN"
      ) {
        throw new Error("Invalid admin login response.");
      }

      
localStorage.setItem(
  "admin_access_token",
  data.access_token
);

localStorage.setItem(
  "token",
  data.access_token
);

localStorage.setItem(
  "accessToken",
  data.access_token
);

localStorage.setItem(
  "admin_user",
  JSON.stringify(data.user)
);
navigate("/admin", { replace: true });
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the backend. Check that it is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <form onSubmit={handleLogin} style={styles.card}>
        <h2 style={styles.heading}>VanyaGlo Admin</h2>

        <p style={styles.subtitle}>
          Sign in to manage your store
        </p>

        <label htmlFor="admin-email">Email</label>

        <input
          id="admin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
          placeholder="Admin email"
          style={styles.input}
        />

        <label htmlFor="admin-password">Password</label>

        <div style={styles.passwordWrapper}>
          <input
            id="admin-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Admin password"
            style={styles.passwordInput}
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword((previous) => !previous)
            }
            aria-label={
              showPassword ? "Hide password" : "Show password"
            }
            title={
              showPassword ? "Hide password" : "Show password"
            }
            style={styles.eyeButton}
          >
            {showPassword ? (
              // Eye-off icon
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7-.4 1.1-1.2 2.4-2.3 3.5" />
                <path d="M6.2 6.2C3.9 7.7 2.6 10 2.5 12c1 2.5 4.5 7 9.5 7 1.3 0 2.5-.3 3.5-.8" />
              </svg>
            ) : (
              // Eye icon
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {error && (
          <p role="alert" style={styles.error}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f2f8",
    padding: 20,
    boxSizing: "border-box",
  },

  card: {
    width: "100%",
    maxWidth: 400,
    boxSizing: "border-box",
    background: "#fff",
    padding: 32,
    borderRadius: 16,
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
  },

  heading: {
    textAlign: "center",
    color: "#3a214d",
  },

  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 24,
  },

  input: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: 12,
    marginTop: 8,
    marginBottom: 18,
    border: "1px solid #ddd",
    borderRadius: 8,
  },

  passwordWrapper: {
    position: "relative",
    width: "100%",
    marginTop: 8,
    marginBottom: 18,
  },

  passwordInput: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 45px 12px 12px",
    border: "1px solid #ddd",
    borderRadius: 8,
    outlineOffset: 2,
  },

  eyeButton: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
    border: "none",
    background: "transparent",
    color: "#666",
    cursor: "pointer",
  },

  error: {
    color: "red",
    fontSize: 14,
  },

  button: {
    width: "100%",
    padding: 12,
    marginTop: 20,
    background: "#3a214d",
    color: "#fff",
    border: 0,
    borderRadius: 8,
  },
};
