import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

// See here how to get started:
// https://playwright.dev/docs/intro
test("visits the app root url", async ({ page }: { page: Page }): Promise<void> => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("Employee Manager");
});
