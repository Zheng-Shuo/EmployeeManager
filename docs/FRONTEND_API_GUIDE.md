# 员工管理系统 — 前端 AI 开发完整接口指南

> **适用对象**：前端 AI / 开发人员  
> **文档版本**：与代码同步（pre-release）  
> **基础 URL**：`http://localhost:10086`  
> **认证方式**：JWT Bearer Token（Header `Authorization: Bearer <token>`）  
> **默认账号**：`admin` / `5kuslvhe9n`（首次登录建议立即改密）

---

## 目录

1. [统一响应格式与错误处理](#1-统一响应格式与错误处理)
2. [认证系统](#2-认证系统)
3. [用户管理](#3-用户管理)
4. [角色与权限管理](#4-角色与权限管理)
5. [员工管理](#5-员工管理)
6. [组织管理](#6-组织管理)
7. [职位管理](#7-职位管理)
8. [数据字典](#8-数据字典)
9. [完整数据类型定义（TypeScript）](#9-完整数据类型定义typescript)
10. [权限系统 RBAC](#10-权限系统-rbac)
11. [文件上传机制](#11-文件上传机制)
12. [完整错误码参考](#12-完整错误码参考)
13. [前端集成工作流](#13-前端集成工作流)

---

## 1. 统一响应格式与错误处理

### 1.1 响应结构

所有接口（除 `204 No Content`）统一返回：

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "OK",
  "data": { ... }
}
```

失败时：

```json
{
  "success": false,
  "code": "USER_409_USERNAME_EXISTS",
  "message": "用户名已存在",
  "data": null
}
```

### 1.2 HTTP 状态码对照

| HTTP 状态码 | 含义                           | 业务码格式 |
| ----------- | ------------------------------ | ---------- |
| `200`       | 操作成功，有响应体             | `SUCCESS`  |
| `201`       | 创建成功，有响应体             | `SUCCESS`  |
| `204`       | 操作成功，无响应体             | —          |
| `400`       | 请求参数格式无效               | `*_400_*`  |
| `401`       | 未认证 / Token 失效            | `*_401_*`  |
| `403`       | 权限不足                       | `*_403_*`  |
| `404`       | 资源不存在                     | `*_404_*`  |
| `409`       | 业务状态冲突（重复、受保护等） | `*_409_*`  |
| `422`       | 业务校验失败（字段不合规）     | `*_422_*`  |
| `500`       | 服务器内部错误                 | `*_500_*`  |

### 1.3 前端统一错误处理建议

```typescript
// axios 拦截器示例
axios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { status, data } = error.response;
    if (status === 401) {
      // 尝试刷新 token，失败则跳转登录页
      const refreshed = await tryRefreshToken();
      if (refreshed) return axios.request(error.config);
      router.push("/login");
    }
    // 统一弹出错误提示：data.message
    showError(data.message);
    return Promise.reject(error);
  },
);
```

---

## 2. 认证系统

### 2.1 登录

**`POST /api/v1/auth/login`** — 无需认证

**使用场景**：用户进入登录页面，提交账号密码。

**请求体**：

```json
{
  "username": "admin",
  "password": "5kuslvhe9n"
}
```

**成功响应 `200`**：

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "OK",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGc...",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "admin",
    "roles": ["ADMIN"],
    "permissions": [
      "user:view",
      "user:create",
      "user:update",
      "user:delete",
      "user:reset-password",
      "role:view",
      "role:create",
      "role:update",
      "role:delete",
      "permission:view",
      "employee:view",
      "employee:create",
      "employee:update",
      "employee:delete",
      "org:view",
      "org:create",
      "org:update",
      "org:delete",
      "position:view",
      "position:create",
      "position:update",
      "position:delete",
      "dictionary:manage"
    ],
    "forcePasswordChange": false
  }
}
```

**关键逻辑**：

- 保存 `accessToken`（有效期 **15 分钟**）和 `refreshToken`（有效期 **7 天**）到本地存储
- 保存 `permissions` 数组到全局状态，用于前端权限控制
- 若 `forcePasswordChange === true`，**立即跳转修改密码页**，禁止访问其他页面

**错误响应**：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `AUTH_401_INVALID_CREDENTIALS` | 401 | 用户名或密码错误 |
| `AUTH_403_ACCOUNT_DISABLED` | 403 | 账号已被禁用 |
| `AUTH_403_ACCOUNT_LOCKED` | 403 | 账号因多次失败被锁定（5次错误后锁定 15 分钟） |

---

### 2.2 刷新令牌

**`POST /api/v1/auth/refresh`** — 无需认证

**使用场景**：Access Token 过期（收到 `401`）时，自动静默刷新。

**请求体**：

```json
{ "refreshToken": "eyJhbGc..." }
```

**成功响应 `200`**：

```json
{
  "data": {
    "accessToken": "新的 accessToken",
    "refreshToken": "新的 refreshToken（旧令牌立即作废，滚动续期）"
  }
}
```

**错误响应**：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `AUTH_401_INVALID_REFRESH_TOKEN` | 401 | refresh token 无效（篡改或已注销） |
| `AUTH_401_REFRESH_TOKEN_EXPIRED` | 401 | refresh token 已过期，需重新登录 |
| `AUTH_403_ACCOUNT_DISABLED` | 403 | 账号在刷新时被禁用 |

---

### 2.3 登出

**`POST /api/v1/auth/logout`** — 需要认证

**使用场景**：用户点击"退出登录"。

**请求体**：

```json
{ "refreshToken": "eyJhbGc..." }
```

**成功响应**：`204 No Content`

> 仅当前 refresh token 被撤销。已签发的 access token 在自然过期前仍有效，前端应同步清除本地存储的 token。

---

### 2.4 修改密码

**`PUT /api/v1/auth/password`** — 需要认证

**使用场景**：

1. 用户主动在"个人设置"页修改密码
2. `forcePasswordChange=true` 时强制引导修改

**请求体**：

```json
{
  "oldPassword": "当前密码",
  "newPassword": "新密码（长度 ≥ 6）"
}
```

**成功响应**：`204 No Content`

> 修改成功后，除当前 session 外的所有 refresh token 被撤销，其他设备/会话将被强制下线。

**错误响应**：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `AUTH_422_OLD_PASSWORD_WRONG` | 422 | 旧密码不正确 |
| `AUTH_422_NEW_PASSWORD_TOO_SHORT` | 422 | 新密码不足 6 位 |

---

## 3. 用户管理

> 所有用户管理接口均需要认证。权限由具体接口决定。

### 3.1 获取用户列表

**`GET /api/v1/users`** — 权限：`user:view`

**使用场景**：系统管理员进入"用户管理"页面，展示所有系统用户。

**响应 `200`**：

```json
{
  "data": [
    {
      "id": "uuid",
      "username": "admin",
      "roles": ["ADMIN"],
      "status": "00000000-0000-0000-0000-000000000111",
      "statusLabel": "激活",
      "forcePasswordChange": false,
      "createdAt": "2025-01-01 08:00:00",
      "updatedAt": "2025-01-01 08:00:00"
    },
    {
      "id": "uuid",
      "username": "hr_alice",
      "roles": ["HR_USER"],
      "status": "00000000-0000-0000-0000-000000000111",
      "statusLabel": "激活",
      "forcePasswordChange": true,
      "createdAt": "2025-03-15 10:00:00",
      "updatedAt": "2025-03-15 10:00:00"
    }
  ]
}
```

---

### 3.2 创建用户

**`POST /api/v1/users`** — 权限：`user:create`

**使用场景**：管理员为新员工开设系统账号。

**请求体**：

```json
{
  "username": "hr_bob",
  "password": "Init123456",
  "roleIds": ["uuid-of-HR_USER-role"]
}
```

- `username`：必需，在系统内唯一
- `password`：必需，长度 ≥ 6
- `roleIds`：可选，创建时分配角色列表

**成功响应 `201`**：返回 `UserDTO`（见[数据类型](#userdto)）

**错误响应**：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `USER_422_USERNAME_BLANK` | 422 | 用户名为空 |
| `USER_422_PASSWORD_TOO_SHORT` | 422 | 密码不足 6 位 |
| `USER_409_USERNAME_EXISTS` | 409 | 用户名已存在 |

---

### 3.3 重置用户密码（管理员操作）

**`POST /api/v1/users/{id}/reset-password`** — 权限：`user:reset-password`

**路径参数**：`id` — 用户 UUID

**使用场景**：用户忘记密码，管理员帮忙重置后告知临时密码。

**无请求体**

**成功响应 `200`**：

```json
{
  "data": {
    "success": true,
    "message": "临时密码已发送至系统管理员，请联系管理员获取新密码"
  }
}
```

> 重置后 `forcePasswordChange` 被设为 `true`，用户下次登录必须修改密码。出于安全原因，临时密码不在 API 响应中返回，仅输出至服务器日志，需由管理员通过安全渠道告知用户。

**错误响应**：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `USER_404_NOT_FOUND` | 404 | 用户不存在 |

---

### 3.4 修改用户名

**`PATCH /api/v1/users/{id}/username`** — 权限：`user:update`

**路径参数**：`id` — 用户 UUID

**使用场景**：管理员帮助用户修改账号名（如人员信息变更）。

**请求体**：

```json
{ "newUsername": "hr_bob_new" }
```

**成功响应 `200`**：返回更新后的 `UserDTO`

**错误响应**：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `USER_404_NOT_FOUND` | 404 | 用户不存在 |
| `USER_422_USERNAME_BLANK` | 422 | 新用户名为空 |
| `USER_422_USERNAME_SAME` | 422 | 新旧用户名相同 |
| `USER_409_USERNAME_EXISTS` | 409 | 新用户名已存在 |

---

### 3.5 查看用户的角色

**`GET /api/v1/users/{userId}/roles`** — 权限：`user:view`

**路径参数**：`userId` — 用户 UUID

**使用场景**：查看某用户当前拥有哪些角色（用于角色分配表单的回填）。

**响应 `200`**：

```json
{
  "data": ["ADMIN", "HR_USER"]
}
```

---

### 3.6 分配用户角色

**`PATCH /api/v1/users/{userId}/roles`** — 权限：`user:update`

**路径参数**：`userId` — 用户 UUID

**使用场景**：管理员在用户编辑页调整角色（整体覆盖，非追加）。

**请求体**：

```json
{
  "roleIds": ["uuid-of-HR_USER-role"]
}
```

**成功响应**：`204 No Content`

> 传入空数组 `[]` 可清空用户的所有角色。

---

### 3.7 更新用户状态

**`PATCH /api/v1/users/{id}/status`** — 权限：`user:update`

**使用场景**：在用户管理页面启用/禁用某个用户。

**请求体**：

```json
{ "status": "00000000-0000-0000-0000-000000000112" }
```

`status` 仅支持 `"ACTIVE"` 或 `"DISABLED"`。

**成功响应 `200`**：返回更新后的 `UserDTO`（同用户列表中的单条格式）。

**业务规则**：

- 不能修改自己的状态（409 `USER_409_CANNOT_CHANGE_OWN_STATUS`）
- 禁用时自动撤销该用户的所有 refresh token，已登录的设备在 access token 过期后无法续签

---

### 3.8 删除用户

**`DELETE /api/v1/users/{id}`** — 权限：`user:delete`

**使用场景**：永久删除一个用户。

**成功响应**：`204 No Content`

**业务规则**：

- 不能删除自己（409 `USER_409_CANNOT_DELETE_SELF`）
- 不能删除拥有 ADMIN 角色的用户（409 `USER_409_CANNOT_DELETE_ADMIN`）
- 级联删除：用户角色关联、refresh token 一并删除

---

## 4. 角色与权限管理

### 4.1 获取角色列表

**`GET /api/v1/roles`** — 权限：`role:view`

**使用场景**：

- 角色管理页面列表展示
- 创建/编辑用户时的角色选择下拉框

**响应 `200`**：

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "ADMIN",
      "description": "系统管理员",
      "isSystem": true,
      "createdAt": "2025-01-01 08:00:00",
      "updatedAt": "2025-01-01 08:00:00"
    },
    {
      "id": "uuid",
      "name": "HR_USER",
      "description": "人事专员",
      "isSystem": true,
      "createdAt": "2025-01-01 08:00:00",
      "updatedAt": "2025-01-01 08:00:00"
    }
  ]
}
```

---

### 4.2 获取角色详情（含权限列表）

**`GET /api/v1/roles/{id}`** — 权限：`role:view`

**路径参数**：`id` — 角色 UUID

**使用场景**：编辑角色时回填已有权限，展示角色权限明细。

**响应 `200`**：

```json
{
  "data": {
    "id": "uuid",
    "name": "HR_USER",
    "description": "人事专员",
    "isSystem": true,
    "permissions": [
      { "id": "uuid", "code": "employee:view", "description": "查看员工" },
      { "id": "uuid", "code": "employee:create", "description": "创建员工档案" },
      { "id": "uuid", "code": "org:view", "description": "查看组织" }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### 4.3 创建角色

**`POST /api/v1/roles`** — 权限：`role:create`

**使用场景**：根据业务需要创建自定义角色（如"财务主管"）。

**请求体**：

```json
{
  "name": "FINANCE_MANAGER",
  "description": "财务主管",
  "permissionIds": ["uuid-permission-1", "uuid-permission-2"]
}
```

- `name`：必需，系统内唯一
- `description`：可选
- `permissionIds`：可选，关联的权限 UUID 列表

**成功响应 `201`**：返回 `RoleDetailDTO`

**错误响应**：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `ROLE_422_NAME_BLANK` | 422 | 角色名为空 |
| `ROLE_409_NAME_EXISTS` | 409 | 角色名已存在 |

---

### 4.4 更新角色

**`PATCH /api/v1/roles/{id}`** — 权限：`role:update`

**路径参数**：`id` — 角色 UUID

**使用场景**：调整角色的描述或权限范围（整体覆盖权限列表）。

**请求体**（所有字段可选）：

```json
{
  "name": "FINANCE_MANAGER",
  "description": "财务主管（更新后）",
  "permissionIds": ["uuid-permission-1", "uuid-permission-2", "uuid-permission-3"]
}
```

**成功响应 `200`**：返回更新后的 `RoleDetailDTO`

**错误响应**：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `ROLE_404_NOT_FOUND` | 404 | 角色不存在 |
| `ROLE_409_SYSTEM_ROLE_CANNOT_RENAME` | 409 | 系统角色不能改名（可修改权限，不能改 name） |

---

### 4.5 删除角色

**`DELETE /api/v1/roles/{id}`** — 权限：`role:delete`

**路径参数**：`id` — 角色 UUID

**使用场景**：删除不再需要的自定义角色。

**成功响应**：`204 No Content`

**错误响应**：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `ROLE_404_NOT_FOUND` | 404 | 角色不存在 |
| `ROLE_409_SYSTEM_ROLE_CANNOT_DELETE` | 409 | 系统预设角色（ADMIN/HR_USER）不能删除 |

---

### 4.6 获取所有权限列表

**`GET /api/v1/permissions`** — 权限：`permission:view`

**使用场景**：创建/编辑角色时，展示可勾选的权限项列表。

**响应 `200`**：

```json
{
  "data": [
    { "id": "uuid", "code": "user:view", "description": "查看用户列表" },
    { "id": "uuid", "code": "user:create", "description": "创建用户" },
    { "id": "uuid", "code": "user:update", "description": "修改用户名/状态/分配角色" },
    { "id": "uuid", "code": "user:delete", "description": "删除用户" },
    { "id": "uuid", "code": "user:reset-password", "description": "重置用户密码" },
    { "id": "uuid", "code": "role:view", "description": "查看角色列表" },
    { "id": "uuid", "code": "role:create", "description": "创建角色" },
    { "id": "uuid", "code": "role:update", "description": "修改角色" },
    { "id": "uuid", "code": "role:delete", "description": "删除角色" },
    { "id": "uuid", "code": "permission:view", "description": "查看权限列表" },
    { "id": "uuid", "code": "employee:view", "description": "查看员工" },
    { "id": "uuid", "code": "employee:create", "description": "创建员工档案" },
    { "id": "uuid", "code": "employee:update", "description": "修改员工档案" },
    { "id": "uuid", "code": "employee:delete", "description": "删除员工档案" },
    { "id": "uuid", "code": "org:view", "description": "查看组织" },
    { "id": "uuid", "code": "org:create", "description": "创建组织" },
    { "id": "uuid", "code": "org:update", "description": "修改组织" },
    { "id": "uuid", "code": "org:delete", "description": "删除组织" },
    { "id": "uuid", "code": "position:view", "description": "查看职位" },
    { "id": "uuid", "code": "position:create", "description": "创建职位" },
    { "id": "uuid", "code": "position:update", "description": "修改职位" },
    { "id": "uuid", "code": "position:delete", "description": "删除职位" },
    { "id": "uuid", "code": "dictionary:manage", "description": "管理数据字典" }
  ]
}
```

---

## 5. 员工管理

### 5.1 分页查询员工列表

**`GET /api/v1/employees`** — 权限：`employee:view`

**使用场景**：员工管理列表页，支持分页、高级条件组合检索与多字段排序。

**查询参数**：
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | int | `1` | 当前页码（从 1 开始） |
| `size` | int | `20` | 每页条数 |
| `keyword` | string | — | 按姓名/工号/身份证号/手机号/邮箱/地址模糊搜索 |
| `employeeNo` | string | — | 按工号模糊过滤 |
| `name` | string | — | 按姓名模糊过滤 |
| `idCardNo` | string | — | 按身份证号模糊过滤 |
| `phone` | string | — | 按手机号模糊过滤 |
| `email` | string | — | 按邮箱模糊过滤 |
| `workAddress` | string | — | 按工作地址模糊过滤 |
| `contactAddress` | string | — | 按联系地址模糊过滤 |
| `statuses` / `status` | string[] | — | 员工状态字典项 UUID 列表（逗号分隔或重复参数均可） |
| `genders` | string[] | — | 性别列表（`MALE` / `FEMALE`） |
| `employmentTypes` | string[] | — | 用工形式字典项 UUID 列表 |
| `educations` | string[] | — | 学历字典项 UUID 列表 |
| `ethnicities` | string[] | — | 民族表 UUID 列表（引用 `/api/v1/ethnicities` 返回的 `id`） |
| `politicalStatuses` | string[] | — | 政治面貌列表 |
| `nativePlaces` | string[] | — | 籍贯行政区划代码列表 |
| `primaryOrgUnitIds` | string[] | — | 主任职组织 UUID 列表 |
| `primaryPositionIds` | string[] | — | 主任职职位 UUID 列表 |
| `ageMin` | int | — | 最小年龄（0-150） |
| `ageMax` | int | — | 最大年龄（0-150） |
| `birthDateFrom` | string | — | 出生日期起始（`yyyy-MM-dd`） |
| `birthDateTo` | string | — | 出生日期结束（`yyyy-MM-dd`） |
| `hireDateFrom` | string | — | 入职日期起始（`yyyy-MM-dd`） |
| `hireDateTo` | string | — | 入职日期结束（`yyyy-MM-dd`） |
| `sort` | string[] | `employeeNo:asc,id:asc` | 排序规则，格式 `field:asc|desc`，支持逗号分隔或重复参数 |

**请求示例**：

```
GET /api/v1/employees?page=1&size=20&keyword=张&statuses=uuid-of-在职&educations=uuid-of-本科&nativePlaces=110000&sort=hireDate:desc,name:asc
```

**响应 `200`**：

```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "employeeNo": "E001",
        "idCardNo": "110101199001011234",
        "age": 34,
        "name": "张三",
        "gender": "MALE",
        "birthDate": "1990-01-01",
        "phone": "13800138000",
        "email": "zhangsan@example.com",
        "workAddress": "北京市朝阳区某街道",
        "contactAddress": null,
        "photoPath": "data/uploads/employees/photos/uuid/photo_abc123.jpg",
        "hireDate": "2020-01-01",
        "status": "uuid-of-在职",
        "ethnicity": "uuid-of-汉族字典项",
        "politicalStatus": "群众",
        "education": "uuid-of-本科",
        "nativePlace": "110105",
        "employmentType": "uuid-of-全职",
        "createdAt": "2025-01-01 08:00:00",
        "updatedAt": "2025-06-01 10:30:00"
      }
    ],
    "page": 1,
    "size": 20,
    "total": 85,
    "totalPages": 5
  }
}
```

> `status`、`employmentType` 字段存储的是字典项 UUID，前端展示时需通过字典缓存映射为中文 label。
>
> `ethnicity` 字段存储的是民族表 UUID（引用 `ethnicities` 表），前端展示时通过调用 `/api/v1/ethnicities` 获取完整民族列表并在本地做 `id -> name` 映射，支持按 `name`、`romanizedName`、`alphaCode`、`numericCode` 本地模糊搜索。
>
> `education` 也是字典项 UUID；`nativePlace` 为行政区划代码（省/市/区），通常需要通过 `/api/v1/regions` 做级联选择并缓存 code->name 映射。

---

### 5.2 获取员工详情

**`GET /api/v1/employees/{id}`** — 权限：`employee:view`

**路径参数**：`id` — 员工 UUID

**使用场景**：点击员工进入详情页，展示完整信息、任职分配、附件列表。

**响应 `200`**：

```json
{
  "data": {
    "id": "uuid",
    "employeeNo": "E001",
    "idCardNo": "110101199001011234",
    "age": 34,
    "name": "张三",
    "gender": "MALE",
    "birthDate": "1990-01-01",
    "phone": "13800138000",
    "email": "zhangsan@example.com",
    "workAddress": "北京市朝阳区某街道",
    "contactAddress": null,
    "photoPath": "data/uploads/employees/photos/uuid/photo_abc123.jpg",
    "hireDate": "2020-01-01",
    "status": "uuid-of-在职",
    "ethnicity": "uuid-of-汉族字典项",
    "politicalStatus": "群众",
    "employmentType": "uuid-of-全职",
    "assignments": [
      {
        "id": "uuid",
        "orgUnitId": "uuid-技术部",
        "orgUnitName": "技术部",
        "positionId": "uuid-高级工程师",
        "positionName": "高级工程师",
        "isPrimary": true,
        "startDate": "2020-01-01",
        "endDate": null
      }
    ],
    "attachments": [
      {
        "id": "uuid",
        "originalName": "劳动合同.pdf",
        "storedName": "attachment_xyz789.pdf",
        "contentType": "application/pdf",
        "filePath": "data/uploads/employees/attachments/uuid/attachment_xyz789.pdf",
        "fileSize": 2048000,
        "uploadedAt": "2025-01-01 08:00:00"
      }
    ],
    "createdAt": "2025-01-01 08:00:00",
    "updatedAt": "2025-06-01 10:30:00"
  }
}
```

**错误响应**：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `EMPLOYEE_404_NOT_FOUND` | 404 | 员工不存在 |

---

### 5.3 创建员工

**`POST /api/v1/employees`** — 权限：`employee:create`

**使用场景**：入职流程，HR 录入新员工档案（可同时上传照片和附件）。

支持两种提交格式：

#### 方式一：JSON（不含文件）

```
Content-Type: application/json
```

```json
{
  "name": "李四",
  "idCardNo": "310101199205152345",
  "age": 32,
  "gender": "FEMALE",
  "birthDate": "1992-05-15",
  "hireDate": "2025-04-01",
  "employmentType": "uuid-of-全职字典项",
  "employeeNo": "E002",
  "phone": "13900139000",
  "email": "lisi@company.com",
  "workAddress": "上海市浦东新区",
  "contactAddress": null,
  "status": "uuid-of-在职字典项",
  "ethnicity": "uuid-of-汉族字典项",
  "politicalStatus": "共青团员",
  "education": "uuid-of-本科字典项",
  "nativePlace": "110105",
  "assignments": [
    {
      "orgUnitId": "uuid-产品部",
      "positionId": "uuid-产品经理",
      "isPrimary": true,
      "startDate": "2025-04-01",
      "endDate": null
    }
  ]
}
```

#### 方式二：multipart/form-data（含文件上传）

```
Content-Type: multipart/form-data
```

表单字段同 JSON 字段，`assignments` 以 JSON 字符串传递，另外可附加：

- `photo`：照片文件（单个，jpg/png）
- `attachments`：附件文件（可多个，pdf/doc/docx 等）

**必填字段（7个）**：`name`, `idCardNo`, `age`, `gender`, `birthDate`, `hireDate`, `employmentType`

**成功响应 `201`**：返回 `EmployeeDetailDTO`

**错误响应**：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `EMPLOYEE_422_NAME_BLANK` | 422 | 姓名为空 |
| `EMPLOYEE_422_AGE_INVALID` | 422 | 年龄不在 0–150 范围 |
| `EMPLOYEE_422_REQUIRED_FIELDS_MISSING` | 422 | 必填字段缺失 |
| `EMPLOYEE_409_EMPLOYEE_NO_EXISTS` | 409 | 工号已存在 |
| `EMPLOYEE_409_ID_CARD_NO_EXISTS` | 409 | 身份证号已存在 |

---

### 5.4 更新员工

**`PUT /api/v1/employees/{id}`** — 权限：`employee:update`

**路径参数**：`id` — 员工 UUID

**使用场景**：编辑员工档案（修改基本信息、调整任职分配、补充附件）。

**请求格式**：同创建员工（JSON 或 multipart/form-data）。

**7 个核心字段必填**（同创建）。

**`assignments` 处理规则**：

- **传入**：整体替换该员工的所有任职分配
- **不传**：保持现有任职分配不变

**附件处理规则**：

- 新上传的附件追加到已有附件，不自动删除旧附件

**成功响应 `200`**：返回更新后的 `EmployeeDetailDTO`

**错误响应**：同创建员工，另加：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `EMPLOYEE_404_NOT_FOUND` | 404 | 员工不存在 |

---

### 5.5 删除员工

**`DELETE /api/v1/employees/{id}`** — 权限：`employee:delete`

**路径参数**：`id` — 员工 UUID

**使用场景**：删除员工档案（级联删除任职记录和附件文件）。

**成功响应**：`204 No Content`

**错误响应**：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `EMPLOYEE_404_NOT_FOUND` | 404 | 员工不存在 |

---

### 5.6 员工列表配置中心（列布局偏好）

> 这组接口仅要求登录，不需要额外 RBAC 权限。偏好按当前用户隔离。

#### 5.6.1 获取当前用户偏好

**`GET /api/v1/employees/preferences/list-layout`**

**响应 `200`**：

```json
{
  "data": {
    "userId": "uuid-of-current-user",
    "columns": [
      { "fieldKey": "employeeNo", "visible": true, "order": 1, "width": 140 },
      { "fieldKey": "name", "visible": true, "order": 2, "width": 160 },
      { "fieldKey": "nativePlace", "visible": true, "order": 10, "width": 180 }
    ],
    "updatedAt": "2025-07-20 12:30:00"
  }
}
```

#### 5.6.2 保存当前用户偏好

**`PUT /api/v1/employees/preferences/list-layout`**

**请求体**：

```json
{
  "columns": [
    { "fieldKey": "employeeNo", "visible": true, "order": 1, "width": 140 },
    { "fieldKey": "name", "visible": true, "order": 2, "width": 160 },
    { "fieldKey": "education", "visible": true, "order": 9, "width": 140 },
    { "fieldKey": "nativePlace", "visible": true, "order": 10, "width": 180 }
  ]
}
```

**校验规则**：

- 必须提交完整字段集合（不能只提交局部列）
- `fieldKey` 必须全部合法且不能重复
- `order` 必须从 1 开始连续且不能重复

#### 5.6.3 重置当前用户偏好

**`DELETE /api/v1/employees/preferences/list-layout`**

重置为系统默认列布局并返回最新偏好。

---

## 6. 组织管理

### 6.0 行政区划只读查询（省/市/区）

> 行政区划使用独立只读模型，不走字典表；仅提供查询接口。

**`GET /api/v1/regions`**（仅登录）

查询参数：

- `code`：按行政区划代码精确匹配
- `parentCode`：按父级代码精确匹配
- `level`：级别（1=省，2=市，3=区县）
- `keyword`：按代码/名称/全名模糊搜索

**`GET /api/v1/regions/{code}`**（仅登录）

按代码查询单条详情。

### 6.0.1 民族只读查询

> 民族使用独立只读模型，不走字典表；仅提供查询接口。  
> **前端模糊搜索完全在本地完成**，后端仅提供完整列表，无 keyword 参数。  
> 启动时一次性缓存民族列表，通过 `id → name` 映射供 `ethnicity` 字段展示。

**`GET /api/v1/ethnicities`**（仅登录）

查询参数：
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `includeDisabled` | boolean | `false` | 是否包含已禁用民族项 |

**响应 `200`**：

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-of-汉族",
      "name": "汉族",
      "romanizedName": "Han",
      "alphaCode": "HA",
      "numericCode": "001",
      "isSystem": false,
      "isEnabled": true,
      "sortOrder": 1
    },
    {
      "id": "uuid-of-外国人",
      "name": "外国人",
      "romanizedName": "Foreign",
      "alphaCode": "FG",
      "numericCode": "997",
      "isSystem": true,
      "isEnabled": true,
      "sortOrder": 997
    }
  ]
}
```

**前端使用建议**：

1. 应用初始化时调用 `/api/v1/ethnicities` 并将结果缓存至 store
2. 员工表单选择民族时，在本地对缓存数据进行模糊搜索，可按以下字段过滤：
   - `name`：中文名称（如 "汉"）
   - `romanizedName`：英文拼写（如 "Han"）
   - `alphaCode`：字母代码（如 "HA"）
   - `numericCode`：数字代码（如 "001"）
3. 员工 DTO 的 `ethnicity` 字段存储民族 UUID，展示时通过缓存映射 `id → name`

**`GET /api/v1/ethnicities/{id}`**（仅登录）

按 UUID 查询单条民族详情。

**响应 `404`**：民族 UUID 不存在时返回。

### 6.1 获取组织列表或树

**`GET /api/v1/organizations`** — 权限：`org:view`

**使用场景**：

- `tree=false`（默认）：组织管理列表页，或初始化组织平铺数据
- `tree=true`：渲染左侧组织树导航、部门选择器 TreeSelect

**查询参数**：

| 参数   | 类型    | 默认值  | 说明               |
| ------ | ------- | ------- | ------------------ |
| `tree` | boolean | `false` | 是否以树形结构返回 |

**平铺响应 `200`**（`tree=false`）：

```json
{
  "data": [
    {
      "id": "uuid-A",
      "name": "集团总部",
      "type": "GROUP",
      "parentId": null,
      "createdAt": "...",
      "updatedAt": "..."
    },
    {
      "id": "uuid-B",
      "name": "技术公司",
      "type": "COMPANY",
      "parentId": "uuid-A",
      "createdAt": "...",
      "updatedAt": "..."
    },
    {
      "id": "uuid-C",
      "name": "技术部",
      "type": "DEPARTMENT",
      "parentId": "uuid-B",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

**树形响应 `200`**（`tree=true`）：

```json
{
  "data": [
    {
      "id": "uuid-A",
      "name": "集团总部",
      "type": "GROUP",
      "parentId": null,
      "children": [
        {
          "id": "uuid-B",
          "name": "技术公司",
          "type": "COMPANY",
          "parentId": "uuid-A",
          "children": [
            {
              "id": "uuid-C",
              "name": "技术部",
              "type": "DEPARTMENT",
              "parentId": "uuid-B",
              "children": []
            }
          ]
        }
      ]
    }
  ]
}
```

---

### 6.2 获取单个组织详情

**`GET /api/v1/organizations/{id}`** — 权限：`org:view`

**路径参数**：`id` — 组织 UUID

**使用场景**：编辑组织时回填字段。

**响应 `200`**：返回 `OrgUnitDTO`

---

### 6.3 获取组织子树

**`GET /api/v1/organizations/{id}/subtree`** — 权限：`org:view`

**路径参数**：`id` — 组织 UUID

**使用场景**：只展示某节点及其所有子孙（例如某公司下的所有部门）。

**响应 `200`**：该组织及所有后代节点的平铺列表（含自身）

---

### 6.4 获取组织到根路径（面包屑）

**`GET /api/v1/organizations/{id}/path`** — 权限：`org:view`

**路径参数**：`id` — 组织 UUID

**使用场景**：组织树页面的面包屑导航，显示"集团总部 / 技术公司 / 技术部"。

**响应 `200`**：

```json
{
  "data": [
    { "id": "uuid-A", "name": "集团总部", "type": "GROUP", "parentId": null },
    { "id": "uuid-B", "name": "技术公司", "type": "COMPANY", "parentId": "uuid-A" },
    { "id": "uuid-C", "name": "技术部", "type": "DEPARTMENT", "parentId": "uuid-B" }
  ]
}
```

从根节点排列到目标节点，顺序为从父到子。

---

### 6.5 创建组织

**`POST /api/v1/organizations`** — 权限：`org:create`

**使用场景**：在组织树中添加新节点（公司、部门等）。

**请求体**：

```json
{
  "name": "研发中心",
  "type": "DEPARTMENT",
  "parentId": "uuid-B"
}
```

- `name`：必需
- `type`：必需，值来自字典 `org_unit_type`（如 `GROUP`、`COMPANY`、`DEPARTMENT`）
- `parentId`：可选，不传则为顶级节点

**成功响应 `201`**：返回 `OrgUnitDTO`

**错误响应**：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `ORG_422_NAME_BLANK` | 422 | 名称为空 |
| `ORG_422_PARENT_NOT_FOUND` | 422 | 父组织不存在 |

---

### 6.6 更新组织

**`PATCH /api/v1/organizations/{id}`** — 权限：`org:update`

**路径参数**：`id` — 组织 UUID

**使用场景**：修改组织名称或类型。

**请求体**（字段可选）：

```json
{
  "name": "研发中心（更名后）",
  "type": "DEPARTMENT"
}
```

**成功响应 `200`**：返回更新后的 `OrgUnitDTO`

---

### 6.7 移动组织（变更上级）

**`POST /api/v1/organizations/{id}/actions/move`** — 权限：`org:update`

**路径参数**：`id` — 组织 UUID

**使用场景**：拖拽调整组织树节点，将某部门移到另一个父节点下。

**请求体**：

```json
{
  "parentId": "uuid-目标父节点"
}
```

- `parentId`：新的父节点 UUID，传 `null` 或不传表示提升为顶级节点

**成功响应 `200`**：返回更新后的 `OrgUnitDTO`

---

### 6.8 删除组织

**`DELETE /api/v1/organizations/{id}`** — 权限：`org:delete`

**路径参数**：`id` — 组织 UUID

**使用场景**：删除空的叶节点组织（无子部门，无员工）。

**成功响应**：`204 No Content`

**错误响应**：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `ORG_404_NOT_FOUND` | 404 | 组织不存在 |
| `ORG_409_HAS_CHILDREN` | 409 | 有子部门，需先删除子部门 |
| `ORG_409_HAS_EMPLOYEES` | 409 | 有员工在岗，需先转移员工 |

---

## 7. 职位管理

### 7.1 获取职位列表

**`GET /api/v1/positions`** — 权限：`position:view`

**使用场景**：

- 无参：展示全部职位
- `orgUnitId=uuid`：员工表单中根据选定部门联动显示该部门下的职位

**查询参数**：
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `orgUnitId` | UUID | — | 可选，过滤指定组织单元下的职位 |

**响应 `200`**：

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "高级工程师",
      "description": "负责后端架构设计与实现",
      "orgUnitId": "uuid-技术部",
      "orgUnitName": "技术部",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

### 7.2 获取职位详情

**`GET /api/v1/positions/{id}`** — 权限：`position:view`

**路径参数**：`id` — 职位 UUID

**使用场景**：编辑职位时回填字段。

**响应 `200`**：返回 `PositionDTO`

---

### 7.3 创建职位

**`POST /api/v1/positions`** — 权限：`position:create`

**使用场景**：为某部门设置新职位。

**请求体**：

```json
{
  "name": "前端工程师",
  "orgUnitId": "uuid-技术部",
  "description": "负责前端界面开发与维护"
}
```

- `name`：必需
- `orgUnitId`：必需，必须是已存在的组织单元 UUID
- `description`：可选

**成功响应 `201`**：返回 `PositionDTO`

**错误响应**：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `POSITION_422_NAME_BLANK` | 422 | 职位名为空 |

---

### 7.4 更新职位

**`PUT /api/v1/positions/{id}`** — 权限：`position:update`

**路径参数**：`id` — 职位 UUID

**使用场景**：修改职位名称或描述。

**请求体**（字段可选）：

```json
{
  "name": "资深前端工程师",
  "description": "负责前端架构与技术规范制定"
}
```

**成功响应 `200`**：返回更新后的 `PositionDTO`

---

### 7.5 删除职位

**`DELETE /api/v1/positions/{id}`** — 权限：`position:delete`

**路径参数**：`id` — 职位 UUID

**使用场景**：删除不再使用的职位（需无员工持有该职位）。

**成功响应**：`204 No Content`

**错误响应**：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `POSITION_404_NOT_FOUND` | 404 | 职位不存在 |
| `POSITION_409_HAS_EMPLOYEES` | 409 | 有员工持有此职位，不能删除 |

---

## 8. 数据字典

数据字典管理系统中的枚举选项（员工状态、用工形式、组织类型等）。

**读取接口**：仅需登录认证，无额外权限要求  
**写入接口**：需 `dictionary:manage` 权限

### 8.1 获取字典分类列表

**`GET /api/v1/dictionaries`** — 仅需登录

**使用场景**：

- 无参数：初始化字典分类列表（管理页使用）
- `include=items`：**应用启动时预加载所有字典数据**（最常用，一次拉取所有分类和字典项）
- `orgUnitId=uuid`：获取全局分类 + 该组织的私有分类

**查询参数**：
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `orgUnitId` | UUID | — | 可选，附加返回该组织的私有字典 |
| `include` | string | — | 可选，仅支持值 `items`；传入后每个分类附带 `items` 数组 |

**默认响应 `200`**（不传 `include`）：

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "员工状态",
      "description": "员工在职状态选项",
      "isSystem": true,
      "orgUnitId": null,
      "createdAt": "...",
      "updatedAt": "..."
    },
    {
      "id": "uuid",
      "name": "用工形式",
      "description": "员工用工类型",
      "isSystem": true,
      "orgUnitId": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

**含字典项响应 `200`**（`include=items`）：

```json
{
  "data": [
    {
      "id": "uuid-employee-status",
      "name": "员工状态",
      "description": "员工在职状态选项",
      "isSystem": true,
      "orgUnitId": null,
      "items": [
        {
          "id": "uuid-在职",
          "categoryId": "uuid-employee-status",
          "label": "在职",
          "sortOrder": 1,
          "isDefault": true,
          "isEnabled": true,
          "color": "#52c41a",
          "createdAt": "...",
          "updatedAt": "..."
        },
        {
          "id": "uuid-离职",
          "categoryId": "uuid-employee-status",
          "label": "离职",
          "sortOrder": 2,
          "isDefault": false,
          "isEnabled": true,
          "color": "#ff4d4f",
          "createdAt": "...",
          "updatedAt": "..."
        },
        {
          "id": "uuid-退休",
          "categoryId": "uuid-employee-status",
          "label": "退休",
          "sortOrder": 3,
          "isDefault": false,
          "isEnabled": true,
          "color": "#faad14",
          "createdAt": "...",
          "updatedAt": "..."
        }
      ],
      "createdAt": "...",
      "updatedAt": "..."
    },
    {
      "id": "uuid-employment-type",
      "name": "用工形式",
      "description": "员工用工类型",
      "isSystem": true,
      "orgUnitId": null,
      "items": [
        {
          "id": "uuid-全职",
          "categoryId": "uuid-employment-type",
          "label": "全职",
          "sortOrder": 1,
          "isDefault": true,
          "isEnabled": true,
          "color": null,
          "createdAt": "...",
          "updatedAt": "..."
        }
      ],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

**错误响应**：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `DICT_400_INVALID_INCLUDE` | 400 | `include` 参数值非法（只允许 `items`） |

---

### 8.2 获取字典分类详情（含所有字典项）

**`GET /api/v1/dictionaries/{id}`** — 仅需登录

**路径参数**：`id` — 字典分类 UUID

**使用场景**：字典管理页查看单个分类的完整字典项。

**响应 `200`**：

```json
{
  "data": {
    "id": "uuid",
    "name": "员工状态",
    "description": "员工在职状态选项",
    "isSystem": true,
    "orgUnitId": null,
    "items": [
      {
        "id": "uuid",
        "categoryId": "uuid",
        "label": "在职",
        "sortOrder": 1,
        "isDefault": true,
        "isEnabled": true,
        "color": "#52c41a",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### 8.3 创建字典分类

**`POST /api/v1/dictionaries`** — 权限：`dictionary:manage`

**使用场景**：新增业务需要的枚举分类（如"学历"、"技术方向"）。

**请求体**：

```json
{
  "name": "学历",
  "description": "员工学历信息",
  "orgUnitId": null
}
```

- `name`：必需，同一 `orgUnitId` 范围内唯一
- `description`：可选
- `orgUnitId`：可选，传 UUID 则创建该组织的私有字典，不传（或传 null）则为全局字典

**成功响应 `201`**：返回 `DictionaryCategoryDTO`（不含 `items`）

**错误响应**：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `DICT_422_NAME_BLANK` | 422 | 名称为空 |
| `DICT_409_NAME_EXISTS` | 409 | 同范围内名称已存在 |

---

### 8.4 更新字典分类

**`PUT /api/v1/dictionaries/{id}`** — 权限：`dictionary:manage`

**路径参数**：`id` — 字典分类 UUID

**使用场景**：修改自定义字典分类的名称或描述。

**请求体**（字段可选）：

```json
{
  "name": "学历（更新）",
  "description": "员工最高学历"
}
```

**成功响应 `200`**：返回 `DictionaryCategoryDTO`

**错误响应**：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `DICT_404_NOT_FOUND` | 404 | 字典分类不存在 |
| `DICT_409_SYSTEM_PROTECTED` | 409 | 系统内置字典不可修改名称 |

---

### 8.5 删除字典分类

**`DELETE /api/v1/dictionaries/{id}`** — 权限：`dictionary:manage`

**路径参数**：`id` — 字典分类 UUID

**使用场景**：删除不再使用的自定义字典分类（级联删除所有字典项）。

**成功响应**：`204 No Content`

**错误响应**：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `DICT_404_NOT_FOUND` | 404 | 字典分类不存在 |
| `DICT_409_SYSTEM_PROTECTED` | 409 | 系统内置字典不可删除 |

---

### 8.6 添加字典项

**`POST /api/v1/dictionaries/{id}/items`** — 权限：`dictionary:manage`

**路径参数**：`id` — 字典分类 UUID

**使用场景**：向字典分类中添加新的选项（如为"学历"分类添加"博士"选项）。

**请求体**：

```json
{
  "label": "博士",
  "sortOrder": 4,
  "isDefault": false,
  "isEnabled": true,
  "color": null
}
```

- `label`：必需，分类内唯一
- `sortOrder`：可选，默认 0，越小越靠前
- `isDefault`：可选，是否为默认选中项
- `isEnabled`：可选，是否启用
- `color`：可选，十六进制颜色值（如 `#52c41a`），用于前端标签着色

**成功响应 `201`**：返回 `DictionaryItemDTO`

**错误响应**：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `DICT_404_NOT_FOUND` | 404 | 字典分类不存在 |
| `DICT_409_ITEM_LABEL_EXISTS` | 409 | 该分类下 label 已存在 |

---

### 8.7 更新字典项

**`PUT /api/v1/dictionaries/{id}/items/{itemId}`** — 权限：`dictionary:manage`

**路径参数**：`id` — 分类 UUID；`itemId` — 字典项 UUID

**使用场景**：修改字典项的标签、排序、颜色或启用状态。

**请求体**（字段可选）：

```json
{
  "label": "博士研究生",
  "sortOrder": 5,
  "isDefault": false,
  "isEnabled": true,
  "color": "#722ed1"
}
```

**成功响应 `200`**：返回更新后的 `DictionaryItemDTO`

**错误响应**：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `DICT_404_NOT_FOUND` | 404 | 分类不存在 |
| `DICT_404_ITEM_NOT_FOUND` | 404 | 字典项不存在 |

---

### 8.8 删除字典项

**`DELETE /api/v1/dictionaries/{id}/items/{itemId}`** — 权限：`dictionary:manage`

**路径参数**：`id` — 分类 UUID；`itemId` — 字典项 UUID

**使用场景**：彻底删除某个字典选项。

**注意**：此接口直接物理删除字典项。如果只想禁用而保留历史引用，请使用 8.9 禁用接口。

**成功响应**：`204 No Content`

---

### 8.9 禁用字典项

**`PATCH /api/v1/dictionaries/{id}/items/{itemId}/disable`** — 权限：`dictionary:manage`

**路径参数**：`id` — 分类 UUID；`itemId` — 字典项 UUID

**使用场景**：逻辑禁用字典选项，使其不再出现在正常选项列表中，但历史数据保留引用。

**成功响应 `200`**：返回更新后的 `DictionaryItemDTO`

**错误响应**：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `DICT_409_ITEM_ALREADY_DISABLED` | 409 | 字典项已处于禁用状态 |

---

### 系统内置字典一览

| 分类名   | `isSystem` | 字典项（label）    | 用途                       |
| -------- | ---------- | ------------------ | -------------------------- |
| 员工状态 | `true`     | 在职 / 离职 / 退休 | 员工 `status` 字段         |
| 组织类型 | `true`     | 集团 / 公司 / 部门 | 组织 `type` 字段           |
| 用工形式 | `true`     | 全职               | 员工 `employmentType` 字段 |

> 系统内置字典（`isSystem=true`）：**不可删除分类，不可修改分类名，但可以增删字典项**。

---

## 9. 完整数据类型定义（TypeScript）

```typescript
// ── 通用 ──────────────────────────────────────────────
interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T | null;
}

interface PageResult<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

// ── 认证 ──────────────────────────────────────────────
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  username: string;
  roles: string[];
  permissions: string[];
  forcePasswordChange: boolean;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ── 用户 ──────────────────────────────────────────────
interface UserDTO {
  id: string; // UUID
  username: string;
  roles: string[]; // 角色名称数组，如 ["ADMIN"]
  status: string; // 用户状态字典项 UUID   statusLabel: string;          // 用户状态显示名，如 "激活" / "禁用"
  forcePasswordChange: boolean;
  createdAt: string; // "yyyy-MM-dd HH:mm:ss"
  updatedAt: string;
}

// ── 角色与权限 ─────────────────────────────────────────
interface RoleDTO {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RoleDetailDTO extends RoleDTO {
  permissions: PermissionDTO[];
}

interface PermissionDTO {
  id: string;
  code: string; // 格式 "domain:action"，如 "employee:view"
  description: string;
}

// ── 员工 ──────────────────────────────────────────────
interface EmployeeDTO {
  id: string;
  employeeNo: string | null;
  idCardNo: string;
  age: number;
  name: string;
  gender: "MALE" | "FEMALE";
  birthDate: string; // "yyyy-MM-dd"
  phone: string | null;
  email: string | null;
  workAddress: string | null;
  contactAddress: string | null;
  photoPath: string | null; // 相对路径，如 "data/uploads/employees/photos/{id}/photo_xxx.jpg"
  hireDate: string;
  status: string; // 字典项 UUID（员工状态）
  ethnicity: string | null; // 民族表 UUID（引用 ethnicities 表 id，参见 /api/v1/ethnicities）
  politicalStatus: string | null;
  education: string | null; // 字典项 UUID（学历）
  nativePlace: string | null; // 行政区划代码（如 "110105"）
  employmentType: string; // 字典项 UUID（用工形式）
  createdAt: string;
  updatedAt: string;
}

interface EmployeeDetailDTO extends EmployeeDTO {
  assignments: EmployeeAssignmentDTO[];
  attachments: EmployeeAttachmentDTO[];
}

interface EmployeeAssignmentDTO {
  id: string;
  orgUnitId: string;
  orgUnitName: string;
  positionId: string | null;
  positionName: string | null;
  isPrimary: boolean;
  startDate: string;
  endDate: string | null;
}

interface EmployeeAttachmentDTO {
  id: string;
  originalName: string;
  storedName: string;
  contentType: string; // MIME type，如 "application/pdf"
  filePath: string; // 相对路径
  fileSize: number; // 字节数
  uploadedAt: string;
}

interface AssignmentInput {
  orgUnitId: string;
  positionId?: string | null;
  isPrimary: boolean;
  startDate: string; // "yyyy-MM-dd"
  endDate?: string | null;
}

interface EmployeeListColumnConfig {
  fieldKey: string;
  visible: boolean;
  order: number;
  width?: number | null;
}

interface EmployeeListPreferenceDTO {
  userId: string;
  columns: EmployeeListColumnConfig[];
  updatedAt: string;
}

interface UpdateEmployeeListPreferenceRequest {
  columns: EmployeeListColumnConfig[];
}

interface RegionDTO {
  id: string;
  code: string;
  name: string;
  fullName: string;
  level: number; // 1=省, 2=市, 3=区县
  parentCode: string | null;
}

interface EthnicityDTO {
  id: string; // 民族表 UUID
  name: string; // 民族名称（中文），如 "汉族"
  romanizedName: string; // 罗马字母拼写，如 "Han"
  alphaCode: string; // 字母代码（2~4位），如 "HA"
  numericCode: string; // 数字代码（3位），如 "001"
  isSystem: boolean; // 是否为系统保留项（外国人、未识别民族等）
  isEnabled: boolean;
  sortOrder: number;
}

// ── 组织 ──────────────────────────────────────────────
interface OrgUnitDTO {
  id: string;
  name: string;
  type: string; // 字典项 label，如 "GROUP" | "COMPANY" | "DEPARTMENT"
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OrgUnitTreeNode extends OrgUnitDTO {
  children: OrgUnitTreeNode[];
}

// ── 职位 ──────────────────────────────────────────────
interface PositionDTO {
  id: string;
  name: string;
  description: string | null;
  orgUnitId: string;
  orgUnitName: string;
  createdAt: string;
  updatedAt: string;
}

// ── 数据字典 ───────────────────────────────────────────
interface DictionaryCategoryDTO {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  orgUnitId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DictionaryCategoryDetailDTO extends DictionaryCategoryDTO {
  items: DictionaryItemDTO[];
}

interface DictionaryItemDTO {
  id: string;
  categoryId: string;
  label: string;
  sortOrder: number;
  isDefault: boolean;
  isEnabled: boolean;
  color: string | null; // 十六进制颜色，如 "#52c41a"
  createdAt: string;
  updatedAt: string;
}
```

---

## 10. 权限系统 RBAC

### 10.1 权限结构

```
用户 ──→ 多个角色 ──→ 多个权限
JWT token 的 payload 中直接包含展开后的 permissions 数组
```

### 10.2 完整权限列表

| 权限码                | 说明                         | 常见场景         |
| --------------------- | ---------------------------- | ---------------- |
| `user:view`           | 查看用户列表                 | 用户管理页       |
| `user:create`         | 创建用户                     | 添加系统账号     |
| `user:update`         | 修改用户名/分配角色/更新状态 | 用户编辑表单     |
| `user:delete`         | 删除用户                     | 用户管理页       |
| `user:reset-password` | 重置用户密码                 | 密码找回         |
| `role:view`           | 查看角色列表                 | 角色管理页       |
| `role:create`         | 创建角色                     | 自定义角色       |
| `role:update`         | 修改角色                     | 调整角色权限     |
| `role:delete`         | 删除角色                     | 清理角色         |
| `permission:view`     | 查看权限列表                 | 权限勾选框数据源 |
| `employee:view`       | 查看员工                     | 员工列表/详情    |
| `employee:create`     | 创建员工档案                 | 新员工入职       |
| `employee:update`     | 修改员工档案                 | 信息变更         |
| `employee:delete`     | 删除员工档案                 | 数据清理         |
| `org:view`            | 查看组织                     | 组织树导航       |
| `org:create`          | 创建组织                     | 建立部门         |
| `org:update`          | 修改组织                     | 部门改名/移动    |
| `org:delete`          | 删除组织                     | 撤销部门         |
| `position:view`       | 查看职位                     | 职位选择框       |
| `position:create`     | 创建职位                     | 新增职位         |
| `position:update`     | 修改职位                     | 职位改名         |
| `position:delete`     | 删除职位                     | 清理职位         |
| `dictionary:manage`   | 管理数据字典                 | 字典管理页       |

### 10.3 系统预设角色

| 角色名    | 说明       | 权限范围                                    |
| --------- | ---------- | ------------------------------------------- |
| `ADMIN`   | 系统管理员 | 所有权限                                    |
| `HR_USER` | 人事专员   | 所有 `*:view` 权限 + 所有 `employee:*` 权限 |

### 10.4 前端权限控制实现

```typescript
// stores/auth.ts
const useAuthStore = defineStore("auth", () => {
  const permissions = ref<string[]>([]);

  const hasPermission = (code: string) => permissions.value.includes(code);
  const hasAnyPermission = (codes: string[]) => codes.some((c) => hasPermission(c));

  return { permissions, hasPermission, hasAnyPermission };
});

// 路由守卫示例
router.beforeEach((to) => {
  const requiredPermission = to.meta.permission as string | undefined;
  if (requiredPermission && !authStore.hasPermission(requiredPermission)) {
    return "/403";
  }
});

// 模板中的按钮控制
// <el-button v-if="authStore.hasPermission('employee:create')">新建员工</el-button>
```

---

## 11. 文件上传机制

### 11.1 员工照片

- **上传方式**：创建/更新员工时，`multipart/form-data` 中的 `photo` 字段
- **限制**：单个文件；更新时新照片覆盖旧照片
- **访问**：返回的 `photoPath` 为相对路径，直接拼接 base URL 访问
  ```
  http://localhost:10086/data/uploads/employees/photos/{id}/photo_xxx.jpg
  ```

### 11.2 员工附件

- **上传方式**：`multipart/form-data` 中的 `attachments` 字段（可多个）
- **限制**：更新时追加，不自动删除旧附件
- **访问**：`filePath` 拼接 base URL

### 11.3 FormData 上传完整示例

```typescript
async function createEmployeeWithFiles(
  data: CreateEmployeeRequest,
  photo: File | null,
  attachments: File[],
) {
  const formData = new FormData();

  // 基本字段
  formData.append("name", data.name);
  formData.append("idCardNo", data.idCardNo);
  formData.append("age", String(data.age));
  formData.append("gender", data.gender);
  formData.append("birthDate", data.birthDate);
  formData.append("hireDate", data.hireDate);
  formData.append("employmentType", data.employmentType);

  // 可选字段
  if (data.employeeNo) formData.append("employeeNo", data.employeeNo);
  if (data.phone) formData.append("phone", data.phone);
  if (data.email) formData.append("email", data.email);
  if (data.workAddress) formData.append("workAddress", data.workAddress);
  if (data.contactAddress) formData.append("contactAddress", data.contactAddress);
  if (data.status) formData.append("status", data.status);
  if (data.ethnicity) formData.append("ethnicity", data.ethnicity);
  if (data.politicalStatus) formData.append("politicalStatus", data.politicalStatus);

  // 任职分配（JSON 字符串）
  if (data.assignments.length > 0) {
    formData.append("assignments", JSON.stringify(data.assignments));
  }

  // 文件
  if (photo) formData.append("photo", photo);
  for (const file of attachments) {
    formData.append("attachments", file);
  }

  // 注意：不要手动设置 Content-Type，浏览器自动添加 boundary
  return axios.post("/api/v1/employees", formData, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
```

---

## 12. 完整错误码参考

### 认证

| 错误码                            | HTTP | 说明                                          |
| --------------------------------- | ---- | --------------------------------------------- |
| `AUTH_401_INVALID_CREDENTIALS`    | 401  | 用户名或密码错误                              |
| `AUTH_401_NOT_AUTHENTICATED`      | 401  | 未提供有效认证信息                            |
| `AUTH_401_INVALID_REFRESH_TOKEN`  | 401  | refresh token 无效                            |
| `AUTH_401_REFRESH_TOKEN_EXPIRED`  | 401  | refresh token 已过期                          |
| `AUTH_403_ACCOUNT_DISABLED`       | 403  | 账号已被禁用                                  |
| `AUTH_403_ACCOUNT_LOCKED`         | 403  | 账号被暂时锁定（连续 5 次失败后锁定 15 分钟） |
| `AUTH_403_PERMISSION_DENIED`      | 403  | 权限不足                                      |
| `AUTH_422_OLD_PASSWORD_WRONG`     | 422  | 旧密码错误                                    |
| `AUTH_422_NEW_PASSWORD_TOO_SHORT` | 422  | 新密码不足 6 位                               |

### 用户

| 错误码                              | HTTP | 说明                                  |
| ----------------------------------- | ---- | ------------------------------------- |
| `USER_404_NOT_FOUND`                | 404  | 用户不存在                            |
| `USER_422_USERNAME_BLANK`           | 422  | 用户名为空                            |
| `USER_422_USERNAME_SAME`            | 422  | 新旧用户名相同                        |
| `USER_422_PASSWORD_TOO_SHORT`       | 422  | 密码不足 6 位                         |
| `USER_409_USERNAME_EXISTS`          | 409  | 用户名已存在                          |
| `USER_409_CANNOT_DELETE_SELF`       | 409  | 不能删除自己                          |
| `USER_409_CANNOT_DELETE_ADMIN`      | 409  | 不能删除管理员用户                    |
| `USER_409_CANNOT_CHANGE_OWN_STATUS` | 409  | 不能修改自己的状态                    |
| `USER_422_STATUS_INVALID`           | 422  | 状态值无效（需传用户状态字典项 UUID） |

### 角色

| 错误码                               | HTTP | 说明             |
| ------------------------------------ | ---- | ---------------- |
| `ROLE_404_NOT_FOUND`                 | 404  | 角色不存在       |
| `ROLE_422_NAME_BLANK`                | 422  | 角色名为空       |
| `ROLE_409_NAME_EXISTS`               | 409  | 角色名已存在     |
| `ROLE_409_SYSTEM_ROLE_CANNOT_RENAME` | 409  | 系统角色不能改名 |
| `ROLE_409_SYSTEM_ROLE_CANNOT_DELETE` | 409  | 系统角色不能删除 |

### 员工

| 错误码                                       | HTTP | 说明                                                           |
| -------------------------------------------- | ---- | -------------------------------------------------------------- |
| `EMPLOYEE_404_NOT_FOUND`                     | 404  | 员工不存在                                                     |
| `EMPLOYEE_422_NAME_BLANK`                    | 422  | 姓名为空                                                       |
| `EMPLOYEE_422_AGE_INVALID`                   | 422  | 年龄不在 0–150 范围                                            |
| `EMPLOYEE_422_REQUIRED_FIELDS_MISSING`       | 422  | 必填字段缺失                                                   |
| `EMPLOYEE_409_EMPLOYEE_NO_EXISTS`            | 409  | 工号重复                                                       |
| `EMPLOYEE_409_ID_CARD_NO_EXISTS`             | 409  | 身份证号重复                                                   |
| `EMPLOYEE_422_ETHNICITY_INVALID`             | 422  | 民族 UUID 不存在或无效（需传 `/api/v1/ethnicities` 中的 `id`） |
| `EMPLOYEE_422_ASSIGNMENT_DATE_RANGE_INVALID` | 422  | 归属结束日期不能早于开始日期                                   |

### 组织

| 错误码                     | HTTP | 说明               |
| -------------------------- | ---- | ------------------ |
| `ORG_404_NOT_FOUND`        | 404  | 组织不存在         |
| `ORG_422_NAME_BLANK`       | 422  | 组织名为空         |
| `ORG_422_PARENT_NOT_FOUND` | 422  | 父组织不存在       |
| `ORG_409_HAS_CHILDREN`     | 409  | 有子部门，不能删除 |
| `ORG_409_HAS_EMPLOYEES`    | 409  | 有员工，不能删除   |

### 职位

| 错误码                       | HTTP | 说明             |
| ---------------------------- | ---- | ---------------- |
| `POSITION_404_NOT_FOUND`     | 404  | 职位不存在       |
| `POSITION_422_NAME_BLANK`    | 422  | 职位名为空       |
| `POSITION_409_HAS_EMPLOYEES` | 409  | 有员工持有此职位 |

### 数据字典

| 错误码                           | HTTP | 说明                               |
| -------------------------------- | ---- | ---------------------------------- |
| `DICT_404_NOT_FOUND`             | 404  | 字典分类不存在                     |
| `DICT_404_ITEM_NOT_FOUND`        | 404  | 字典项不存在                       |
| `DICT_422_NAME_BLANK`            | 422  | 名称为空                           |
| `DICT_409_NAME_EXISTS`           | 409  | 分类名重复                         |
| `DICT_409_ITEM_LABEL_EXISTS`     | 409  | 字典项 label 重复                  |
| `DICT_409_SYSTEM_PROTECTED`      | 409  | 系统字典受保护                     |
| `DICT_409_ITEM_ALREADY_DISABLED` | 409  | 字典项已处于禁用状态               |
| `DICT_400_INVALID_INCLUDE`       | 400  | include 参数非法（仅支持 `items`） |

---

## 13. 前端集成工作流

### 13.1 应用初始化流程

```
1. 打开应用
   └─ 检查本地是否有 accessToken
      ├─ 无 → 跳转登录页
      └─ 有 → 用 refreshToken 换新 token
            ├─ 成功 → 继续初始化
            └─ 失败 → 跳转登录页

2. 登录成功后
   ├─ 保存 accessToken、refreshToken
   ├─ 保存 permissions 到全局 store
   ├─ 检查 forcePasswordChange
   │   └─ true → 强制跳转修改密码页
   └─ 并行预加载：
       ├─ GET /api/v1/dictionaries?include=items  （字典缓存）
       ├─ GET /api/v1/ethnicities                 （民族列表缓存，供选择器与 id→name 映射）
       └─ GET /api/v1/organizations?tree=true     （组织树缓存）
```

### 13.2 员工列表页交互

```
页面挂载
└─ GET /api/v1/employees?page=1&size=20

用户搜索
└─ GET /api/v1/employees?page=1&keyword={keyword}

状态筛选
└─ GET /api/v1/employees?page=1&statuses={dictItemId}
   注：dictItemId 来自字典缓存中 "员工状态" 分类的 items

学历 + 籍贯筛选
└─ GET /api/v1/employees?page=1&educations={dictItemId}&nativePlaces={regionCode}

多字段排序
└─ GET /api/v1/employees?page=1&sort=hireDate:desc,name:asc

保存列布局偏好
└─ PUT /api/v1/employees/preferences/list-layout

分页
└─ GET /api/v1/employees?page={n}&size={size}
```

### 13.3 新建员工表单加载顺序

```
1. 从字典缓存取 "用工形式" 选项 → employmentType 下拉框
2. 从字典缓存取 "员工状态" 选项 → status 下拉框（可选）
3. 从民族缓存取民族列表 → ethnicity 选择器（本地模糊搜索，不发新请求）
4. GET /api/v1/organizations?tree=true → 部门选择 TreeSelect
5. 用户选择部门后：
   GET /api/v1/positions?orgUnitId={selectedOrgUnitId} → 职位下拉框
```

### 13.4 组织树页面交互

```
初始加载
└─ GET /api/v1/organizations?tree=true

点击节点
└─ GET /api/v1/organizations/{id}/path  →  更新面包屑

展开某节点的子部门
└─ GET /api/v1/organizations/{id}/subtree

拖拽移动节点
└─ POST /api/v1/organizations/{id}/actions/move  body: { parentId: "uuid" }

创建子节点（先选中父节点）
└─ POST /api/v1/organizations  body: { name, type, parentId: "selectedId" }
```

### 13.5 Token 自动续期拦截器

```typescript
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

function processQueue(error: Error | null, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token);
  });
  failedQueue = [];
}

axios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axios(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post("/api/v1/auth/refresh", {
        refreshToken: localStorage.getItem("refreshToken"),
      });
      const newToken = data.data.accessToken;
      localStorage.setItem("accessToken", newToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axios(originalRequest);
    } catch (err) {
      processQueue(err as Error, null);
      // 刷新失败，跳转登录
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);
```

### 13.6 字典数据本地缓存策略

```typescript
// stores/dictionary.ts
const useDictionaryStore = defineStore("dictionary", () => {
  // key: 分类名（如 "员工状态"），value: 字典项数组
  const categoriesMap = ref<Record<string, DictionaryItemDTO[]>>({});

  async function loadAll() {
    const res = await api.get<DictionaryCategoryDetailDTO[]>("/api/v1/dictionaries?include=items");
    res.data.forEach((cat) => {
      categoriesMap.value[cat.name] = cat.items.filter((i) => i.isEnabled);
    });
  }

  // 获取下拉选项
  function getItems(categoryName: string): DictionaryItemDTO[] {
    return categoriesMap.value[categoryName] ?? [];
  }

  // 根据 ID 获取 label（用于列表展示）
  function getLabelById(id: string): string {
    for (const items of Object.values(categoriesMap.value)) {
      const found = items.find((i) => i.id === id);
      if (found) return found.label;
    }
    return id; // fallback
  }

  // 获取默认值
  function getDefaultItem(categoryName: string): DictionaryItemDTO | undefined {
    return getItems(categoryName).find((i) => i.isDefault);
  }

  return { loadAll, getItems, getLabelById, getDefaultItem };
});
```

---

## 接口快速索引

| 模块     | 方法   | 路径                                        | 权限                  |
| -------- | ------ | ------------------------------------------- | --------------------- |
| 认证     | POST   | `/api/v1/auth/login`                        | 无                    |
| 认证     | POST   | `/api/v1/auth/refresh`                      | 无                    |
| 认证     | POST   | `/api/v1/auth/logout`                       | 登录                  |
| 认证     | PUT    | `/api/v1/auth/password`                     | 登录                  |
| 用户     | GET    | `/api/v1/users`                             | `user:view`           |
| 用户     | POST   | `/api/v1/users`                             | `user:create`         |
| 用户     | POST   | `/api/v1/users/{id}/reset-password`         | `user:reset-password` |
| 用户     | PATCH  | `/api/v1/users/{id}/username`               | `user:update`         |
| 用户     | PATCH  | `/api/v1/users/{id}/status`                 | `user:update`         |
| 用户     | DELETE | `/api/v1/users/{id}`                        | `user:delete`         |
| 用户角色 | GET    | `/api/v1/users/{userId}/roles`              | `user:view`           |
| 用户角色 | PATCH  | `/api/v1/users/{userId}/roles`              | `user:update`         |
| 角色     | GET    | `/api/v1/roles`                             | `role:view`           |
| 角色     | GET    | `/api/v1/roles/{id}`                        | `role:view`           |
| 角色     | POST   | `/api/v1/roles`                             | `role:create`         |
| 角色     | PATCH  | `/api/v1/roles/{id}`                        | `role:update`         |
| 角色     | DELETE | `/api/v1/roles/{id}`                        | `role:delete`         |
| 权限     | GET    | `/api/v1/permissions`                       | `permission:view`     |
| 员工     | GET    | `/api/v1/employees`                         | `employee:view`       |
| 员工     | GET    | `/api/v1/employees/{id}`                    | `employee:view`       |
| 员工     | POST   | `/api/v1/employees`                         | `employee:create`     |
| 员工     | PUT    | `/api/v1/employees/{id}`                    | `employee:update`     |
| 员工     | DELETE | `/api/v1/employees/{id}`                    | `employee:delete`     |
| 员工偏好 | GET    | `/api/v1/employees/preferences/list-layout` | 登录                  |
| 员工偏好 | PUT    | `/api/v1/employees/preferences/list-layout` | 登录                  |
| 员工偏好 | DELETE | `/api/v1/employees/preferences/list-layout` | 登录                  |
| 行政区划 | GET    | `/api/v1/regions`                           | 登录                  |
| 行政区划 | GET    | `/api/v1/regions/{code}`                    | 登录                  |
| 民族     | GET    | `/api/v1/ethnicities`                       | 登录                  |
| 民族     | GET    | `/api/v1/ethnicities/{id}`                  | 登录                  |
| 组织     | GET    | `/api/v1/organizations`                     | `org:view`            |
| 组织     | GET    | `/api/v1/organizations/{id}`                | `org:view`            |
| 组织     | GET    | `/api/v1/organizations/{id}/subtree`        | `org:view`            |
| 组织     | GET    | `/api/v1/organizations/{id}/path`           | `org:view`            |
| 组织     | POST   | `/api/v1/organizations`                     | `org:create`          |
| 组织     | PATCH  | `/api/v1/organizations/{id}`                | `org:update`          |
| 组织     | POST   | `/api/v1/organizations/{id}/actions/move`   | `org:update`          |
| 组织     | DELETE | `/api/v1/organizations/{id}`                | `org:delete`          |
| 职位     | GET    | `/api/v1/positions`                         | `position:view`       |
| 职位     | GET    | `/api/v1/positions/{id}`                    | `position:view`       |
| 职位     | POST   | `/api/v1/positions`                         | `position:create`     |
| 职位     | PUT    | `/api/v1/positions/{id}`                    | `position:update`     |
| 职位     | DELETE | `/api/v1/positions/{id}`                    | `position:delete`     |
| 字典     | GET    | `/api/v1/dictionaries`                      | 登录                  |
| 字典     | GET    | `/api/v1/dictionaries/{id}`                 | 登录                  |
| 字典     | POST   | `/api/v1/dictionaries`                      | `dictionary:manage`   |
| 字典     | PUT    | `/api/v1/dictionaries/{id}`                 | `dictionary:manage`   |
| 字典     | DELETE | `/api/v1/dictionaries/{id}`                 | `dictionary:manage`   |
| 字典项   | POST   | `/api/v1/dictionaries/{id}/items`           | `dictionary:manage`   |
| 字典项   | PUT    | `/api/v1/dictionaries/{id}/items/{itemId}`  | `dictionary:manage`   |
| 字典项   | DELETE | `/api/v1/dictionaries/{id}/items/{itemId}`  | `dictionary:manage`   |

---

## 14. 本轮后端改动全量对照（给前端）

本节用于前端联调迁移，按“修改前 -> 修改后 -> 前端动作/作用”说明。

### 14.1 API 版本前缀统一

- 修改前：接口路径为 `/api/...`
- 修改后：统一为 `/api/v1/...`
- 前端动作：统一替换请求前缀、路由白名单和拦截器中的路径匹配规则。
- 作用：明确版本边界，后续升级可控。

### 14.2 RBAC 接口方法语义统一

1. 分配用户角色

- 修改前：`PUT /api/v1/users/{userId}/roles`
- 修改后：`PATCH /api/v1/users/{userId}/roles`
- 前端动作：请求方法改为 PATCH。

2. 更新角色

- 修改前：`PUT /api/v1/roles/{id}`
- 修改后：`PATCH /api/v1/roles/{id}`
- 前端动作：请求方法改为 PATCH。

### 14.3 登录安全策略（暴力破解防护）

- 修改前：仅处理用户名/密码错误、账号禁用等常规错误。
- 修改后：新增临时锁定机制（连续失败达到阈值后锁定一段时间），错误码 `AUTH_403_ACCOUNT_LOCKED`。
- 前端动作：
  - 对 `AUTH_403_ACCOUNT_LOCKED` 增加专门提示。
  - 在登录页禁止短时间内重复提交，建议展示倒计时或引导稍后重试。
- 作用：减少暴力破解风险。

### 14.4 重置密码响应结构变更

- 修改前：返回 `temporaryPassword`（临时密码明文）。
- 修改后：返回 `success` + `message`，不再返回临时密码明文。
- 前端动作：
  - 删除所有对 `temporaryPassword` 字段的依赖与展示。
  - 改为 toast/弹窗显示 message，引导“联系管理员通过安全渠道获取新密码”。
- 作用：避免敏感信息通过 API 泄露。

### 14.5 新增行政区划 Region 模块

- 修改前：缺少统一行政区划接口，籍贯相关常靠本地静态数据。
- 修改后：新增
  - `GET /api/v1/regions`
  - `GET /api/v1/regions/{code}`
- 前端动作：
  - 省/市/区级联选择改用后端接口。
  - 建议缓存 code->name 映射，列表展示与筛选共用。
- 作用：区域数据统一来源，避免前后端字典不一致。

### 14.6 新增员工列表偏好接口

- 修改前：列表列配置/布局多为前端本地存储或无持久化。
- 修改后：新增
  - `GET /api/v1/employees/preferences/list-layout`
  - `PUT /api/v1/employees/preferences/list-layout`
  - `DELETE /api/v1/employees/preferences/list-layout`
- 前端动作：
  - 页面初始化时拉取布局偏好。
  - 用户调整列配置后写回后端。
  - 支持“恢复默认布局”。
- 作用：多端/多次登录保持一致的个性化列表体验。

### 14.7 员工列表查询能力增强

- 修改前：筛选维度较少，区域相关筛选能力弱。
- 修改后：新增/强化筛选语义（如 `nativePlaces`，并支持结合区域接口做筛选）；列表查询性能也做了后端优化。
- 前端动作：
  - 在高级筛选中加入籍贯维度（可多选 code）。
  - 查询参数拼接与本节示例保持一致。
- 作用：检索精度更高，列表交互更顺畅。

### 14.8 民族独立表改造（Breaking Change for Ethnicity）

- 修改前：员工 `ethnicity` 字段存储民族字典项 UUID（来自字典表 `ETHNICITY` 分类）。
- 修改后：
  - 民族数据迁移到独立 `ethnicities` 表，包含 56 个国标民族 + 外国人/未识别民族 2 个系统保留项
  - 员工 `ethnicity` 字段改为引用 `ethnicities.id`（UUID，语义不变，但来源变更）
  - 新增接口：`GET /api/v1/ethnicities` 和 `GET /api/v1/ethnicities/{id}`
  - 历史数据已自动迁移
- 前端动作：
  1. **迁移数据来源**：民族选择器不再从 `/api/v1/dictionaries` 的 ETHNICITY 分类获取数据，改为从 `/api/v1/ethnicities` 获取
  2. **本地搜索**：民族搜索完全在本地完成，可按 `name`、`romanizedName`、`alphaCode`、`numericCode` 模糊匹配
  3. **缓存策略**：应用初始化时一次性缓存民族列表，用于 `id → name` 展示映射
  4. **字段值保持兼容**：`ethnicity` 字段仍然是 UUID 字符串，结构无变化
- 作用：民族数据与字典分离，遵循国标（GB/T 3304）编码，数据更标准。

### 14.9 跨域配置（CORS）补齐

- 修改前：跨域联调存在环境差异风险。
- 修改后：后端已启用并规范化 CORS 配置。
- 前端动作：通常无需改接口；若已有本地代理，按实际环境选择“直连后端”或“继续走代理”。
- 作用：降低本地/测试环境联调阻塞。

### 14.10 内部实现优化（前端通常无感）

- 用户与员工查询链路的 N+1 优化
- 若干服务事务边界与原子性增强
- 日期校验与错误处理细化
- 数据库索引补充
- 附件相关 UUID 存储一致性处理

前端动作：

- 一般无需改代码。
- 只需继续按文档中的字段和错误码处理。

### 14.11 前端一次性迁移清单

1. 全局请求前缀确认使用 `/api/v1`。
2. 将用户角色分配、角色更新请求方法切换为 PATCH。
3. 登录错误处理补充 `AUTH_403_ACCOUNT_LOCKED`。
4. 重置密码流程移除 `temporaryPassword` 读取逻辑。
5. 接入 Region 接口并用于籍贯选择与展示映射。
6. 接入员工列表偏好三接口并替换仅本地存储方案。
7. 员工筛选增加 `nativePlaces` 等参数并与后端对齐。
8. **民族字段迁移**：民族选择器数据来源从 `/api/v1/dictionaries` 的 ETHNICITY 分类切换为 `/api/v1/ethnicities`；应用初始化时预加载民族列表并缓存；创建/更新员工时 `ethnicity` 字段传 `ethnicities.id`；错误码 `EMPLOYEE_422_ETHNICITY_INVALID` 增加专门提示。
9. **地址字段拆分（Breaking Change）**：`address` 字段已拆分为 `workAddress`（工作地址）和 `contactAddress`（联系地址）。所有员工表单、请求体、响应展示及 TypeScript 类型定义中均需将 `address` 替换为这两个字段。

### 14.12 地址字段拆分（workAddress + contactAddress）

**变更原因**：原 `address` 字段语义不明确，无法区分工作地址与联系/家庭地址。

| 旧字段    | 新字段           | 说明                          |
| --------- | ---------------- | ----------------------------- |
| `address` | `workAddress`    | 工作/办公地址（原字段改名）   |
| —         | `contactAddress` | 联系地址/家庭住址（新增字段） |

**影响范围**：

- **GET /api/v1/employees**：查询参数 `address` → 改为 `workAddress` 和 `contactAddress` 两个独立过滤参数；`keyword` 全局搜索同时覆盖这两个字段。
- **GET /api/v1/employees/{id}**：响应体 `data.address` → `data.workAddress` / `data.contactAddress`。
- **POST/PUT /api/v1/employees**：请求体及 multipart 表单字段 `address` → `workAddress` / `contactAddress`。
- **TypeScript 类型**：`EmployeeDTO.address` → `workAddress: string | null` + `contactAddress: string | null`。

**迁移步骤**：

1. 全局替换 `address` → `workAddress`（已有地址数据迁移到工作地址）。
2. 在需要的地方新增 `contactAddress` 字段（可为 `null`）。
3. 更新员工筛选表单，将地址过滤拆为两个独立输入框。
