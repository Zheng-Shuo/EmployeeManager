import request from "@/utils/request";
import type {
  ApiResponseOrgUnitDTO,
  ApiResponseOrgUnitDTOList,
  ApiResponseOrgUnitTreeNodeList,
  CreateOrgUnitRequest,
  UpdateOrgUnitRequest,
  UuidString,
} from "./types";

export interface GetOrganizationsParams {
  tree?: boolean;
}

/**
 * Get organizations as flat list or tree according to query param.
 */
export async function getOrganizations(
  params?: GetOrganizationsParams,
): Promise<ApiResponseOrgUnitDTOList | ApiResponseOrgUnitTreeNodeList> {
  const { data: response } = await request.get<
    ApiResponseOrgUnitDTOList | ApiResponseOrgUnitTreeNodeList
  >("/api/organizations", { params });
  return response;
}

/**
 * Get organization tree structure.
 */
export async function getOrganizationTree(): Promise<ApiResponseOrgUnitTreeNodeList> {
  const { data: response } = await request.get<ApiResponseOrgUnitTreeNodeList>(
    "/api/organizations",
    { params: { tree: true } },
  );
  return response;
}

/**
 * Create an organization unit.
 */
export async function createOrganization(
  data: CreateOrgUnitRequest,
): Promise<ApiResponseOrgUnitDTO> {
  const { data: response } = await request.post<ApiResponseOrgUnitDTO>("/api/organizations", data);
  return response;
}

/**
 * Get an organization unit by id.
 */
export async function getOrganizationById(id: UuidString): Promise<ApiResponseOrgUnitDTO> {
  const { data: response } = await request.get<ApiResponseOrgUnitDTO>(`/api/organizations/${id}`);
  return response;
}

/**
 * Update an organization unit.
 */
export async function updateOrganization(
  id: UuidString,
  data: UpdateOrgUnitRequest,
): Promise<ApiResponseOrgUnitDTO> {
  const { data: response } = await request.put<ApiResponseOrgUnitDTO>(
    `/api/organizations/${id}`,
    data,
  );
  return response;
}

/**
 * Delete an organization unit.
 */
export async function deleteOrganization(id: UuidString): Promise<void> {
  await request.delete(`/api/organizations/${id}`);
}

/**
 * Get flat subtree list under an organization unit.
 */
export async function getOrganizationSubtree(id: UuidString): Promise<ApiResponseOrgUnitDTOList> {
  const { data: response } = await request.get<ApiResponseOrgUnitDTOList>(
    `/api/organizations/${id}/subtree`,
  );
  return response;
}

/**
 * Get path from an organization unit to root.
 */
export async function getOrganizationPath(id: UuidString): Promise<ApiResponseOrgUnitDTOList> {
  const { data: response } = await request.get<ApiResponseOrgUnitDTOList>(
    `/api/organizations/${id}/path`,
  );
  return response;
}
