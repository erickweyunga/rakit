import React from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Rakit, useAuth } from "rakit";

// --- App Provider Setup ---
export function App() {
  return (
    <Rakit.Provider
      config={{
        endpoints: {
          login: "/api/auth/login",
          register: "/api/auth/register",
          logout: "/api/auth/logout",
          refresh: "/api/auth/refresh",
          me: "/api/auth/me",
        },
        baseURL: "http://localhost:3000", // optional
        tokenKey: "access_token", // optional
        refreshTokenKey: "refresh_token", // optional
      }}
    >
      <Router>
        <AppRoutes />
      </Router>
    </Rakit.Provider>
  );
}

// --- Define Routes ---
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <Rakit.Protected redirectTo="/login" fallback={<Loading />}>
            <Dashboard />
          </Rakit.Protected>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

// --- Login Page Example ---
function LoginPage() {
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    try {
      await login({ email, password });
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 40 }}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input name="email" type="email" required />
        </div>
        <div style={{ marginTop: 10 }}>
          <label>Password</label>
          <input name="password" type="password" required />
        </div>
        <button type="submit" disabled={isLoading} style={{ marginTop: 20 }}>
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

// --- Protected Dashboard Example ---
function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 40 }}>
      <h1>Dashboard</h1>
      <p>Welcome back, {user?.email}</p>
      <button onClick={logout} style={{ marginTop: 20 }}>
        Logout
      </button>
    </div>
  );
}

// --- Loading Component ---
function Loading() {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <p>Loading...</p>
    </div>
  );
}

// --- Render the App ---
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
