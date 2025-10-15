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
  User,
  MiddlewareContext,
  RakitConfig,
} from "../types";

interface ApiClientConfig extends RakitConfig {
  onRefreshFailed?: () => void;
}

class ApiClient<TUser extends User = User> {
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
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.tokenManager.getToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
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
              .then(() => this.axiosInstance(originalRequest))
              .catch((err) => Promise.reject(err));
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
    this.failedQueue.forEach(({ resolve, reject }) =>
      error ? reject(error) : resolve(null),
    );
    this.failedQueue = [];
  }

  private buildContext(user?: TUser): MiddlewareContext<TUser> {
    return {
      api: this.axiosInstance,
      getToken: () => this.tokenManager.getToken() ?? null,
      setToken: (token: string) => this.tokenManager.setToken(token),
      removeToken: () => this.tokenManager.clearTokens(),
      user,
    };
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse<TUser>> {
    const response = await this.axiosInstance.post<AuthResponse<TUser>>(
      this.config.endpoints.login,
      credentials,
    );
    const context = this.buildContext(response.data.user);
    await this.config.middleware?.onLogin?.(response.data, context);
    return response.data;
  }

  async register(
    credentials: RegisterCredentials,
  ): Promise<AuthResponse<TUser>> {
    const response = await this.axiosInstance.post<AuthResponse<TUser>>(
      this.config.endpoints.register,
      credentials,
    );
    const context = this.buildContext(response.data.user);
    await this.config.middleware?.onRegister?.(response.data, context);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.axiosInstance.post(this.config.endpoints.logout);
    } finally {
      const context = this.buildContext();
      await this.config.middleware?.onLogout?.(context);
    }
  }

  async refreshToken(): Promise<void> {
    const response = await this.axiosInstance.post<RefreshResponse>(
      this.config.endpoints.refresh,
    );
    const context = this.buildContext();
    await this.config.middleware?.onRefresh?.(response.data, context);
  }

  async getCurrentUser(): Promise<MeResponse<TUser>> {
    const response = await this.axiosInstance.get<MeResponse<TUser>>(
      this.config.endpoints.me,
    );
    const context = this.buildContext(response.data.user);
    await this.config.middleware?.onMe?.(response.data, context);
    return response.data;
  }

  getTokenManager(): TokenManager {
    return this.tokenManager;
  }

  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

export default ApiClient;
