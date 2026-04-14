import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { useAuthStore } from "@/stores/auth";
import type { LoginResponse } from "@/api/types";

vi.mock("@/api/auth", () => ({
  logout: vi.fn(),
}));

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

describe("auth store – forcePasswordChange", () => {
  beforeEach((): void => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  describe("setLoginData", () => {
    it("stores forcePasswordChange as true when login payload has it true", (): void => {
      const store = useAuthStore();
      store.setLoginData(makeLoginPayload({ forcePasswordChange: true }));

      expect(store.user?.forcePasswordChange).toBe(true);
    });

    it("persists forcePasswordChange: true to localStorage", (): void => {
      const store = useAuthStore();
      store.setLoginData(makeLoginPayload({ forcePasswordChange: true }));

      const stored = JSON.parse(localStorage.getItem("authUser") ?? "{}") as {
        forcePasswordChange: boolean;
      };
      expect(stored.forcePasswordChange).toBe(true);
    });

    it("stores forcePasswordChange as false when login payload has it false", (): void => {
      const store = useAuthStore();
      store.setLoginData(makeLoginPayload({ forcePasswordChange: false }));

      expect(store.user?.forcePasswordChange).toBe(false);
    });
  });

  describe("clearForcePasswordChange", () => {
    it("sets forcePasswordChange to false in store state", (): void => {
      const store = useAuthStore();
      store.setLoginData(makeLoginPayload({ forcePasswordChange: true }));

      store.clearForcePasswordChange();

      expect(store.user?.forcePasswordChange).toBe(false);
    });

    it("persists forcePasswordChange: false to localStorage after clearing", (): void => {
      const store = useAuthStore();
      store.setLoginData(makeLoginPayload({ forcePasswordChange: true }));

      store.clearForcePasswordChange();

      const stored = JSON.parse(localStorage.getItem("authUser") ?? "{}") as {
        forcePasswordChange: boolean;
      };
      expect(stored.forcePasswordChange).toBe(false);
    });

    it("preserves other user fields when clearing forcePasswordChange", (): void => {
      const store = useAuthStore();
      store.setLoginData(
        makeLoginPayload({
          username: "john",
          roles: ["ADMIN"],
          forcePasswordChange: true,
        }),
      );

      store.clearForcePasswordChange();

      expect(store.user?.username).toBe("john");
      expect(store.user?.roles).toEqual(["ADMIN"]);
    });

    it("does not throw when user is null", (): void => {
      const store = useAuthStore();
      expect((): void => store.clearForcePasswordChange()).not.toThrow();
    });
  });
});
