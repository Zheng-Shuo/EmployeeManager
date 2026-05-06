export interface AppMenuItem {
  key: string;
  label: string;
  path: string;
  icon: "house" | "users" | "office" | "account" | "shield" | "setting" | "notebook";
  permissions?: string[];
  children?: AppMenuItem[];
}

export const appMenuItems: AppMenuItem[] = [
  {
    key: "dashboard",
    label: "概览",
    path: "/",
    icon: "house",
  },
  {
    key: "employees",
    label: "员工列表",
    path: "/employees",
    icon: "users",
    permissions: ["employee:view"],
  },
  {
    key: "organizations",
    label: "组织架构",
    path: "/organizations",
    icon: "office",
    permissions: ["org:view"],
  },
  {
    key: "system",
    label: "系统管理",
    path: "/system",
    icon: "setting",
    permissions: ["user:view", "role:view", "dictionary:manage"],
    children: [
      {
        key: "users",
        label: "账户管理",
        path: "/users",
        icon: "account",
        permissions: ["user:view"],
      },
      {
        key: "roles",
        label: "角色权限",
        path: "/roles",
        icon: "shield",
        permissions: ["role:view"],
      },
      {
        key: "dictionaries",
        label: "数据字典",
        path: "/dictionaries",
        icon: "notebook",
        permissions: ["dictionary:manage"],
      },
      {
        key: "feature-config",
        label: "功能配置",
        path: "/feature-config",
        icon: "setting",
        permissions: ["user:view", "role:view", "dictionary:manage"],
      },
    ],
  },
];
