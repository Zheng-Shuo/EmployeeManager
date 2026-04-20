import { defineStore } from "pinia";

import { getDictionaries, getDictionaryById } from "@/api/dictionaries";
import type {
  ApiResponseDictionaryCategoryDetailDTO,
  ApiResponseDictionaryCategoryList,
  DictionaryCategoryDTO,
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
    getItemsByCode:
      (state: DictionaryState) =>
      (categoryCode: string): DictionaryItemDTO[] => {
        const category = state.categories.find(
          (c: DictionaryCategoryDetailDTO) => c.code === categoryCode,
        );
        if (!category) {
          return [];
        }
        return category.items.filter((item: DictionaryItemDTO) => item.isEnabled);
      },
    getLabelByCode:
      (state: DictionaryState) =>
      (categoryCode: string, itemCode: string): string => {
        const category = state.categories.find(
          (c: DictionaryCategoryDetailDTO) => c.code === categoryCode,
        );
        if (!category) {
          return itemCode;
        }
        const item = category.items.find((i: DictionaryItemDTO) => i.code === itemCode);
        return item ? item.label : itemCode;
      },
    getColorByCode:
      (state: DictionaryState) =>
      (categoryCode: string, itemCode: string): string | null => {
        const category = state.categories.find(
          (c: DictionaryCategoryDetailDTO) => c.code === categoryCode,
        );
        if (!category) {
          return null;
        }
        const item = category.items.find((i: DictionaryItemDTO) => i.code === itemCode);
        return item?.color ?? null;
      },
    getLabelById:
      (state: DictionaryState) =>
      (categoryCode: string, itemId: string): string => {
        const category = state.categories.find(
          (c: DictionaryCategoryDetailDTO) => c.code === categoryCode,
        );
        if (!category) {
          return itemId;
        }
        const item = category.items.find((i: DictionaryItemDTO) => i.id === itemId);
        return item ? item.label : itemId;
      },
    getColorById:
      (state: DictionaryState) =>
      (categoryCode: string, itemId: string): string | null => {
        const category = state.categories.find(
          (c: DictionaryCategoryDetailDTO) => c.code === categoryCode,
        );
        if (!category) {
          return null;
        }
        const item = category.items.find((i: DictionaryItemDTO) => i.id === itemId);
        return item?.color ?? null;
      },
    getDefaultItemId:
      (state: DictionaryState) =>
      (categoryCode: string): string | null => {
        const category = state.categories.find(
          (c: DictionaryCategoryDetailDTO) => c.code === categoryCode,
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
        const listResponse: ApiResponseDictionaryCategoryList = await getDictionaries();
        const details: ApiResponseDictionaryCategoryDetailDTO[] = await Promise.all(
          listResponse.data.map((category: DictionaryCategoryDTO) =>
            getDictionaryById(category.id),
          ),
        );
        this.categories = details.map(
          (response: ApiResponseDictionaryCategoryDetailDTO) => response.data,
        );
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
