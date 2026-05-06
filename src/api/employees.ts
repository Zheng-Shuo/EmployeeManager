import request from "@/utils/request";
import type {
  ApiResponseEmployeeDetailDTO,
  ApiResponseEmployeeListPreferenceDTO,
  ApiResponsePageResponseEmployeeDTO,
  CreateEmployeeRequest,
  UpdateEmployeeListPreferenceRequest,
  UpdateEmployeeRequest,
  UuidString,
} from "./types";

export interface GetEmployeesParams {
  page?: number;
  size?: number;
  keyword?: string;
  employeeNo?: string;
  name?: string;
  idCardNo?: string;
  phone?: string;
  email?: string;
  workAddress?: string;
  contactAddress?: string;
  statuses?: string[];
  status?: string;
  genders?: string[];
  gender?: string;
  employmentTypes?: string[];
  employmentType?: string;
  educations?: string[];
  ethnicities?: string[];
  politicalStatuses?: string[];
  nativePlaces?: string[];
  primaryOrgUnitIds?: string[];
  primaryPositionIds?: string[];
  ageMin?: number;
  ageMax?: number;
  birthDateFrom?: string;
  birthDateTo?: string;
  hireDateFrom?: string;
  hireDateTo?: string;
  sort?: string[];
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
    "/api/v1/employees",
    { params },
  );
  return response;
}

/**
 * Create an employee.
 */
export async function createEmployee(
  data: CreateEmployeeRequest,
): Promise<ApiResponseEmployeeDetailDTO> {
  const { data: response } = await request.post<ApiResponseEmployeeDetailDTO>(
    "/api/v1/employees",
    data,
  );
  return response;
}

/**
 * Create an employee with optional photo and attachments.
 */
export async function createEmployeeMultipart(
  payload: CreateEmployeeWithFilesPayload,
): Promise<ApiResponseEmployeeDetailDTO> {
  const formData = new FormData();

  appendFormDataField(formData, "employeeNo", payload.data.employeeNo);
  appendFormDataField(formData, "idCardNo", payload.data.idCardNo);
  appendFormDataField(formData, "age", payload.data.age);
  appendFormDataField(formData, "name", payload.data.name);
  appendFormDataField(formData, "gender", payload.data.gender);
  appendFormDataField(formData, "birthDate", payload.data.birthDate);
  appendFormDataField(formData, "phone", payload.data.phone);
  appendFormDataField(formData, "email", payload.data.email);
  appendFormDataField(formData, "workAddress", payload.data.workAddress);
  appendFormDataField(formData, "contactAddress", payload.data.contactAddress);
  appendFormDataField(formData, "hireDate", payload.data.hireDate);
  appendFormDataField(formData, "status", payload.data.status);
  appendFormDataField(formData, "ethnicity", payload.data.ethnicity);
  appendFormDataField(formData, "politicalStatus", payload.data.politicalStatus);
  appendFormDataField(formData, "education", payload.data.education);
  appendFormDataField(formData, "nativePlace", payload.data.nativePlace);
  appendFormDataField(formData, "employmentType", payload.data.employmentType);
  appendFormDataField(formData, "assignments", payload.data.assignments);

  if (payload.photoFile) {
    formData.append("photo", payload.photoFile);
  }

  for (const attachment of payload.attachmentFiles ?? []) {
    formData.append("attachments", attachment);
  }

  const { data: response } = await request.post<ApiResponseEmployeeDetailDTO>(
    "/api/v1/employees",
    formData,
  );
  return response;
}

/**
 * Get employee details by id.
 */
export async function getEmployeeById(id: UuidString): Promise<ApiResponseEmployeeDetailDTO> {
  const { data: response } = await request.get<ApiResponseEmployeeDetailDTO>(
    `/api/v1/employees/${id}`,
  );
  return response;
}

/**
 * Update an employee.
 */
export async function updateEmployee(
  id: UuidString,
  data: UpdateEmployeeRequest,
): Promise<ApiResponseEmployeeDetailDTO> {
  const { data: response } = await request.put<ApiResponseEmployeeDetailDTO>(
    `/api/v1/employees/${id}`,
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
): Promise<ApiResponseEmployeeDetailDTO> {
  const formData = new FormData();

  appendFormDataField(formData, "employeeNo", payload.data.employeeNo);
  appendFormDataField(formData, "name", payload.data.name);
  appendFormDataField(formData, "idCardNo", payload.data.idCardNo);
  appendFormDataField(formData, "age", payload.data.age);
  appendFormDataField(formData, "gender", payload.data.gender);
  appendFormDataField(formData, "birthDate", payload.data.birthDate);
  appendFormDataField(formData, "phone", payload.data.phone);
  appendFormDataField(formData, "email", payload.data.email);
  appendFormDataField(formData, "workAddress", payload.data.workAddress);
  appendFormDataField(formData, "contactAddress", payload.data.contactAddress);
  appendFormDataField(formData, "hireDate", payload.data.hireDate);
  appendFormDataField(formData, "status", payload.data.status);
  appendFormDataField(formData, "ethnicity", payload.data.ethnicity);
  appendFormDataField(formData, "politicalStatus", payload.data.politicalStatus);
  appendFormDataField(formData, "education", payload.data.education);
  appendFormDataField(formData, "nativePlace", payload.data.nativePlace);
  appendFormDataField(formData, "employmentType", payload.data.employmentType);
  appendFormDataField(formData, "assignments", payload.data.assignments);

  if (payload.photoFile) {
    formData.append("photo", payload.photoFile);
  }

  for (const attachment of payload.attachmentFiles ?? []) {
    formData.append("attachments", attachment);
  }

  const { data: response } = await request.put<ApiResponseEmployeeDetailDTO>(
    `/api/v1/employees/${id}`,
    formData,
  );
  return response;
}

/**
 * Delete an employee.
 */
export async function deleteEmployee(id: UuidString): Promise<void> {
  await request.delete(`/api/v1/employees/${id}`);
}

/**
 * Get the current user's employee list column layout preference.
 */
export async function getEmployeeListPreference(): Promise<ApiResponseEmployeeListPreferenceDTO> {
  const { data: response } = await request.get<ApiResponseEmployeeListPreferenceDTO>(
    "/api/v1/employees/preferences/list-layout",
  );
  return response;
}

/**
 * Save the current user's employee list column layout preference.
 */
export async function saveEmployeeListPreference(
  data: UpdateEmployeeListPreferenceRequest,
): Promise<ApiResponseEmployeeListPreferenceDTO> {
  const { data: response } = await request.put<ApiResponseEmployeeListPreferenceDTO>(
    "/api/v1/employees/preferences/list-layout",
    data,
  );
  return response;
}

/**
 * Reset the current user's employee list column layout preference to system default.
 */
export async function resetEmployeeListPreference(): Promise<ApiResponseEmployeeListPreferenceDTO> {
  const { data: response } = await request.delete<ApiResponseEmployeeListPreferenceDTO>(
    "/api/v1/employees/preferences/list-layout",
  );
  return response;
}
