import { defineStore } from "pinia";

import { getDictionariesWithItems } from "@/api/dictionaries";
import type {
  ApiResponseDictionaryCategoryDetailDTOList,
  DictionaryCategoryDetailDTO,
  DictionaryItemDTO,
} from "@/api/types";

interface DictionaryState {
  categories: DictionaryCategoryDetailDTO[];
  loaded: boolean;
}

export const useDictionaryStore = defineStore("dictionary", {
  state: (): DictionaryState => ({
    categories: [],
    loaded: false,
  }),
  getters: {
    getItemsByName:
      (state: DictionaryState) =>
      (categoryName: string): DictionaryItemDTO[] => {
        const category = state.categories.find(
          (c: DictionaryCategoryDetailDTO) => c.name === categoryName,
        );
        if (!category) {
          return [];
        }
        return category.items
          .filter((item: DictionaryItemDTO) => item.isEnabled)
          .sort((a: DictionaryItemDTO, b: DictionaryItemDTO) => a.sortOrder - b.sortOrder);
      },
    getLabelById:
      (state: DictionaryState) =>
      (categoryName: string, itemId: string): string => {
        const category = state.categories.find(
          (c: DictionaryCategoryDetailDTO) => c.name === categoryName,
        );
        if (!category) {
          return itemId;
        }
        const item = category.items.find((i: DictionaryItemDTO) => i.id === itemId);
        return item ? item.label : itemId;
      },
    getColorById:
      (state: DictionaryState) =>
      (categoryName: string, itemId: string): string | null => {
        const category = state.categories.find(
          (c: DictionaryCategoryDetailDTO) => c.name === categoryName,
        );
        if (!category) {
          return null;
        }
        const item = category.items.find((i: DictionaryItemDTO) => i.id === itemId);
        return item?.color ?? null;
      },
    getDefaultItemId:
      (state: DictionaryState) =>
      (categoryName: string): string | null => {
        const category = state.categories.find(
          (c: DictionaryCategoryDetailDTO) => c.name === categoryName,
        );
        if (!category) {
          return null;
        }
        const defaultItem = category.items.find(
          (i: DictionaryItemDTO) => i.isDefault && i.isEnabled,
        );
        return defaultItem?.id ?? null;
      },
  },
  actions: {
    async loadAll(): Promise<void> {
      try {
        const response: ApiResponseDictionaryCategoryDetailDTOList =
          await getDictionariesWithItems();
        this.categories = response.data;
        this.loaded = true;
      } catch {
        // Silently fail — dictionaries are non-critical for app boot.
      }
    },
    async reload(): Promise<void> {
      await this.loadAll();
    },
  },
});
