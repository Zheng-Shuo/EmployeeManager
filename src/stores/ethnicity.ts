import { defineStore } from "pinia";

import { getEthnicities } from "@/api/ethnicities";
import type { ApiResponseEthnicityDTOList, EthnicityDTO } from "@/api/types";

interface EthnicityState {
  items: EthnicityDTO[];
  loaded: boolean;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export const useEthnicityStore = defineStore("ethnicity", {
  state: (): EthnicityState => ({
    items: [],
    loaded: false,
  }),
  getters: {
    getEnabledItems: (state: EthnicityState): EthnicityDTO[] =>
      [...state.items]
        .filter((item: EthnicityDTO) => item.isEnabled)
        .sort((a: EthnicityDTO, b: EthnicityDTO) => a.sortOrder - b.sortOrder),
    getNameById:
      (state: EthnicityState) =>
      (id: string): string => {
        if (!id) {
          return "--";
        }
        const found = state.items.find((item: EthnicityDTO) => item.id === id);
        return found?.name ?? id;
      },
    searchEnabledItems:
      (state: EthnicityState) =>
      (keyword: string): EthnicityDTO[] => {
        const normalized = normalize(keyword);
        const enabledItems = state.items
          .filter((item: EthnicityDTO) => item.isEnabled)
          .sort((a: EthnicityDTO, b: EthnicityDTO) => a.sortOrder - b.sortOrder);

        if (!normalized) {
          return enabledItems;
        }

        return enabledItems.filter((item: EthnicityDTO) => {
          const fields = [item.name, item.romanizedName, item.alphaCode, item.numericCode];
          return fields.some((value: string) => normalize(value).includes(normalized));
        });
      },
  },
  actions: {
    async loadAll(): Promise<void> {
      try {
        const response: ApiResponseEthnicityDTOList = await getEthnicities();
        this.items = response.data;
        this.loaded = true;
      } catch {
        // Silently fail — ethnicity data is non-critical for app boot.
      }
    },
    async reload(): Promise<void> {
      await this.loadAll();
    },
  },
});
