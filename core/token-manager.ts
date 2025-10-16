import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

class TokenManager {
  private tokenKey: string;
  private refreshTokenKey: string;

  constructor(tokenKey = "access_token", refreshTokenKey = "refresh_token") {
    this.tokenKey = tokenKey;
    this.refreshTokenKey = refreshTokenKey;
  }

  getToken(): string | undefined {
    return Cookies.get(this.tokenKey);
  }

  setToken(token: string, options?: Cookies.CookieAttributes): void {
    Cookies.set(this.tokenKey, token, options);
  }

  removeToken(): void {
    Cookies.remove(this.tokenKey);
  }

  getRefreshToken(): string | undefined {
    return Cookies.get(this.refreshTokenKey);
  }

  setRefreshToken(token: string, options?: Cookies.CookieAttributes): void {
    Cookies.set(this.refreshTokenKey, token, options);
  }

  removeRefreshToken(): void {
    Cookies.remove(this.refreshTokenKey);
  }

  clearTokens(): void {
    this.removeToken();
    this.removeRefreshToken();
  }

  decodeToken(token?: string): DecodedToken | null {
    const tokenToUse = token || this.getToken();

    if (!tokenToUse) {
      return null;
    }

    try {
      return jwtDecode<DecodedToken>(tokenToUse);
    } catch {
      return null;
    }
  }

  isTokenExpired(token?: string): boolean {
    const decoded = this.decodeToken(token);

    if (!decoded || !decoded.exp) {
      return true;
    }

    return decoded.exp * 1000 < Date.now();
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired();
  }

  getTokenExpiration(token?: string): number | null {
    const decoded = this.decodeToken(token);

    if (!decoded || !decoded.exp) {
      return null;
    }

    return decoded.exp * 1000;
  }
}

export default TokenManager;
