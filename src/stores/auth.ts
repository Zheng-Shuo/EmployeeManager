import { defineStore } from "pinia";

import { logout } from "@/api/auth";
import type { LoginResponse } from "@/api/types";

interface AuthUser {
  userId: string;
  username: string;
  roles: string[];
  permissions: string[];
  forcePasswordChange: boolean;
}

interface AuthState {
  accessToken: string;
  refreshToken: string;
  user: AuthUser | null;
}

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "authUser";

function readLocalStorage(key: string): string {
  return localStorage.getItem(key) ?? "";
}

function readAuthUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    accessToken: readLocalStorage(ACCESS_TOKEN_KEY),
    refreshToken: readLocalStorage(REFRESH_TOKEN_KEY),
    user: readAuthUser(),
  }),
  getters: {
    isAuthenticated: (state: AuthState): boolean => Boolean(state.accessToken && state.user),
    hasPermission:
      (state: AuthState) =>
      (permission: string): boolean =>
        Boolean(state.user?.permissions.includes(permission)),
    hasAnyPermission:
      (state: AuthState) =>
      (permissions: string[]): boolean => {
        if (permissions.length === 0) {
          return true;
        }

        return permissions.some((permission: string) =>
          state.user?.permissions.includes(permission),
        );
      },
  },
  actions: {
    setLoginData(payload: LoginResponse): void {
      const user: AuthUser = {
        userId: payload.userId,
        username: payload.username,
        roles: payload.roles,
        permissions: payload.permissions,
        forcePasswordChange: payload.forcePasswordChange,
      };

      this.user = user;
      this.updateTokens(payload.accessToken, payload.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    },
    updateTokens(accessToken: string, refreshToken: string): void {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    },
    clearAuth(): void {
      this.accessToken = "";
      this.refreshToken = "";
      this.user = null;
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
    async logout(): Promise<void> {
      const currentRefreshToken = this.refreshToken || readLocalStorage(REFRESH_TOKEN_KEY);

      if (currentRefreshToken) {
        try {
          await logout({ refreshToken: currentRefreshToken });
        } catch {
          // Ignore API logout errors and always clear local auth state.
        }
      }

      this.clearAuth();
    },
    clearForcePasswordChange(): void {
      if (!this.user) {
        return;
      }

      this.user = {
        ...this.user,
        forcePasswordChange: false,
      };
      localStorage.setItem(USER_KEY, JSON.stringify(this.user));
    },
    updateUsername(username: string): void {
      if (!this.user) {
        return;
      }

      this.user = {
        ...this.user,
        username,
      };
      localStorage.setItem(USER_KEY, JSON.stringify(this.user));
    },
  },
});
