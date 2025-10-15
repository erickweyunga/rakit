import React from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { User, Session, Rakit, useAuth } from "rakit";

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
    <Rakit.Provider<MyUser, MySession>
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
            console.log("User logged in:", data.user);
            ctx.setToken(data.session.access_token);
            localStorage.setItem("refresh_token", data.session.refresh_token);
          },
          onLogout: (ctx) => {
            console.log("User logged out");
            ctx.removeToken();
            localStorage.removeItem("refresh_token");
          },
          onRefresh: (session, ctx) => {
            console.log("Token refreshed:", session);
            if (session.access_token) ctx.setToken(session.access_token);
          },
          onMe: (data) => {
            console.log("Current user fetched:", data.user);
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
  const { login, isLoading } = useAuth<MyUser, MySession>();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    try {
      const response = await login({ email, password });
      console.log("Access token:", response.session.access_token);
      console.log("Refresh token:", response.session.refresh_token);
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
  const { user, session, logout, refetchUser } = useAuth<MyUser, MySession>();

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
