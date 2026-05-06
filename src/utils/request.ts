import axios from "axios";
import { ElMessage } from "element-plus";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { AxiosResponse } from "axios";

import router from "@/router";
import { refreshToken } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "",
  timeout: 10000,
});

let isRefreshing = false;
let refreshTask: Promise<string | null> | null = null;

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
);

async function performRefresh(): Promise<string | null> {
  const currentRefreshToken = localStorage.getItem("refreshToken");
  if (!currentRefreshToken) {
    return null;
  }

  try {
    const response = await refreshToken({ refreshToken: currentRefreshToken });
    const payload = response.data;
    const authStore = useAuthStore();
    authStore.updateTokens(payload.accessToken, payload.refreshToken);
    return payload.accessToken;
  } catch {
    return null;
  }
}

export function setupResponseInterceptors(): void {
  request.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => response,
    async (error: AxiosError): Promise<never> => {
      const originalRequest = error.config as
        | (InternalAxiosRequestConfig & { _retry?: boolean })
        | undefined;
      const status = error.response?.status;
      const requestUrl = originalRequest?.url ?? "";
      const isAuthEndpoint =
        requestUrl.includes("/api/v1/auth/login") || requestUrl.includes("/api/v1/auth/refresh");

      if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
        originalRequest._retry = true;

        if (!isRefreshing) {
          isRefreshing = true;
          refreshTask = performRefresh().finally(() => {
            isRefreshing = false;
          });
        }

        const newAccessToken = await refreshTask;
        if (newAccessToken) {
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return request.request(originalRequest) as Promise<never>;
        }

        const authStore = useAuthStore();
        authStore.clearAuth();
        await router.push("/login");
        ElMessage.error("登录已过期，请重新登录");
        return Promise.reject(error);
      }

      if (status === 403) {
        const responseData = error.response?.data as
          | { code?: string; message?: string }
          | undefined;
        if (responseData?.code === "AUTH_403_ACCOUNT_LOCKED") {
          ElMessage.error(responseData.message ?? "账号已被临时锁定，请稍后重试");
        } else {
          ElMessage.error(responseData?.message ?? "无权限访问该资源");
        }
      } else if (status && status >= 400) {
        const message =
          (error.response?.data as { message?: string } | undefined)?.message ??
          "请求失败，请稍后重试";
        ElMessage.error(message);
      }

      return Promise.reject(error);
    },
  );
}

export default request;
