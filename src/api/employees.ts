import request from '@/utils/request'
import type {
  ApiResponseEmployeeDTO,
  ApiResponseEmployeeDetailDTO,
  ApiResponsePageResponseEmployeeDTO,
  AssignDepartmentsRequest,
  AssignPositionsRequest,
  CreateEmployeeRequest,
  EmployeeStatus,
  UpdateEmployeeRequest,
  UuidString,
} from './types'

export interface GetEmployeesParams {
  page?: number
  size?: number
  keyword?: string
  status?: EmployeeStatus
}

/**
 * Query employees with pagination and filters.
 */
export async function getEmployees(
  params?: GetEmployeesParams,
): Promise<ApiResponsePageResponseEmployeeDTO> {
  const { data: response } = await request.get<ApiResponsePageResponseEmployeeDTO>(
    '/api/employees',
    { params },
  )
  return response
}

/**
 * Create an employee.
 */
export async function createEmployee(data: CreateEmployeeRequest): Promise<ApiResponseEmployeeDTO> {
  const { data: response } = await request.post<ApiResponseEmployeeDTO>('/api/employees', data)
  return response
}

/**
 * Get employee details by id.
 */
export async function getEmployeeById(id: UuidString): Promise<ApiResponseEmployeeDetailDTO> {
  const { data: response } = await request.get<ApiResponseEmployeeDetailDTO>(`/api/employees/${id}`)
  return response
}

/**
 * Update an employee.
 */
export async function updateEmployee(
  id: UuidString,
  data: UpdateEmployeeRequest,
): Promise<ApiResponseEmployeeDTO> {
  const { data: response } = await request.put<ApiResponseEmployeeDTO>(`/api/employees/${id}`, data)
  return response
}

/**
 * Delete an employee.
 */
export async function deleteEmployee(id: UuidString): Promise<void> {
  await request.delete(`/api/employees/${id}`)
}

/**
 * Assign departments for an employee.
 */
export async function assignEmployeeDepartments(
  id: UuidString,
  data: AssignDepartmentsRequest,
): Promise<void> {
  await request.put(`/api/employees/${id}/departments`, data)
}

/**
 * Assign positions for an employee.
 */
export async function assignEmployeePositions(
  id: UuidString,
  data: AssignPositionsRequest,
): Promise<void> {
  await request.put(`/api/employees/${id}/positions`, data)
}
