import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "@/layouts/MainLayout.vue";
import { setupGuards } from "@/router/guards";
import DashboardView from "@/views/DashboardView.vue";
import EmployeeDetailView from "@/views/EmployeeDetailView.vue";
import EmployeesView from "@/views/EmployeesView.vue";
import ForbiddenView from "@/views/ForbiddenView.vue";
import LoginView from "@/views/LoginView.vue";
import OrganizationsView from "@/views/OrganizationsView.vue";
import ProfileView from "@/views/ProfileView.vue";
import RolesView from "@/views/RolesView.vue";
import UsersView from "@/views/UsersView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: "/403",
      name: "forbidden",
      component: ForbiddenView,
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: "/",
      component: MainLayout,
      meta: {
        requiresAuth: true,
      },
      children: [
        {
          path: "",
          name: "dashboard",
          component: DashboardView,
          meta: {
            title: "概览",
          },
        },
        {
          path: "employees",
          name: "employees",
          component: EmployeesView,
          meta: {
            title: "员工列表",
            permissions: ["employee:view"],
          },
        },
        {
          path: "employees/:id",
          name: "employee-detail",
          component: EmployeeDetailView,
          meta: {
            title: "员工详情",
            breadcrumbs: [{ label: "员工列表", path: "/employees" }, { label: "员工详情" }],
            permissions: ["employee:view"],
          },
        },
        {
          path: "organizations",
          name: "organizations",
          component: OrganizationsView,
          meta: {
            title: "组织架构",
            permissions: ["org:view"],
          },
        },
        {
          path: "users",
          name: "users",
          component: UsersView,
          meta: {
            title: "账户管理",
            permissions: ["user:view"],
          },
        },
        {
          path: "roles",
          name: "roles",
          component: RolesView,
          meta: {
            title: "角色权限",
            permissions: ["role:view"],
          },
        },
        {
          path: "profile",
          name: "profile",
          component: ProfileView,
          meta: {
            title: "个人信息",
          },
        },
      ],
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/",
    },
  ],
});

setupGuards(router);

export default router;
