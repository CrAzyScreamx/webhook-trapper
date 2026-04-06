export type FieldType = 'string' | 'boolean' | 'number' | 'array' | 'object' | 'null' | 'unknown';

function getByPath(obj: unknown, path: string): unknown {
  if (!path) return undefined;
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function detectType(value: unknown): FieldType {
  if (value === null) return 'null';
  if (value === undefined) return 'unknown';
  if (Array.isArray(value)) return 'array';
  return typeof value as FieldType;
}

export function detectFieldType(payload: unknown, fieldPath: string): FieldType {
  if (!fieldPath) return 'unknown';
  const value = getByPath(payload, fieldPath);
  return detectType(value);
}

export const OPERATORS_BY_TYPE: Record<FieldType, { value: string; label: string; needsValue: boolean }[]> = {
  string: [
    { value: 'equals', label: 'equals', needsValue: true },
    { value: 'not_equals', label: 'not equals', needsValue: true },
    { value: 'contains', label: 'contains', needsValue: true },
    { value: 'starts_with', label: 'starts with', needsValue: true },
    { value: 'ends_with', label: 'ends with', needsValue: true },
    { value: 'matches', label: 'matches regex', needsValue: true },
    { value: 'is_empty', label: 'is empty', needsValue: false },
    { value: 'is_not_empty', label: 'is not empty', needsValue: false },
    { value: 'exists', label: 'exists', needsValue: false },
    { value: 'not_exists', label: 'not exists', needsValue: false },
  ],
  boolean: [
    { value: 'is_true', label: 'is true', needsValue: false },
    { value: 'is_false', label: 'is false', needsValue: false },
    { value: 'equals', label: 'equals', needsValue: true },
    { value: 'not_equals', label: 'not equals', needsValue: true },
    { value: 'exists', label: 'exists', needsValue: false },
    { value: 'not_exists', label: 'not exists', needsValue: false },
  ],
  number: [
    { value: 'equals', label: 'equals', needsValue: true },
    { value: 'not_equals', label: 'not equals', needsValue: true },
    { value: 'gt', label: 'greater than', needsValue: true },
    { value: 'lt', label: 'less than', needsValue: true },
    { value: 'gte', label: 'greater or equal', needsValue: true },
    { value: 'lte', label: 'less or equal', needsValue: true },
    { value: 'in', label: 'in list', needsValue: true },
    { value: 'not_in', label: 'not in list', needsValue: true },
    { value: 'is_null', label: 'is null', needsValue: false },
    { value: 'is_not_null', label: 'is not null', needsValue: false },
    { value: 'exists', label: 'exists', needsValue: false },
    { value: 'not_exists', label: 'not exists', needsValue: false },
  ],
  array: [
    { value: 'contains', label: 'contains', needsValue: true },
    { value: 'in', label: 'contains value', needsValue: true },
    { value: 'not_in', label: 'does not contain', needsValue: true },
    { value: 'is_empty', label: 'is empty', needsValue: false },
    { value: 'is_not_empty', label: 'is not empty', needsValue: false },
    { value: 'exists', label: 'exists', needsValue: false },
    { value: 'not_exists', label: 'not exists', needsValue: false },
  ],
  object: [
    { value: 'has_key', label: 'has key', needsValue: true },
    { value: 'has_keys', label: 'has all keys', needsValue: true },
    { value: 'is_null', label: 'is null', needsValue: false },
    { value: 'is_not_null', label: 'is not null', needsValue: false },
    { value: 'exists', label: 'exists', needsValue: false },
    { value: 'not_exists', label: 'not exists', needsValue: false },
  ],
  null: [
    { value: 'is_null', label: 'is null', needsValue: false },
    { value: 'is_not_null', label: 'is not null', needsValue: false },
    { value: 'exists', label: 'exists', needsValue: false },
    { value: 'not_exists', label: 'not exists', needsValue: false },
  ],
  unknown: [
    { value: 'equals', label: 'equals', needsValue: true },
    { value: 'not_equals', label: 'not equals', needsValue: true },
    { value: 'exists', label: 'exists', needsValue: false },
    { value: 'not_exists', label: 'not exists', needsValue: false },
  ],
};

export const TYPE_BADGE_COLORS: Record<FieldType, string> = {
  string: '#51df8e',
  boolean: '#f4c96e',
  number: '#a6c8ff',
  array: '#bc8aff',
  object: '#ff7eb6',
  null: '#4a6280',
  unknown: '#4a6280',
};
