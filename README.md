# RAkit

React authentication library with JWT, cookies, refresh tokens, protected routes, and hooks for backend integration.

## Features

- Quick setup with any backend API
- JWT and cookie-based authentication
- Automatic token refresh on 401
- Protected routes with React Router
- TypeScript support
- Zero configuration defaults
- React hooks API

## Installation

```bash
npm install rakit
# or
yarn add rakit
# or
pnpm add rakit
````

### Peer Dependencies

```bash
npm install react react-dom react-router-dom
```

## Quick Start

### 1. Wrap your app with `Rakit.Provider`

```tsx
import { Rakit } from 'rakit';

function App() {
  return (
    <Rakit.Provider
      config={{
        endpoints: {
          login: '/api/auth/login',
          register: '/api/auth/register',
          logout: '/api/auth/logout',
          refresh: '/api/auth/refresh',
          me: '/api/auth/me',
        },
        baseURL: 'http://localhost:3000', // optional
        tokenKey: 'access_token', // default
        refreshTokenKey: 'refresh_token', // default
      }}
    >
      <YourApp />
    </Rakit.Provider>
  );
}
```

### 2. Use the `useAuth` hook

```tsx
import { useAuth } from 'rakit';

function LoginPage() {
  const { login, isLoading } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({
        email: 'user@example.com',
        password: 'password123',
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return <form onSubmit={handleLogin}>{/* form fields */}</form>;
}
```

### 3. Protect routes

```tsx
import { Rakit } from 'rakit';
import { Routes, Route } from 'react-router-dom';

function App() {
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
    </Routes>
  );
}
```

## API Reference

### `Rakit.Provider`

Wraps your app and provides authentication context.

```ts
interface RakitConfig {
  endpoints: {
    login: string;
    register: string;
    logout: string;
    refresh: string;
    me: string;
  };
  baseURL?: string;
  tokenKey?: string; // default: 'access_token'
  refreshTokenKey?: string; // default: 'refresh_token'
}
```

### `useAuth` Hook

Returns authentication state and methods.

```ts
{
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}
```

**Types**

```ts
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
}

interface AuthUser {
  id: string;
  email: string;
  metadata?: Record<string, unknown>;
}
```

### `Rakit.Protected`

Protects routes that require authentication.

```ts
interface ProtectedProps {
  children: React.ReactNode;
  redirectTo?: string; // default: '/login'
  fallback?: React.ReactNode; // shown while loading
}
```

## Backend API Contract

### Login/Register Response

```json
{
  "user": { "id": "123", "email": "user@example.com" },
  "accessToken": "optional-if-using-httpOnly-cookies"
}
```

### Refresh Token Response

```json
{
  "accessToken": "optional-if-using-httpOnly-cookies"
}
```

### Get Current User Response

```json
{
  "user": { "id": "123", "email": "user@example.com" }
}
```

## Advanced Usage

### Custom User Type

```ts
interface CustomUser {
  name: string;
  role: string;
}

const { user } = useAuth<CustomUser>();

console.log(user?.metadata?.name);
console.log(user?.metadata?.role);
```

### Register with Additional Fields

```ts
await register({
  email: 'user@example.com',
  password: 'password123',
  metadata: { name: 'John Doe', age: 25 },
});
```

### Manual User Refetch

```ts
await updateProfile(data);
await refetchUser();
```

## How It Works

1. Authentication stores tokens in cookies.
2. Access tokens are automatically included in API requests.
3. On 401 errors, the refresh endpoint is called and the request retried.
4. `Rakit.Protected` ensures routes are only accessible to authenticated users.

## Best Practices

* Use httpOnly cookies for security.
* Wrap auth calls in try-catch blocks.
* Show loading states using `isLoading`.

```ts
if (isLoading) return <Spinner />;
```

## License

MIT

## Contributing

Open an issue or pull request for contributions.
