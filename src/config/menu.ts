export interface AppMenuItem {
  key: string;
  label: string;
  path: string;
  icon: "house" | "users" | "office" | "account" | "shield";
  permissions?: string[];
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
];
