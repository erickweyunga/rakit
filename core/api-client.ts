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
  MeResponse,
  User,
  Session,
  MiddlewareContext,
  RakitConfig,
} from "../types";

interface ApiClientConfig<TUser = User, TSession = Session>
  extends RakitConfig<TUser, TSession> {
  onRefreshFailed?: () => void;
}

export default class ApiClient<
  TUser extends User = User,
  TSession extends Session = Session,
> {
  private axiosInstance: AxiosInstance;
  private tokenManager: TokenManager;
  private config: ApiClientConfig<TUser, TSession>;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  }> = [];

  constructor(config: ApiClientConfig<TUser, TSession>) {
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
    this.axiosInstance.interceptors.request.use((config) => {
      const token = this.tokenManager.getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
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

  private buildContext(
    user?: TUser,
    session?: TSession,
  ): MiddlewareContext<TUser, TSession> {
    return {
      api: this.axiosInstance,
      getToken: () => this.tokenManager.getToken() ?? null,
      setToken: (token: string) => this.tokenManager.setToken(token),
      removeToken: () => this.tokenManager.clearTokens(),
      user,
      session,
    };
  }

  async login<
    TResponse extends AuthResponse<TUser, TSession> = AuthResponse<
      TUser,
      TSession
    >,
  >(credentials: LoginCredentials): Promise<TResponse> {
    const res = await this.axiosInstance.post<TResponse>(
      this.config.endpoints.login,
      credentials,
    );
    const ctx = this.buildContext(res.data.user, res.data.session);
    await this.config.middleware?.onLogin?.(res.data, ctx);
    return res.data;
  }

  async register<
    TResponse extends AuthResponse<TUser, TSession> = AuthResponse<
      TUser,
      TSession
    >,
  >(credentials: RegisterCredentials): Promise<TResponse> {
    const res = await this.axiosInstance.post<TResponse>(
      this.config.endpoints.register,
      credentials,
    );
    const ctx = this.buildContext(res.data.user, res.data.session);
    await this.config.middleware?.onRegister?.(res.data, ctx);
    return res.data;
  }

  async logout(): Promise<void> {
    try {
      await this.axiosInstance.post(this.config.endpoints.logout);
    } finally {
      const ctx = this.buildContext();
      await this.config.middleware?.onLogout?.(ctx);
    }
  }

  async refreshToken(): Promise<TSession> {
    const res = await this.axiosInstance.post<TSession>(
      this.config.endpoints.refresh,
    );
    const session = res.data;
    const ctx = this.buildContext(undefined, session);
    await this.config.middleware?.onRefresh?.(session, ctx);
    return session;
  }

  async getCurrentUser<
    TResponse extends MeResponse<TUser, TSession> = MeResponse<TUser, TSession>,
  >(): Promise<TResponse> {
    const res = await this.axiosInstance.get<TResponse>(
      this.config.endpoints.me,
    );
    const ctx = this.buildContext(res.data.user, res.data.session);
    await this.config.middleware?.onMe?.(res.data, ctx);
    return res.data;
  }

  getTokenManager() {
    return this.tokenManager;
  }

  getAxiosInstance() {
    return this.axiosInstance;
  }
}
