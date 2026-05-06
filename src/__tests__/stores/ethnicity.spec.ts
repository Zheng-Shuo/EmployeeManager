import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import type { EthnicityDTO } from "@/api/types";
import { useEthnicityStore } from "@/stores/ethnicity";

const getEthnicitiesMock = vi.fn();

vi.mock("@/api/ethnicities", (): { getEthnicities: (...args: unknown[]) => unknown } => ({
  getEthnicities: (...args: unknown[]) => getEthnicitiesMock(...args),
}));

describe("ethnicity store", () => {
  beforeEach((): void => {
    setActivePinia(createPinia());
    getEthnicitiesMock.mockReset();
  });

  it("loads ethnicity list and marks store as loaded", async (): Promise<void> => {
    getEthnicitiesMock.mockResolvedValue({
      data: [
        {
          id: "eth-han",
          name: "汉族",
          romanizedName: "Han",
          alphaCode: "HA",
          numericCode: "001",
          isSystem: false,
          isEnabled: true,
          sortOrder: 1,
        },
      ],
    });

    const store = useEthnicityStore();
    await store.loadAll();

    expect(store.loaded).toBe(true);
    expect(store.items).toHaveLength(1);
    expect(store.getNameById("eth-han")).toBe("汉族");
  });

  it("searches enabled ethnicities across name and code fields", (): void => {
    const store = useEthnicityStore();
    store.items = [
      {
        id: "eth-han",
        name: "汉族",
        romanizedName: "Han",
        alphaCode: "HA",
        numericCode: "001",
        isSystem: false,
        isEnabled: true,
        sortOrder: 1,
      },
      {
        id: "eth-mongol",
        name: "蒙古族",
        romanizedName: "Mongol",
        alphaCode: "MG",
        numericCode: "005",
        isSystem: false,
        isEnabled: true,
        sortOrder: 2,
      },
      {
        id: "eth-disabled",
        name: "测试禁用",
        romanizedName: "Disabled",
        alphaCode: "ZZ",
        numericCode: "999",
        isSystem: true,
        isEnabled: false,
        sortOrder: 3,
      },
    ];

    expect(store.searchEnabledItems("han").map((item: EthnicityDTO) => item.id)).toEqual([
      "eth-han",
    ]);
    expect(store.searchEnabledItems("005").map((item: EthnicityDTO) => item.id)).toEqual([
      "eth-mongol",
    ]);
    expect(store.searchEnabledItems("zz")).toHaveLength(0);
  });
});
