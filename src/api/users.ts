import request from "@/utils/request";
import type {
  ApiResponseResetPasswordResponse,
  ApiResponseStringList,
  ApiResponseUserDTO,
  ApiResponseUserDTOList,
  AssignRolesRequest,
  CreateUserRequest,
  UpdateUsernameRequest,
  UpdateUserStatusRequest,
  UuidString,
} from "./types";

/**
 * Get all users.
 */
export async function getUsers(): Promise<ApiResponseUserDTOList> {
  const { data: response } = await request.get<ApiResponseUserDTOList>("/api/v1/users");
  return response;
}

/**
 * Create a new user.
 */
export async function createUser(data: CreateUserRequest): Promise<ApiResponseUserDTO> {
  const { data: response } = await request.post<ApiResponseUserDTO>("/api/v1/users", data);
  return response;
}

/**
 * Reset a user's password and return a temporary password.
 */
export async function resetUserPassword(id: UuidString): Promise<ApiResponseResetPasswordResponse> {
  const { data: response } = await request.post<ApiResponseResetPasswordResponse>(
    `/api/v1/users/${id}/reset-password`,
  );
  return response;
}

/**
 * Get role code list for a user.
 */
export async function getUserRoles(userId: UuidString): Promise<ApiResponseStringList> {
  const { data: response } = await request.get<ApiResponseStringList>(
    `/api/v1/users/${userId}/roles`,
  );
  return response;
}

/**
 * Assign roles to a user.
 */
export async function assignUserRoles(userId: UuidString, data: AssignRolesRequest): Promise<void> {
  await request.patch(`/api/v1/users/${userId}/roles`, data);
}

/**
 * Update username for specified user.
 */
export async function updateUsername(
  userId: UuidString,
  data: UpdateUsernameRequest,
): Promise<ApiResponseUserDTO> {
  const { data: response } = await request.patch<ApiResponseUserDTO>(
    `/api/v1/users/${userId}/username`,
    data,
  );
  return response;
}

/**
 * Update user status (ACTIVE or DISABLED).
 */
export async function updateUserStatus(
  id: UuidString,
  data: UpdateUserStatusRequest,
): Promise<ApiResponseUserDTO> {
  const { data: response } = await request.patch<ApiResponseUserDTO>(
    `/api/v1/users/${id}/status`,
    data,
  );
  return response;
}

/**
 * Delete a user.
 */
export async function deleteUser(id: UuidString): Promise<void> {
  await request.delete(`/api/v1/users/${id}`);
}
