import type { Ref } from "vue";
import { ref } from "vue";

export type EmployeeListColumnKey =
  | "employeeNo"
  | "name"
  | "gender"
  | "age"
  | "idCardNo"
  | "contact"
  | "employmentType"
  | "hireDate"
  | "status"
  | "updatedAt";

export interface EmployeeListColumnConfigItem {
  key: EmployeeListColumnKey;
  label: string;
  visible: boolean;
  order: number;
}

interface EmployeeListColumnDefinition {
  key: EmployeeListColumnKey;
  label: string;
  visible: boolean;
}

const STORAGE_KEY = "employee-list-columns-config-v1";

const COLUMN_DEFINITIONS: EmployeeListColumnDefinition[] = [
  { key: "employeeNo", label: "工号", visible: true },
  { key: "name", label: "姓名", visible: true },
  { key: "gender", label: "性别", visible: true },
  { key: "age", label: "年龄", visible: true },
  { key: "idCardNo", label: "身份证号", visible: true },
  { key: "contact", label: "联系方式", visible: true },
  { key: "employmentType", label: "用工形式", visible: true },
  { key: "hireDate", label: "入职日期", visible: true },
  { key: "status", label: "状态", visible: true },
  { key: "updatedAt", label: "最后更新", visible: true },
];

function toDefaultConfig(): EmployeeListColumnConfigItem[] {
  return COLUMN_DEFINITIONS.map(
    (column: EmployeeListColumnDefinition, index: number): EmployeeListColumnConfigItem => ({
      key: column.key,
      label: column.label,
      visible: column.visible,
      order: index,
    }),
  );
}

function isColumnKey(value: string): value is EmployeeListColumnKey {
  return COLUMN_DEFINITIONS.some((column: EmployeeListColumnDefinition) => column.key === value);
}

function normalizeConfig(value: unknown): EmployeeListColumnConfigItem[] {
  if (!Array.isArray(value)) {
    return toDefaultConfig();
  }

  const rawItems = value as Array<
    Partial<EmployeeListColumnConfigItem> & {
      key?: string;
    }
  >;

  const merged = COLUMN_DEFINITIONS.map(
    (column: EmployeeListColumnDefinition, index: number): EmployeeListColumnConfigItem => {
      const matched = rawItems.find(
        (item: Partial<EmployeeListColumnConfigItem> & { key?: string }) => item.key === column.key,
      );
      return {
        key: column.key,
        label: column.label,
        visible: matched?.visible ?? column.visible,
        order:
          typeof matched?.order === "number" && Number.isFinite(matched.order)
            ? matched.order
            : index,
      };
    },
  );

  return merged
    .sort((a: EmployeeListColumnConfigItem, b: EmployeeListColumnConfigItem) => a.order - b.order)
    .map((item: EmployeeListColumnConfigItem, index: number) => ({
      ...item,
      order: index,
    }));
}

export function loadEmployeeListColumnsConfig(): EmployeeListColumnConfigItem[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return toDefaultConfig();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return normalizeConfig(parsed);
  } catch {
    return toDefaultConfig();
  }
}

export function saveEmployeeListColumnsConfig(items: EmployeeListColumnConfigItem[]): void {
  const normalized = normalizeConfig(items);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

export function resetEmployeeListColumnsConfig(): EmployeeListColumnConfigItem[] {
  const defaults = toDefaultConfig();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
}

export function useEmployeeListColumnsConfig(): {
  columns: Ref<EmployeeListColumnConfigItem[]>;
  moveColumnUp: (key: EmployeeListColumnKey) => void;
  moveColumnDown: (key: EmployeeListColumnKey) => void;
  setColumnVisible: (key: EmployeeListColumnKey, visible: boolean) => void;
  save: () => void;
  reset: () => void;
} {
  const columns = ref<EmployeeListColumnConfigItem[]>(loadEmployeeListColumnsConfig());

  function reorder(columnsList: EmployeeListColumnConfigItem[]): EmployeeListColumnConfigItem[] {
    return columnsList.map((item: EmployeeListColumnConfigItem, index: number) => ({
      ...item,
      order: index,
    }));
  }

  function moveColumnUp(key: EmployeeListColumnKey): void {
    const index = columns.value.findIndex((item: EmployeeListColumnConfigItem) => item.key === key);
    if (index <= 0) {
      return;
    }
    const next = [...columns.value];
    const temp = next[index - 1];
    next[index - 1] = next[index] as EmployeeListColumnConfigItem;
    next[index] = temp as EmployeeListColumnConfigItem;
    columns.value = reorder(next);
  }

  function moveColumnDown(key: EmployeeListColumnKey): void {
    const index = columns.value.findIndex((item: EmployeeListColumnConfigItem) => item.key === key);
    if (index < 0 || index >= columns.value.length - 1) {
      return;
    }
    const next = [...columns.value];
    const temp = next[index + 1];
    next[index + 1] = next[index] as EmployeeListColumnConfigItem;
    next[index] = temp as EmployeeListColumnConfigItem;
    columns.value = reorder(next);
  }

  function setColumnVisible(key: EmployeeListColumnKey, visible: boolean): void {
    columns.value = columns.value.map((item: EmployeeListColumnConfigItem) =>
      item.key === key ? { ...item, visible } : item,
    );
  }

  function save(): void {
    saveEmployeeListColumnsConfig(columns.value);
  }

  function reset(): void {
    columns.value = resetEmployeeListColumnsConfig();
  }

  return {
    columns,
    moveColumnUp,
    moveColumnDown,
    setColumnVisible,
    save,
    reset,
  };
}

export function getEmployeeListColumnLabel(key: EmployeeListColumnKey): string {
  const found = COLUMN_DEFINITIONS.find(
    (column: EmployeeListColumnDefinition) => column.key === key,
  );
  return found?.label ?? key;
}

export function isEmployeeListColumnConfig(
  value: unknown,
): value is EmployeeListColumnConfigItem[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((item: unknown) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const row = item as Partial<EmployeeListColumnConfigItem> & { key?: string };
    return (
      typeof row.key === "string" &&
      isColumnKey(row.key) &&
      typeof row.visible === "boolean" &&
      typeof row.order === "number"
    );
  });
}
