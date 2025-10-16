import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  AxiosError,
} from "axios";
import TokenManager from "./token-manager";
import type { RakitConfig, MiddlewareContext, ApiError } from "../types";

interface ApiClientConfig<TResponse extends Record<string, any>>
  extends RakitConfig<TResponse> {
  onRefreshFailed?: () => void;
}

export default class ApiClient<TResponse extends Record<string, any> = any> {
  private axiosInstance: AxiosInstance;
  private tokenManager: TokenManager;
  private config: ApiClientConfig<TResponse>;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  }> = [];

  constructor(config: ApiClientConfig<TResponse>) {
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

  /** ---- INTERCEPTORS ---- */
  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use((config) => {
      const token = this.tokenManager.getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean;
        };

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) =>
              this.failedQueue.push({ resolve, reject }),
            )
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

  private processQueue(error: unknown) {
    this.failedQueue.forEach(({ resolve, reject }) =>
      error ? reject(error) : resolve(null),
    );
    this.failedQueue = [];
  }

  /** ---- CONTEXT ---- */
  private buildContext(): MiddlewareContext {
    return {
      api: this.axiosInstance,
      getToken: () => this.tokenManager.getToken() ?? null,
      setToken: (token: string) => this.tokenManager.setToken(token),
      removeToken: () => this.tokenManager.clearTokens(),
    };
  }

  getContext(): MiddlewareContext {
    return this.buildContext();
  }

  /** ---- AUTH ACTIONS ---- */
  async login(credentials: Record<string, any>): Promise<TResponse> {
    const res = await this.axiosInstance.post<TResponse>(
      this.config.endpoints.login,
      credentials,
    );
    await this.config.callbacks?.login?.(res.data, this.buildContext());
    return res.data;
  }

  async register(credentials: Record<string, any>): Promise<TResponse> {
    const res = await this.axiosInstance.post<TResponse>(
      this.config.endpoints.register,
      credentials,
    );
    await this.config.callbacks?.register?.(res.data, this.buildContext());
    return res.data;
  }

  async logout(): Promise<void> {
    try {
      await this.axiosInstance.post(this.config.endpoints.logout);
    } finally {
      await this.config.callbacks?.logout?.(this.buildContext());
      this.tokenManager.clearTokens();
    }
  }

  async refreshToken(): Promise<TResponse> {
    const res = await this.axiosInstance.post<TResponse>(
      this.config.endpoints.refresh,
    );
    await this.config.callbacks?.refresh?.(res.data, this.buildContext());
    return res.data;
  }

  async me(): Promise<TResponse> {
    const res = await this.axiosInstance.get<TResponse>(
      this.config.endpoints.me,
    );
    await this.config.callbacks?.me?.(res.data, this.buildContext());
    return res.data;
  }

  /** ---- UTILITIES ---- */
  getTokenManager() {
    return this.tokenManager;
  }

  getAxiosInstance() {
    return this.axiosInstance;
  }
}
