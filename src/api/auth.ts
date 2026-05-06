import request from "@/utils/request";
import type {
  ApiResponseLoginResponse,
  ApiResponseRefreshResponse,
  ChangePasswordRequest,
  LoginRequest,
  RefreshRequest,
} from "./types";

/**
 * Log in with username and password, then get access and refresh tokens.
 */
export async function login(data: LoginRequest): Promise<ApiResponseLoginResponse> {
  const { data: response } = await request.post<ApiResponseLoginResponse>(
    "/api/v1/auth/login",
    data,
  );
  return response;
}

/**
 * Refresh access token and refresh token using current refresh token.
 */
export async function refreshToken(data: RefreshRequest): Promise<ApiResponseRefreshResponse> {
  const { data: response } = await request.post<ApiResponseRefreshResponse>(
    "/api/v1/auth/refresh",
    data,
  );
  return response;
}

/**
 * Revoke the current refresh token and log out.
 */
export async function logout(data: RefreshRequest): Promise<void> {
  await request.post("/api/v1/auth/logout", data);
}

/**
 * Change password for the current authenticated user.
 */
export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  await request.put("/api/v1/auth/password", data);
}
