import { FilterRule } from '../api/client';
import { detectFieldType, OPERATORS_BY_TYPE } from './fieldType';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RuleRow = Omit<FilterRule, 'id' | 'trapperId'> & { id?: string };

export type ParseResult =
  | { ok: true; rules: RuleRow[]; groupOpen: number | null; groupClose: number | null }
  | { ok: false; error: string };


// ─── Constants ────────────────────────────────────────────────────────────────

export const NO_VALUE_OPS = [
  'exists', 'not_exists', 'is_true', 'is_false',
  'is_empty', 'is_not_empty', 'is_null', 'is_not_null',
];


// ─── buildExprText ────────────────────────────────────────────────────────────

export function buildExprText(rules: RuleRow[], lastPayload: unknown): string {
  return rules.map((r, i) => {
    const prevOp = i > 0 ? (rules[i - 1].logicOp ?? 'AND') : null;
    const opens = '('.repeat(r.groupBefore ?? 0);
    const closes = ')'.repeat(r.groupAfter ?? 0);
    const fieldType = detectFieldType(lastPayload, r.fieldPath);
    const ops = OPERATORS_BY_TYPE[fieldType] ?? OPERATORS_BY_TYPE.unknown;
    const needsVal = ops.find((o) => o.value === r.operator)?.needsValue ?? true;
    const val = needsVal ? (r.value || '…') : '';
    return [prevOp, opens, r.fieldPath || '…', r.operator, val, closes].filter(Boolean).join(' ');
  }).join(' ');
}


// ─── parseExpressionText ──────────────────────────────────────────────────────

export function parseExpressionText(exprText: string): ParseResult {
  const trimmed = exprText.trim();

  if (!trimmed) {
    return { ok: true, rules: [], groupOpen: null, groupClose: null };
  }

  try {
    // Tokenize: handles ( ) "quoted strings" and whitespace-separated tokens
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let ci = 0; ci < trimmed.length; ci++) {
      const ch = trimmed[ci];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (inQuotes) { current += ch; continue; }
      if (ch === '(' || ch === ')') {
        if (current.trim()) tokens.push(current.trim());
        tokens.push(ch);
        current = '';
      } else if (/\s/.test(ch)) {
        if (current.trim()) tokens.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    if (current.trim()) tokens.push(current.trim());

    const newRules: RuleRow[] = [];
    let parenDepth = 0;
    let prevDepth = 0;
    let lastLogicOp: 'AND' | 'OR' = 'AND';
    let i = 0;

    const pushRule = (rule: RuleRow) => {
      newRules.push(rule);
      prevDepth = parenDepth;
    };

    const makeRule = (fieldPath: string, operator: FilterRule['operator'], value: string | null): RuleRow => ({
      fieldPath,
      operator,
      value,
      order: newRules.length,
      logicOp: lastLogicOp,
      groupBefore: Math.max(0, parenDepth - prevDepth),
      groupAfter: 0,
    });

    while (i < tokens.length) {
      const token = tokens[i];

      if (token === '(') { parenDepth++; i++; continue; }

      if (token === ')') {
        if (newRules.length > 0) {
          newRules[newRules.length - 1].groupAfter = (newRules[newRules.length - 1].groupAfter ?? 0) + 1;
        }
        parenDepth = Math.max(0, parenDepth - 1);
        prevDepth = parenDepth;
        i++;
        if (i < tokens.length && (tokens[i] === 'AND' || tokens[i] === 'OR')) {
          lastLogicOp = tokens[i] as 'AND' | 'OR';
          i++;
        }
        continue;
      }

      // token is a field path
      const fieldPath = token;
      i++;

      // End of tokens — field with no operator
      if (i >= tokens.length) {
        pushRule(makeRule(fieldPath, 'exists', null));
        break;
      }

      const nextToken = tokens[i];

      // Next is logic op — implicit 'exists' for this field
      if (nextToken === 'AND' || nextToken === 'OR') {
        pushRule(makeRule(fieldPath, 'exists', null));
        lastLogicOp = nextToken;
        i++;
        continue;
      }

      // Next is a paren — implicit 'exists'
      if (nextToken === '(' || nextToken === ')') {
        pushRule(makeRule(fieldPath, 'exists', null));
        continue;
      }

      // nextToken is the operator
      const operator = nextToken;
      i++;

      if (NO_VALUE_OPS.includes(operator)) {
        pushRule(makeRule(fieldPath, operator as FilterRule['operator'], null));
        if (i < tokens.length && (tokens[i] === 'AND' || tokens[i] === 'OR')) {
          lastLogicOp = tokens[i] as 'AND' | 'OR';
          i++;
        }
        continue;
      }

      // Consume value tokens until AND / OR / paren
      const valueParts: string[] = [];
      while (i < tokens.length) {
        const t = tokens[i];
        if (t === 'AND' || t === 'OR' || t === '(' || t === ')') break;
        valueParts.push(t);
        i++;
      }

      pushRule(makeRule(fieldPath, operator as FilterRule['operator'], valueParts.join(' ') || null));

      if (i < tokens.length && (tokens[i] === 'AND' || tokens[i] === 'OR')) {
        lastLogicOp = tokens[i] as 'AND' | 'OR';
        i++;
      }
    }

    if (newRules.length === 0) return { ok: false, error: 'No valid rules found' };

    const openIdx = newRules.findIndex((r) => (r.groupBefore ?? 0) > 0);
    const closeIdx = [...newRules].reverse().findIndex((r) => (r.groupAfter ?? 0) > 0);

    return {
      ok: true,
      rules: newRules,
      groupOpen: openIdx >= 0 ? openIdx : null,
      groupClose: openIdx >= 0 && closeIdx >= 0 ? newRules.length - 1 - closeIdx : null,
    };
  } catch {
    return { ok: false, error: 'Failed to parse expression' };
  }
}
