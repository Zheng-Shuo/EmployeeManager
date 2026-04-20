import request from "@/utils/request";
import type {
  ApiResponseDictionaryCategoryDTO,
  ApiResponseDictionaryCategoryDetailDTO,
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
}

export interface GetDictionaryByCodeParams {
  orgUnitId?: UuidString;
}

/**
 * Get dictionary category list. Optionally filter by orgUnitId.
 */
export async function getDictionaries(
  params?: GetDictionariesParams,
): Promise<ApiResponseDictionaryCategoryList> {
  const { data: response } = await request.get<ApiResponseDictionaryCategoryList>(
    "/api/dictionaries",
    { params },
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
    `/api/dictionaries/${id}`,
  );
  return response;
}

/**
 * Get dictionary category detail (with items) by code.
 */
export async function getDictionaryByCode(
  code: string,
  params?: GetDictionaryByCodeParams,
): Promise<ApiResponseDictionaryCategoryDetailDTO> {
  const { data: response } = await request.get<ApiResponseDictionaryCategoryDetailDTO>(
    `/api/dictionaries/by-code/${encodeURIComponent(code)}`,
    { params },
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
    "/api/dictionaries",
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
    `/api/dictionaries/${id}`,
    data,
  );
  return response;
}

/**
 * Delete a dictionary category (cascades to all items).
 */
export async function deleteDictionary(id: UuidString): Promise<void> {
  await request.delete(`/api/dictionaries/${id}`);
}

/**
 * Add an item to a dictionary category.
 */
export async function createDictionaryItem(
  categoryId: UuidString,
  data: CreateItemRequest,
): Promise<ApiResponseDictionaryItemDTO> {
  const { data: response } = await request.post<ApiResponseDictionaryItemDTO>(
    `/api/dictionaries/${categoryId}/items`,
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
    `/api/dictionaries/${categoryId}/items/${itemId}`,
    data,
  );
  return response;
}

/**
 * Delete a dictionary item (first call disables, second call deletes).
 */
export async function deleteDictionaryItem(
  categoryId: UuidString,
  itemId: UuidString,
): Promise<void> {
  await request.delete(`/api/dictionaries/${categoryId}/items/${itemId}`);
}
