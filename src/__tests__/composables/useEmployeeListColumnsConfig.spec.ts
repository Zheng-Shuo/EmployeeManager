import { beforeEach, describe, expect, it } from "vitest";

import {
  loadEmployeeListColumnsConfig,
  resetEmployeeListColumnsConfig,
  saveEmployeeListColumnsConfig,
  useEmployeeListColumnsConfig,
} from "@/composables/useEmployeeListColumnsConfig";
import type { EmployeeListColumnConfigItem } from "@/composables/useEmployeeListColumnsConfig";

const STORAGE_KEY = "employee-list-columns-config-v1";

describe("useEmployeeListColumnsConfig", () => {
  beforeEach((): void => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it("loads default config when storage is empty", (): void => {
    const config = loadEmployeeListColumnsConfig();

    expect(config).toHaveLength(10);
    expect(config[0]?.key).toBe("employeeNo");
    expect(config.every((item: EmployeeListColumnConfigItem) => item.visible)).toBe(true);
  });

  it("persists visibility and order changes", (): void => {
    const config = loadEmployeeListColumnsConfig();
    const next = [...config];

    const first = next[0];
    next[0] = next[1]!;
    next[1] = first!;
    next[3] = {
      ...next[3]!,
      visible: false,
    };

    saveEmployeeListColumnsConfig(
      next.map((item: EmployeeListColumnConfigItem, index: number) => ({
        ...item,
        order: index,
      })),
    );

    const loaded = loadEmployeeListColumnsConfig();
    expect(loaded[0]?.key).toBe(next[0]?.key);
    expect(loaded[3]?.visible).toBe(false);
  });

  it("moves columns and resets defaults", (): void => {
    const manager = useEmployeeListColumnsConfig();

    manager.moveColumnDown("employeeNo");
    expect(manager.columns.value[0]?.key).toBe("name");

    manager.moveColumnUp("employeeNo");
    expect(manager.columns.value[0]?.key).toBe("employeeNo");

    manager.setColumnVisible("idCardNo", false);
    manager.save();
    expect(
      loadEmployeeListColumnsConfig().find(
        (item: EmployeeListColumnConfigItem) => item.key === "idCardNo",
      )?.visible,
    ).toBe(false);

    manager.reset();
    expect(
      resetEmployeeListColumnsConfig().find(
        (item: EmployeeListColumnConfigItem) => item.key === "idCardNo",
      )?.visible,
    ).toBe(true);
  });
});
