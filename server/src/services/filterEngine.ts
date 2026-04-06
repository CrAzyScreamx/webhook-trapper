import get from 'lodash/get';
import { Operator, LogicOp } from '../models/FilterRule';

interface RuleInput {
  fieldPath: string;
  operator: Operator;
  value: string | null;
  logicOp?: LogicOp;
  groupBefore?: number;
  groupAfter?: number;
}

type Token = 'AND' | 'OR' | '(' | ')' | boolean;

function evaluateRule(rule: RuleInput, payload: unknown): boolean {
  const actual = get(payload, rule.fieldPath);

  switch (rule.operator) {
    // — String operators —
    case 'equals':
      return String(actual) === String(rule.value ?? '');
    case 'not_equals':
      return String(actual) !== String(rule.value ?? '');
    case 'contains':
      return typeof actual === 'string' && actual.includes(rule.value ?? '');
    case 'starts_with':
      return typeof actual === 'string' && actual.startsWith(rule.value ?? '');
    case 'ends_with':
      return typeof actual === 'string' && actual.endsWith(rule.value ?? '');
    case 'matches':
      try {
        return typeof actual === 'string' && new RegExp(rule.value ?? '').test(actual);
      } catch {
        return false;
      }
    case 'is_empty':
      return actual === '' || actual === null || actual === undefined;
    case 'is_not_empty':
      return actual !== '' && actual !== null && actual !== undefined;

    // — Boolean operators —
    case 'is_true':
      return actual === true;
    case 'is_false':
      return actual === false;

    // — Number operators —
    case 'gt':
      return typeof actual === 'number' && actual > Number(rule.value);
    case 'lt':
      return typeof actual === 'number' && actual < Number(rule.value);
    case 'gte':
      return typeof actual === 'number' && actual >= Number(rule.value);
    case 'lte':
      return typeof actual === 'number' && actual <= Number(rule.value);

    // — Array operators —
    case 'in':
      return Array.isArray(actual) && String(rule.value ?? '') !== '' && actual.map(String).includes(String(rule.value));
    case 'not_in':
      return !Array.isArray(actual) || String(rule.value ?? '') === '' || !actual.map(String).includes(String(rule.value));

    // — Object operators —
    case 'has_key':
      return typeof actual === 'object' && actual !== null && !Array.isArray(actual) && (rule.value ?? '') in actual;
    case 'has_keys':
      if (typeof actual !== 'object' || actual === null || Array.isArray(actual)) return false;
      try {
        const keys = JSON.parse(rule.value ?? '[]');
        return Array.isArray(keys) && keys.every((k: string) => k in actual!);
      } catch {
        return false;
      }
    case 'is_null':
      return actual === null;
    case 'is_not_null':
      return actual !== null;

    // — Existence operators —
    case 'exists':
      return actual !== undefined && actual !== null;
    case 'not_exists':
      return actual === undefined || actual === null;

    default:
      return false;
  }
}

function tokenize(rules: RuleInput[], payload: unknown): Token[] {
  const tokens: Token[] = [];
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const result = evaluateRule(rule, payload);
    for (let j = 0; j < (rule.groupBefore ?? 0); j++) tokens.push('(');
    tokens.push(result);
    for (let j = 0; j < (rule.groupAfter ?? 0); j++) tokens.push(')');
    if (i < rules.length - 1) tokens.push(rule.logicOp ?? 'AND');
  }
  return tokens;
}

function evalTokens(tokens: Token[]): boolean {
  let pos = 0;

  function parseOr(): boolean {
    let left = parseAnd();
    while (pos < tokens.length && tokens[pos] === 'OR') {
      pos++;
      left = left || parseAnd();
    }
    return left;
  }

  function parseAnd(): boolean {
    let left = parsePrimary();
    while (pos < tokens.length && tokens[pos] === 'AND') {
      pos++;
      left = left && parsePrimary();
    }
    return left;
  }

  function parsePrimary(): boolean {
    if (tokens[pos] === '(') {
      pos++;
      const result = parseOr();
      if (tokens[pos] === ')') pos++;
      return result;
    }
    return (tokens[pos++] as boolean) === true;
  }

  return parseOr();
}

export function evaluate(rules: RuleInput[], payload: unknown): boolean {
  if (rules.length === 0) return true;
  const tokens = tokenize(rules, payload);
  return evalTokens(tokens);
}
