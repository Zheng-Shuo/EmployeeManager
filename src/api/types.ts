export type UuidString = string;
export type TimestampString = string;
export type DateString = string;

export type UserStatus = "ACTIVE" | "DISABLED";
export type Gender = "MALE" | "FEMALE";

export interface ApiResponseMeta {
  success: boolean;
  code: string;
  message: string;
}

export interface ApiResponse<T> extends ApiResponseMeta {
  data: T;
}

export interface ApiResponseError extends ApiResponseMeta {
  data: null;
}

export type ApiResponseLoginResponse = ApiResponse<LoginResponse>;
export type ApiResponseRefreshResponse = ApiResponse<RefreshResponse>;
export type ApiResponseUserDTO = ApiResponse<UserDTO>;
export type ApiResponseUserDTOList = ApiResponse<UserDTO[]>;
export type ApiResponseResetPasswordResponse = ApiResponse<ResetPasswordResponse>;
export type ApiResponseRoleDTOList = ApiResponse<RoleDTO[]>;
export type ApiResponseRoleDetailDTO = ApiResponse<RoleDetailDTO>;
export type ApiResponsePermissionDTOList = ApiResponse<PermissionDTO[]>;
export type ApiResponseStringList = ApiResponse<string[]>;
export type ApiResponseEmployeeDTO = ApiResponse<EmployeeDTO>;
export type ApiResponseEmployeeDetailDTO = ApiResponse<EmployeeDetailDTO>;
export type ApiResponsePageResponseEmployeeDTO = ApiResponse<PageResponseEmployeeDTO>;
export type ApiResponseOrgUnitDTO = ApiResponse<OrgUnitDTO>;
export type ApiResponseOrgUnitDTOList = ApiResponse<OrgUnitDTO[]>;
export type ApiResponseOrgUnitTreeNodeList = ApiResponse<OrgUnitTreeNode[]>;
export type ApiResponsePositionDTO = ApiResponse<PositionDTO>;
export type ApiResponsePositionDTOList = ApiResponse<PositionDTO[]>;

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: UuidString;
  username: string;
  roles: string[];
  permissions: string[];
  forcePasswordChange: boolean;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface UserDTO {
  id: UuidString;
  username: string;
  roles: string[];
  status: UserStatus;
  forcePasswordChange: boolean;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  roleIds?: UuidString[];
}

export interface UpdateUsernameRequest {
  newUsername: string;
}

export interface ResetPasswordResponse {
  temporaryPassword: string;
}

export interface RoleDTO {
  id: UuidString;
  name: string;
  description?: string | null;
  isSystem: boolean;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

export interface RoleDetailDTO extends RoleDTO {
  permissions: PermissionDTO[];
}

export interface CreateRoleRequest {
  name: string;
  description?: string | null;
  permissionIds?: UuidString[];
}

export interface UpdateRoleRequest {
  name?: string | null;
  description?: string | null;
  permissionIds?: UuidString[] | null;
}

export interface PermissionDTO {
  id: UuidString;
  code: string;
  description?: string | null;
}

export interface AssignRolesRequest {
  roleIds: UuidString[];
}

export interface EmployeeDTO {
  id: UuidString;
  employeeNo: string;
  idCardNo?: string | null;
  age?: number | null;
  name: string;
  gender?: string | null;
  birthDate?: DateString | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  photoPath?: string | null;
  hireDate?: DateString | null;
  status: string;
  ethnicity?: string | null;
  politicalStatus?: string | null;
  employmentType: string;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

export interface EmployeeAssignmentDTO {
  id: UuidString;
  orgUnitId: UuidString;
  orgUnitName: string;
  positionId?: UuidString | null;
  positionName?: string | null;
  isPrimary: boolean;
  startDate: DateString;
  endDate?: DateString | null;
}

export interface EmployeeDetailDTO extends EmployeeDTO {
  assignments: EmployeeAssignmentDTO[];
  attachments: EmployeeAttachmentDTO[];
}

export interface EmployeeAttachmentDTO {
  id: UuidString;
  originalName: string;
  storedName: string;
  contentType?: string | null;
  filePath: string;
  fileSize: number;
  uploadedAt: TimestampString;
}

export interface AssignmentInput {
  orgUnitId: UuidString;
  positionId?: UuidString | null;
  isPrimary?: boolean;
  startDate: DateString;
  endDate?: DateString | null;
}

export interface CreateEmployeeRequest {
  name: string;
  idCardNo?: string | null;
  age?: number | null;
  gender?: Gender | null;
  birthDate?: DateString | null;
  hireDate?: DateString | null;
  employmentType?: string | null;
  employeeNo?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  status?: string | null;
  ethnicity?: string | null;
  politicalStatus?: string | null;
  assignments?: AssignmentInput[];
}

export interface UpdateEmployeeRequest {
  name: string;
  idCardNo?: string | null;
  age?: number | null;
  gender?: string | null;
  birthDate?: DateString | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  hireDate?: DateString | null;
  status?: string | null;
  ethnicity?: string | null;
  politicalStatus?: string | null;
  employmentType?: string | null;
  assignments?: AssignmentInput[];
}

export interface PageResponseEmployeeDTO {
  items: EmployeeDTO[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface OrgUnitDTO {
  id: UuidString;
  name: string;
  type: string;
  parentId?: UuidString | null;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

export interface OrgUnitTreeNode {
  id: UuidString;
  name: string;
  type: string;
  parentId?: UuidString | null;
  children: OrgUnitTreeNode[];
}

export interface CreateOrgUnitRequest {
  name: string;
  type: string;
  parentId?: UuidString | null;
}

export interface UpdateOrgUnitRequest {
  name: string;
  type: string;
}

export interface PositionDTO {
  id: UuidString;
  name: string;
  description?: string | null;
  orgUnitId: UuidString;
  orgUnitName: string;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

export interface CreatePositionRequest {
  name: string;
  description?: string | null;
}

export interface UpdatePositionRequest {
  name: string;
  description?: string | null;
}

// ── 数据字典 ──────────────────────────────────────────────────────

export interface DictionaryCategoryDTO {
  id: UuidString;
  code: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  orgUnitId?: UuidString | null;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

export interface DictionaryItemDTO {
  id: UuidString;
  categoryId: UuidString;
  code: string;
  label: string;
  sortOrder: number;
  isDefault: boolean;
  isEnabled: boolean;
  color?: string | null;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

export interface DictionaryCategoryDetailDTO extends DictionaryCategoryDTO {
  items: DictionaryItemDTO[];
}

export interface CreateCategoryRequest {
  code: string;
  name: string;
  description?: string | null;
  orgUnitId?: UuidString | null;
}

export interface UpdateCategoryRequest {
  name?: string | null;
  description?: string | null;
}

export interface CreateItemRequest {
  code: string;
  label: string;
  sortOrder?: number;
  isDefault?: boolean;
  isEnabled?: boolean;
  color?: string | null;
}

export interface UpdateItemRequest {
  label?: string | null;
  sortOrder?: number;
  isDefault?: boolean;
  isEnabled?: boolean;
  color?: string | null;
}

export type ApiResponseDictionaryCategoryDTO = ApiResponse<DictionaryCategoryDTO>;
export type ApiResponseDictionaryCategoryDetailDTO = ApiResponse<DictionaryCategoryDetailDTO>;
export type ApiResponseDictionaryCategoryList = ApiResponse<DictionaryCategoryDTO[]>;
export type ApiResponseDictionaryItemDTO = ApiResponse<DictionaryItemDTO>;
