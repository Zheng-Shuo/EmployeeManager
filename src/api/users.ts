import request from "@/utils/request";
import type {
  ApiResponseResetPasswordResponse,
  ApiResponseStringList,
  ApiResponseUserDTO,
  ApiResponseUserDTOList,
  AssignRolesRequest,
  CreateUserRequest,
  UpdateUsernameRequest,
  UuidString,
} from "./types";

/**
 * Get all users.
 */
export async function getUsers(): Promise<ApiResponseUserDTOList> {
  const { data: response } = await request.get<ApiResponseUserDTOList>("/api/users");
  return response;
}

/**
 * Create a new user.
 */
export async function createUser(data: CreateUserRequest): Promise<ApiResponseUserDTO> {
  const { data: response } = await request.post<ApiResponseUserDTO>("/api/users", data);
  return response;
}

/**
 * Reset a user's password and return a temporary password.
 */
export async function resetUserPassword(id: UuidString): Promise<ApiResponseResetPasswordResponse> {
  const { data: response } = await request.post<ApiResponseResetPasswordResponse>(
    `/api/users/${id}/reset-password`,
  );
  return response;
}

/**
 * Get role code list for a user.
 */
export async function getUserRoles(userId: UuidString): Promise<ApiResponseStringList> {
  const { data: response } = await request.get<ApiResponseStringList>(`/api/users/${userId}/roles`);
  return response;
}

/**
 * Assign roles to a user.
 */
export async function assignUserRoles(userId: UuidString, data: AssignRolesRequest): Promise<void> {
  await request.put(`/api/users/${userId}/roles`, data);
}

/**
 * Update username for specified user.
 */
export async function updateUsername(
  userId: UuidString,
  data: UpdateUsernameRequest,
): Promise<ApiResponseUserDTO> {
  const { data: response } = await request.patch<ApiResponseUserDTO>(
    `/api/users/${userId}/username`,
    data,
  );
  return response;
}
