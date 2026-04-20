import request from "@/utils/request";
import type {
  ApiResponseEmployeeDTO,
  ApiResponseEmployeeDetailDTO,
  ApiResponsePageResponseEmployeeDTO,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  UuidString,
} from "./types";

export interface GetEmployeesParams {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
}

export interface CreateEmployeeWithFilesPayload {
  data: CreateEmployeeRequest;
  photoFile?: File | null;
  attachmentFiles?: File[];
}

export interface UpdateEmployeeWithFilesPayload {
  data: UpdateEmployeeRequest;
  photoFile?: File | null;
  attachmentFiles?: File[];
}

function appendFormDataField(formData: FormData, key: string, value: unknown): void {
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return;
    }
    formData.append(key, JSON.stringify(value));
    return;
  }

  formData.append(key, String(value));
}

/**
 * Query employees with pagination and filters.
 */
export async function getEmployees(
  params?: GetEmployeesParams,
): Promise<ApiResponsePageResponseEmployeeDTO> {
  const { data: response } = await request.get<ApiResponsePageResponseEmployeeDTO>(
    "/api/employees",
    { params },
  );
  return response;
}

/**
 * Create an employee.
 */
export async function createEmployee(data: CreateEmployeeRequest): Promise<ApiResponseEmployeeDTO> {
  const { data: response } = await request.post<ApiResponseEmployeeDTO>("/api/employees", data);
  return response;
}

/**
 * Create an employee with optional photo and attachments.
 */
export async function createEmployeeMultipart(
  payload: CreateEmployeeWithFilesPayload,
): Promise<ApiResponseEmployeeDTO> {
  const formData = new FormData();

  appendFormDataField(formData, "employeeNo", payload.data.employeeNo);
  appendFormDataField(formData, "idCardNo", payload.data.idCardNo);
  appendFormDataField(formData, "age", payload.data.age);
  appendFormDataField(formData, "name", payload.data.name);
  appendFormDataField(formData, "gender", payload.data.gender);
  appendFormDataField(formData, "birthDate", payload.data.birthDate);
  appendFormDataField(formData, "phone", payload.data.phone);
  appendFormDataField(formData, "email", payload.data.email);
  appendFormDataField(formData, "address", payload.data.address);
  appendFormDataField(formData, "hireDate", payload.data.hireDate);
  appendFormDataField(formData, "status", payload.data.status);
  appendFormDataField(formData, "ethnicity", payload.data.ethnicity);
  appendFormDataField(formData, "politicalStatus", payload.data.politicalStatus);
  appendFormDataField(formData, "employmentType", payload.data.employmentType);
  appendFormDataField(formData, "assignments", payload.data.assignments);

  if (payload.photoFile) {
    formData.append("photo", payload.photoFile);
  }

  for (const attachment of payload.attachmentFiles ?? []) {
    formData.append("attachments", attachment);
  }

  const { data: response } = await request.post<ApiResponseEmployeeDTO>("/api/employees", formData);
  return response;
}

/**
 * Get employee details by id.
 */
export async function getEmployeeById(id: UuidString): Promise<ApiResponseEmployeeDetailDTO> {
  const { data: response } = await request.get<ApiResponseEmployeeDetailDTO>(
    `/api/employees/${id}`,
  );
  return response;
}

/**
 * Update an employee.
 */
export async function updateEmployee(
  id: UuidString,
  data: UpdateEmployeeRequest,
): Promise<ApiResponseEmployeeDTO> {
  const { data: response } = await request.put<ApiResponseEmployeeDTO>(
    `/api/employees/${id}`,
    data,
  );
  return response;
}

/**
 * Update an employee with optional photo and attachments.
 */
export async function updateEmployeeMultipart(
  id: UuidString,
  payload: UpdateEmployeeWithFilesPayload,
): Promise<ApiResponseEmployeeDTO> {
  const formData = new FormData();

  appendFormDataField(formData, "name", payload.data.name);
  appendFormDataField(formData, "idCardNo", payload.data.idCardNo);
  appendFormDataField(formData, "age", payload.data.age);
  appendFormDataField(formData, "gender", payload.data.gender);
  appendFormDataField(formData, "birthDate", payload.data.birthDate);
  appendFormDataField(formData, "phone", payload.data.phone);
  appendFormDataField(formData, "email", payload.data.email);
  appendFormDataField(formData, "address", payload.data.address);
  appendFormDataField(formData, "hireDate", payload.data.hireDate);
  appendFormDataField(formData, "status", payload.data.status);
  appendFormDataField(formData, "ethnicity", payload.data.ethnicity);
  appendFormDataField(formData, "politicalStatus", payload.data.politicalStatus);
  appendFormDataField(formData, "employmentType", payload.data.employmentType);
  appendFormDataField(formData, "assignments", payload.data.assignments);

  if (payload.photoFile) {
    formData.append("photo", payload.photoFile);
  }

  for (const attachment of payload.attachmentFiles ?? []) {
    formData.append("attachments", attachment);
  }

  const { data: response } = await request.put<ApiResponseEmployeeDTO>(
    `/api/employees/${id}`,
    formData,
  );
  return response;
}

/**
 * Delete an employee.
 */
export async function deleteEmployee(id: UuidString): Promise<void> {
  await request.delete(`/api/employees/${id}`);
}
