import request from "@/utils/request";
import type {
  ApiResponsePermissionDTOList,
  ApiResponseRoleDTOList,
  ApiResponseRoleDetailDTO,
  CreateRoleRequest,
  UpdateRoleRequest,
  UuidString,
} from "./types";

/**
 * Get role list.
 */
export async function getRoles(): Promise<ApiResponseRoleDTOList> {
  const { data: response } = await request.get<ApiResponseRoleDTOList>("/api/v1/roles");
  return response;
}

/**
 * Create a role.
 */
export async function createRole(data: CreateRoleRequest): Promise<ApiResponseRoleDetailDTO> {
  const { data: response } = await request.post<ApiResponseRoleDetailDTO>("/api/v1/roles", data);
  return response;
}

/**
 * Get role details by id.
 */
export async function getRoleById(id: UuidString): Promise<ApiResponseRoleDetailDTO> {
  const { data: response } = await request.get<ApiResponseRoleDetailDTO>(`/api/v1/roles/${id}`);
  return response;
}

/**
 * Update a role.
 */
export async function updateRole(
  id: UuidString,
  data: UpdateRoleRequest,
): Promise<ApiResponseRoleDetailDTO> {
  const { data: response } = await request.patch<ApiResponseRoleDetailDTO>(
    `/api/v1/roles/${id}`,
    data,
  );
  return response;
}

/**
 * Delete a role.
 */
export async function deleteRole(id: UuidString): Promise<void> {
  await request.delete(`/api/v1/roles/${id}`);
}

/**
 * Get permission list.
 */
export async function getPermissions(): Promise<ApiResponsePermissionDTOList> {
  const { data: response } = await request.get<ApiResponsePermissionDTOList>("/api/v1/permissions");
  return response;
}
