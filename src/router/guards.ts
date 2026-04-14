import type { Router } from "vue-router";
import type { RouteLocationNormalized } from "vue-router";

import { useAuthStore } from "@/stores/auth";

interface RouteMetaShape {
  requiresAuth?: boolean;
  permissions?: string[];
}

export function setupGuards(router: Router): void {
  router.beforeEach(async (to: RouteLocationNormalized) => {
    const authStore = useAuthStore();
    const meta = to.meta as RouteMetaShape;
    const requiresAuth = meta.requiresAuth ?? true;

    if (!requiresAuth) {
      if (to.path === "/login" && authStore.isAuthenticated) {
        return "/";
      }
      return true;
    }

    if (!authStore.isAuthenticated) {
      return {
        path: "/login",
        query: {
          redirect: to.fullPath,
        },
      };
    }

    const requiredPermissions = meta.permissions ?? [];
    if (requiredPermissions.length > 0 && !authStore.hasAnyPermission(requiredPermissions)) {
      return "/403";
    }

    return true;
  });
}
