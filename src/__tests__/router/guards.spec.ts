import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import type { Router } from "vue-router";

import { setupGuards } from "@/router/guards";
import { useAuthStore } from "@/stores/auth";
import type { LoginResponse } from "@/api/types";

vi.mock("@/api/auth", () => ({
  logout: vi.fn(),
}));

const DummyComponent = { template: "<div/>" };

function makeRouter(): Router {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/login",
        name: "login",
        component: DummyComponent,
        meta: { requiresAuth: false },
      },
      {
        path: "/403",
        name: "forbidden",
        component: DummyComponent,
        meta: { requiresAuth: false },
      },
      {
        path: "/",
        name: "dashboard",
        component: DummyComponent,
        meta: { requiresAuth: true },
      },
      {
        path: "/users",
        name: "users",
        component: DummyComponent,
        meta: { requiresAuth: true, permissions: ["user:view"] },
      },
    ],
  });
  setupGuards(router);
  return router;
}

function makeLoginPayload(overrides: Partial<LoginResponse> = {}): LoginResponse {
  return {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    userId: "user-1",
    username: "admin",
    roles: ["ADMIN"],
    permissions: ["user:view"],
    forcePasswordChange: false,
    ...overrides,
  };
}

describe("router guards – forcePasswordChange", () => {
  beforeEach((): void => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("allows navigating to / when forcePasswordChange is true", async (): Promise<void> => {
    const router = makeRouter();
    const authStore = useAuthStore();
    authStore.setLoginData(makeLoginPayload({ forcePasswordChange: true }));

    await router.push("/");

    expect(router.currentRoute.value.path).toBe("/");
  });

  it("allows navigating to /users when forcePasswordChange is true", async (): Promise<void> => {
    const router = makeRouter();
    const authStore = useAuthStore();
    authStore.setLoginData(makeLoginPayload({ forcePasswordChange: true }));

    await router.push("/users");

    expect(router.currentRoute.value.path).toBe("/users");
  });

  it("redirects unauthenticated user to /login", async (): Promise<void> => {
    const router = makeRouter();

    await router.push("/");

    expect(router.currentRoute.value.path).toBe("/login");
  });
});
