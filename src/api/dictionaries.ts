import request from "@/utils/request";
import type {
  ApiResponseDictionaryCategoryDTO,
  ApiResponseDictionaryCategoryDetailDTO,
  ApiResponseDictionaryCategoryDetailDTOList,
  ApiResponseDictionaryCategoryList,
  ApiResponseDictionaryItemDTO,
  CreateCategoryRequest,
  CreateItemRequest,
  UpdateCategoryRequest,
  UpdateItemRequest,
  UuidString,
} from "./types";

export interface GetDictionariesParams {
  orgUnitId?: UuidString;
  include?: "items";
}

/**
 * Get dictionary category list. Optionally filter by orgUnitId.
 */
export async function getDictionaries(
  params?: GetDictionariesParams,
): Promise<ApiResponseDictionaryCategoryList> {
  const { data: response } = await request.get<ApiResponseDictionaryCategoryList>(
    "/api/v1/dictionaries",
    { params },
  );
  return response;
}

/**
 * Get all dictionary categories with their items in a single request.
 */
export async function getDictionariesWithItems(
  params?: Omit<GetDictionariesParams, "include">,
): Promise<ApiResponseDictionaryCategoryDetailDTOList> {
  const { data: response } = await request.get<ApiResponseDictionaryCategoryDetailDTOList>(
    "/api/v1/dictionaries",
    { params: { ...params, include: "items" } },
  );
  return response;
}

/**
 * Get dictionary category detail (with items) by id.
 */
export async function getDictionaryById(
  id: UuidString,
): Promise<ApiResponseDictionaryCategoryDetailDTO> {
  const { data: response } = await request.get<ApiResponseDictionaryCategoryDetailDTO>(
    `/api/v1/dictionaries/${id}`,
  );
  return response;
}

/**
 * Create a dictionary category.
 */
export async function createDictionary(
  data: CreateCategoryRequest,
): Promise<ApiResponseDictionaryCategoryDTO> {
  const { data: response } = await request.post<ApiResponseDictionaryCategoryDTO>(
    "/api/v1/dictionaries",
    data,
  );
  return response;
}

/**
 * Update a dictionary category.
 */
export async function updateDictionary(
  id: UuidString,
  data: UpdateCategoryRequest,
): Promise<ApiResponseDictionaryCategoryDTO> {
  const { data: response } = await request.put<ApiResponseDictionaryCategoryDTO>(
    `/api/v1/dictionaries/${id}`,
    data,
  );
  return response;
}

/**
 * Delete a dictionary category (cascades to all items).
 */
export async function deleteDictionary(id: UuidString): Promise<void> {
  await request.delete(`/api/v1/dictionaries/${id}`);
}

/**
 * Add an item to a dictionary category.
 */
export async function createDictionaryItem(
  categoryId: UuidString,
  data: CreateItemRequest,
): Promise<ApiResponseDictionaryItemDTO> {
  const { data: response } = await request.post<ApiResponseDictionaryItemDTO>(
    `/api/v1/dictionaries/${categoryId}/items`,
    data,
  );
  return response;
}

/**
 * Update a dictionary item.
 */
export async function updateDictionaryItem(
  categoryId: UuidString,
  itemId: UuidString,
  data: UpdateItemRequest,
): Promise<ApiResponseDictionaryItemDTO> {
  const { data: response } = await request.put<ApiResponseDictionaryItemDTO>(
    `/api/v1/dictionaries/${categoryId}/items/${itemId}`,
    data,
  );
  return response;
}

/**
 * Delete a dictionary item.
 */
export async function deleteDictionaryItem(
  categoryId: UuidString,
  itemId: UuidString,
): Promise<void> {
  await request.delete(`/api/v1/dictionaries/${categoryId}/items/${itemId}`);
}

/**
 * Disable a dictionary item (logical disable, preserves history references).
 */
export async function disableDictionaryItem(
  categoryId: UuidString,
  itemId: UuidString,
): Promise<ApiResponseDictionaryItemDTO> {
  const { data: response } = await request.patch<ApiResponseDictionaryItemDTO>(
    `/api/v1/dictionaries/${categoryId}/items/${itemId}/disable`,
  );
  return response;
}
