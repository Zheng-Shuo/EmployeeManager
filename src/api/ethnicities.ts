import request from "@/utils/request";
import type { ApiResponseEthnicityDTO, ApiResponseEthnicityDTOList, UuidString } from "./types";

export interface GetEthnicitiesParams {
  includeDisabled?: boolean;
}

/**
 * Get ethnicity list.
 */
export async function getEthnicities(
  params?: GetEthnicitiesParams,
): Promise<ApiResponseEthnicityDTOList> {
  const { data: response } = await request.get<ApiResponseEthnicityDTOList>("/api/v1/ethnicities", {
    params,
  });
  return response;
}

/**
 * Get ethnicity details by id.
 */
export async function getEthnicityById(id: UuidString): Promise<ApiResponseEthnicityDTO> {
  const { data: response } = await request.get<ApiResponseEthnicityDTO>(
    `/api/v1/ethnicities/${id}`,
  );
  return response;
}
