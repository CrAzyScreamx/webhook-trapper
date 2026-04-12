function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Recursively walks a parsed override template and replaces {{field.path}}
 * placeholders with values from the source payload.
 *
 * - If the entire string value is a single placeholder (e.g. "{{user.id}}"),
 *   the original typed value (number, boolean, object, …) is preserved.
 * - If the placeholder is embedded in a larger string (e.g. "Hello {{name}}"),
 *   it is stringified and spliced in.
 * - Unknown paths are left as-is.
 */
export function applyTemplate(template: unknown, source: unknown): unknown {
  if (typeof template === 'string') {
    // Whole-value replacement — keep original type
    const fullMatch = template.match(/^\{\{([^}]+)\}\}$/);
    if (fullMatch) {
      const value = getNestedValue(source, fullMatch[1].trim());
      return value !== undefined ? value : template;
    }
    // Partial string interpolation — always a string result
    return template.replace(/\{\{([^}]+)\}\}/g, (_, path: string) => {
      const value = getNestedValue(source, path.trim());
      return value !== undefined ? String(value) : `{{${path}}}`;
    });
  }

  if (Array.isArray(template)) {
    return template.map((item) => applyTemplate(item, source));
  }

  if (template !== null && typeof template === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(template as Record<string, unknown>)) {
      result[key] = applyTemplate(value, source);
    }
    return result;
  }

  return template;
}
