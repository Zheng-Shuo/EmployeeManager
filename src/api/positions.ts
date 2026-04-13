import request from '@/utils/request'
import type {
  ApiResponsePositionDTO,
  ApiResponsePositionDTOList,
  CreatePositionRequest,
  UpdatePositionRequest,
  UuidString,
} from './types'

/**
 * Get all positions.
 */
export async function getPositions(): Promise<ApiResponsePositionDTOList> {
  const { data: response } = await request.get<ApiResponsePositionDTOList>('/api/positions')
  return response
}

/**
 * Create a position.
 */
export async function createPosition(data: CreatePositionRequest): Promise<ApiResponsePositionDTO> {
  const { data: response } = await request.post<ApiResponsePositionDTO>('/api/positions', data)
  return response
}

/**
 * Get a position by id.
 */
export async function getPositionById(id: UuidString): Promise<ApiResponsePositionDTO> {
  const { data: response } = await request.get<ApiResponsePositionDTO>(`/api/positions/${id}`)
  return response
}

/**
 * Update a position.
 */
export async function updatePosition(
  id: UuidString,
  data: UpdatePositionRequest,
): Promise<ApiResponsePositionDTO> {
  const { data: response } = await request.put<ApiResponsePositionDTO>(`/api/positions/${id}`, data)
  return response
}

/**
 * Delete a position.
 */
export async function deletePosition(id: UuidString): Promise<void> {
  await request.delete(`/api/positions/${id}`)
}
