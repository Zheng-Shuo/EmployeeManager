import request from "@/utils/request";
import type {
  ApiResponsePositionDTO,
  ApiResponsePositionDTOList,
  CreatePositionRequest,
  UpdatePositionRequest,
  UuidString,
} from "./types";

export interface GetPositionsParams {
  orgUnitId?: UuidString;
}

/**
 * Get all positions. Optionally filter by orgUnitId.
 */
export async function getPositions(
  params?: GetPositionsParams,
): Promise<ApiResponsePositionDTOList> {
  const { data: response } = await request.get<ApiResponsePositionDTOList>("/api/v1/positions", {
    params,
  });
  return response;
}

/**
 * Create a position.
 */
export async function createPosition(data: CreatePositionRequest): Promise<ApiResponsePositionDTO> {
  const { data: response } = await request.post<ApiResponsePositionDTO>("/api/v1/positions", data);
  return response;
}

/**
 * Get a position by id.
 */
export async function getPositionById(id: UuidString): Promise<ApiResponsePositionDTO> {
  const { data: response } = await request.get<ApiResponsePositionDTO>(`/api/v1/positions/${id}`);
  return response;
}

/**
 * Update a position.
 */
export async function updatePosition(
  id: UuidString,
  data: UpdatePositionRequest,
): Promise<ApiResponsePositionDTO> {
  const { data: response } = await request.put<ApiResponsePositionDTO>(
    `/api/v1/positions/${id}`,
    data,
  );
  return response;
}

/**
 * Delete a position.
 */
export async function deletePosition(id: UuidString): Promise<void> {
  await request.delete(`/api/v1/positions/${id}`);
}
