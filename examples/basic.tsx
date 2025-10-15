import React from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { User, Rakit, useAuth } from "rakit";

interface MyUser extends User {
  name: string;
  role: string;
}

export function App() {
  return (
    <Rakit.Provider<MyUser>
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
        middleware: {
          onLogin: (data, ctx) => {
            const user = data.user;
            if (!user) return;
            console.log("User logged in:", user);
            ctx.setToken(user.name + "-token");
          },
          onLogout: (ctx) => {
            console.log("User logged out");
            ctx.removeToken();
          },
          onRefresh: (data, ctx) => {
            console.log("Token refreshed", data);
          },
          onMe: (data, ctx) => {
            const user = data.user;
            if (!user) return;
            console.log("Current user fetched:", user);
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
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

// --- Login Page ---
function LoginPage() {
  const { login, isLoading } = useAuth<MyUser>();

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

// --- Dashboard ---
function Dashboard() {
  const { user, logout, refetchUser } = useAuth<MyUser>();

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 40 }}>
      <h1>Dashboard</h1>
      <p>
        Welcome back, {user?.name} ({user?.role})
      </p>
      <p>Email: {user?.email}</p>
      <button onClick={logout} style={{ marginTop: 10 }}>
        Logout
      </button>
      <button onClick={refetchUser} style={{ marginTop: 10, marginLeft: 10 }}>
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
