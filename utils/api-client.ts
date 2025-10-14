import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  AxiosError,
} from "axios";
import TokenManager from "./token-manager";
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  RefreshResponse,
  MeResponse,
} from "../types";

interface ApiClientConfig {
  baseURL?: string;
  tokenKey?: string;
  refreshTokenKey?: string;
  endpoints: {
    login: string;
    register: string;
    logout: string;
    refresh: string;
    me: string;
  };
  onRefreshFailed?: () => void;
}

class ApiClient<T = Record<string, unknown>> {
  private axiosInstance: AxiosInstance;
  private tokenManager: TokenManager;
  private config: ApiClientConfig;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  }> = [];

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.tokenManager = new TokenManager(
      config.tokenKey,
      config.refreshTokenKey,
    );

    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.tokenManager.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean;
        };

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                return this.axiosInstance(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            await this.refreshToken();
            this.processQueue(null);
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError);
            this.tokenManager.clearTokens();
            this.config.onRefreshFailed?.();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      },
    );
  }

  private processQueue(error: unknown): void {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve(null);
      }
    });
    this.failedQueue = [];
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse<T>> {
    const response = await this.axiosInstance.post<AuthResponse<T>>(
      this.config.endpoints.login,
      credentials,
    );

    if (response.data.accessToken) {
      this.tokenManager.setToken(response.data.accessToken);
    }

    return response.data;
  }

  async register(
    credentials: RegisterCredentials<T>,
  ): Promise<AuthResponse<T>> {
    const response = await this.axiosInstance.post<AuthResponse<T>>(
      this.config.endpoints.register,
      credentials,
    );

    if (response.data.accessToken) {
      this.tokenManager.setToken(response.data.accessToken);
    }

    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.axiosInstance.post(this.config.endpoints.logout);
    } finally {
      this.tokenManager.clearTokens();
    }
  }

  async refreshToken(): Promise<void> {
    const response = await this.axiosInstance.post<RefreshResponse>(
      this.config.endpoints.refresh,
    );

    if (response.data.accessToken) {
      this.tokenManager.setToken(response.data.accessToken);
    }
  }

  async getCurrentUser(): Promise<MeResponse<T>> {
    const response = await this.axiosInstance.get<MeResponse<T>>(
      this.config.endpoints.me,
    );
    return response.data;
  }

  getTokenManager(): TokenManager {
    return this.tokenManager;
  }
}

export default ApiClient;
