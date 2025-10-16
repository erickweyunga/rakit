import React from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Rakit, useAuth } from "rakit";
import type { User, Session } from "rakit";

// --- Extend User type ---
interface MyUser extends User {
  name: string;
  role: string;
}

// --- Extend Session type for tokens or extra info ---
interface MySession extends Session {
  access_token: string;
  refresh_token: string;
}

// --- App Component ---
export function App() {
  return (
    <Rakit.Provider<MyUser & MySession> // using TResponse as extended type
      config={{
        endpoints: {
          login: "/api/auth/login",
          register: "/api/auth/register",
          logout: "/api/auth/logout",
          refresh: "/api/auth/refresh",
          me: "/api/auth/me",
        },
        baseURL: "http://localhost:3000",
        tokenKey: "access_token",
        refreshTokenKey: "refresh_token",
        callbacks: {
          login: (data, ctx) => {
            console.log("User logged in:", data.email);
            ctx.setToken(data.access_token);
            localStorage.setItem("refresh_token", data.refresh_token);
          },
          logout: (ctx) => {
            console.log("User logged out");
            ctx.removeToken();
            localStorage.removeItem("refresh_token");
          },
          refresh: (session, ctx) => {
            console.log("Token refreshed:", session);
            if (session.access_token) {
              ctx.setToken(session.access_token);
            }
          },
          me: (data) => {
            console.log("Current user fetched:", data.email);
          },
        },
      }}
    >
      <Router>
        <AppRoutes />
      </Router>
    </Rakit.Provider>
  );
}

// --- Routes ---
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
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// --- Login Page ---
function LoginPage() {
  const { login, isLoading } = useAuth<MyUser & MySession>();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    try {
      const response = await login({ email, password });
      console.log("Access token:", response.access_token);
      console.log("Refresh token:", response.refresh_token);
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

// --- Dashboard ---
function Dashboard() {
  const { data, logout, refetch } = useAuth<MyUser & MySession>();

  const user = data?.user as MyUser;
  const session = data;

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 40 }}>
      <h1>Dashboard</h1>
      <p>
        Welcome back, {user?.name} ({user?.role})
      </p>
      <p>Email: {user?.email}</p>
      <p>Access Token: {session?.access_token}</p>
      <button onClick={logout} style={{ marginTop: 10 }}>
        Logout
      </button>
      <button onClick={refetch} style={{ marginTop: 10, marginLeft: 10 }}>
        Refresh User
      </button>
    </div>
  );
}

// --- Loading ---
function Loading() {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <p>Loading...</p>
    </div>
  );
}

// --- Render App ---
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
