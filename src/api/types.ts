export type UuidString = string;
export type TimestampString = string;
export type DateString = string;

export type UserStatus = "ACTIVE" | "DISABLED";
export type EmployeeStatus = "ACTIVE" | "DISABLED" | "RESIGNED" | "RETIRED";
export type OrgUnitType = "GROUP" | "COMPANY" | "DEPARTMENT";

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
  name: string;
  gender?: string | null;
  birthDate?: DateString | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  hireDate?: DateString | null;
  status: EmployeeStatus;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

export interface EmployeeDetailDTO extends EmployeeDTO {
  departments: OrgUnitDTO[];
  positions: PositionDTO[];
}

export interface CreateEmployeeRequest {
  employeeNo: string;
  name: string;
  gender?: string | null;
  birthDate?: DateString | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  hireDate?: DateString | null;
  status?: EmployeeStatus;
}

export interface UpdateEmployeeRequest {
  name: string;
  gender?: string | null;
  birthDate?: DateString | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  hireDate?: DateString | null;
  status?: EmployeeStatus | null;
}

export interface AssignDepartmentsRequest {
  orgUnitIds: UuidString[];
  primaryOrgUnitId?: UuidString | null;
}

export interface AssignPositionsRequest {
  positionIds: UuidString[];
  primaryPositionId?: UuidString | null;
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
  type: OrgUnitType;
  parentId?: UuidString | null;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

export interface OrgUnitTreeNode {
  id: UuidString;
  name: string;
  type: OrgUnitType;
  parentId?: UuidString | null;
  children: OrgUnitTreeNode[];
}

export interface CreateOrgUnitRequest {
  name: string;
  type: OrgUnitType;
  parentId?: UuidString | null;
}

export interface UpdateOrgUnitRequest {
  name: string;
  type: OrgUnitType;
}

export interface PositionDTO {
  id: UuidString;
  name: string;
  description?: string | null;
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
