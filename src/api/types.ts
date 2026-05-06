export type UuidString = string;
export type TimestampString = string;
export type DateString = string;

export type UserStatus = string;
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
export type ApiResponseEthnicityDTO = ApiResponse<EthnicityDTO>;
export type ApiResponseEthnicityDTOList = ApiResponse<EthnicityDTO[]>;

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
  status: string;
  statusLabel: string;
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
  success: boolean;
  message: string;
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
  employeeNo: string | null;
  idCardNo: string;
  age: number;
  name: string;
  gender: Gender;
  birthDate: DateString;
  phone: string | null;
  email: string | null;
  workAddress: string | null;
  contactAddress: string | null;
  photoPath: string | null;
  hireDate: DateString;
  status: string;
  ethnicity: string | null;
  politicalStatus: string | null;
  education: string | null;
  nativePlace: string | null;
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
  contentType: string;
  filePath: string;
  fileSize: number;
  uploadedAt: TimestampString;
}

export interface AssignmentInput {
  orgUnitId: UuidString;
  positionId?: UuidString | null;
  isPrimary: boolean;
  startDate: DateString;
  endDate?: DateString | null;
}

export interface CreateEmployeeRequest {
  name: string;
  idCardNo: string;
  age: number;
  gender: Gender;
  birthDate: DateString;
  hireDate: DateString;
  employmentType: string;
  employeeNo?: string | null;
  phone?: string | null;
  email?: string | null;
  workAddress?: string | null;
  contactAddress?: string | null;
  status?: string | null;
  ethnicity?: string | null;
  politicalStatus?: string | null;
  education?: string | null;
  nativePlace?: string | null;
  assignments?: AssignmentInput[];
}

export interface UpdateEmployeeRequest {
  name: string;
  idCardNo: string;
  age: number;
  gender: Gender;
  birthDate: DateString;
  employeeNo?: string | null;
  phone?: string | null;
  email?: string | null;
  workAddress?: string | null;
  contactAddress?: string | null;
  hireDate: DateString;
  status?: string | null;
  ethnicity?: string | null;
  politicalStatus?: string | null;
  education?: string | null;
  nativePlace?: string | null;
  employmentType: string;
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

export interface OrgUnitTreeNode extends OrgUnitDTO {
  children: OrgUnitTreeNode[];
}

export interface CreateOrgUnitRequest {
  name: string;
  type: string;
  parentId?: UuidString | null;
}

export interface UpdateOrgUnitRequest {
  name?: string;
  type?: string;
}

export interface MoveOrgUnitRequest {
  parentId: UuidString | null;
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
  orgUnitId: UuidString;
  description?: string | null;
}

export interface UpdatePositionRequest {
  name?: string;
  description?: string | null;
}

export interface EthnicityDTO {
  id: UuidString;
  name: string;
  romanizedName: string;
  alphaCode: string;
  numericCode: string;
  isSystem: boolean;
  isEnabled: boolean;
  sortOrder: number;
}

// ── 数据字典 ──────────────────────────────────────────────────────

export interface DictionaryCategoryDTO {
  id: UuidString;
  name: string;
  description: string | null;
  isSystem: boolean;
  orgUnitId: UuidString | null;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

export interface DictionaryItemDTO {
  id: UuidString;
  categoryId: UuidString;
  label: string;
  sortOrder: number;
  isDefault: boolean;
  isEnabled: boolean;
  color: string | null;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

export interface DictionaryCategoryDetailDTO extends DictionaryCategoryDTO {
  items: DictionaryItemDTO[];
}

export interface CreateCategoryRequest {
  name: string;
  description?: string | null;
  orgUnitId?: UuidString | null;
}

export interface UpdateCategoryRequest {
  name?: string | null;
  description?: string | null;
}

export interface CreateItemRequest {
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
export type ApiResponseDictionaryCategoryDetailDTOList = ApiResponse<DictionaryCategoryDetailDTO[]>;
export type ApiResponseDictionaryItemDTO = ApiResponse<DictionaryItemDTO>;

export interface UpdateUserStatusRequest {
  status: string;
}

// ── 员工列表列布局偏好 ───────────────────────────────────────────

export interface EmployeeListColumnConfig {
  fieldKey: string;
  visible: boolean;
  order: number;
  width?: number | null;
}

export interface EmployeeListPreferenceDTO {
  userId: UuidString;
  columns: EmployeeListColumnConfig[];
  updatedAt: TimestampString;
}

export interface UpdateEmployeeListPreferenceRequest {
  columns: EmployeeListColumnConfig[];
}

export type ApiResponseEmployeeListPreferenceDTO = ApiResponse<EmployeeListPreferenceDTO>;

// ── 行政区划 ─────────────────────────────────────────────────────

export interface RegionDTO {
  id: UuidString;
  code: string;
  name: string;
  fullName: string;
  level: number;
  parentCode: string | null;
}

export type ApiResponseRegionDTO = ApiResponse<RegionDTO>;
export type ApiResponseRegionDTOList = ApiResponse<RegionDTO[]>;
