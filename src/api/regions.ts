import request from "@/utils/request";
import type { ApiResponseRegionDTO, ApiResponseRegionDTOList } from "./types";

export interface GetRegionsParams {
  code?: string;
  parentCode?: string;
  level?: number;
  keyword?: string;
}

/**
 * Query regions (province/city/district) with optional filters.
 */
export async function getRegions(params?: GetRegionsParams): Promise<ApiResponseRegionDTOList> {
  const { data: response } = await request.get<ApiResponseRegionDTOList>("/api/v1/regions", {
    params,
  });
  return response;
}

/**
 * Get a region by its code.
 */
export async function getRegionByCode(code: string): Promise<ApiResponseRegionDTO> {
  const { data: response } = await request.get<ApiResponseRegionDTO>(`/api/v1/regions/${code}`);
  return response;
}
