---
title: Filter Rules Engine
type: feature
layer: backend
keywords: [filter, rules, logic, AND, OR, JSONPath, conditional]
---

# Filter Rules Engine

Defines and evaluates filter rules on incoming webhooks. Rules can match on payload fields using various operators (equals, contains, regex, etc.) and grouped with AND/OR logic. Webhooks matching rules can be rejected before forwarding.

## Dependencies

**Tools / services needed:** SQLite
**Dependent features:** [[Webhook Trappers]], [[Webhook Forwarding]]
**Packages:** drizzle-orm

## Files

| File | Role | Likely to edit? |
|------|------|-----------------|
| `server/src/services/filterEngine.ts` | Rule evaluation logic | Sometimes |
| `server/src/models/FilterRule.ts` | Filter rule type definition | Rarely |
| `server/src/schema.ts` | filterRules table schema | Rarely |
| `client/src/pages/FilterConfig.tsx` | UI for creating/editing rules | Sometimes |

## Understanding

**filterEngine.ts** — Core logic for evaluating a set of filter rules against a webhook payload. Uses JSONPath to navigate nested objects. Supports operators like `equals`, `contains`, `regex`, `greaterThan`, `lessThan`. Rules are combined with `AND` or `OR` operators and can be grouped. Returns true if the payload passes all rules.

**FilterRule model** — Defines a single rule: trapperId, fieldPath (JSONPath), operator, value, order, logicOp (AND/OR for combining with next rule), and grouping flags.

**filterRules table** — Stores rules per trapper, ordered for evaluation sequence.

**FilterConfig.tsx** — UI builder for creating rules. Allows selecting JSONPath fields, operators, and values. Renders rule groups visually.

Design note: Rules are evaluated on the server during webhook forwarding, before any attempt to send to the destination.
