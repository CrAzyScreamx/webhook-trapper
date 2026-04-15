import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const trappers = sqliteTable('trappers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  trapId: text('trapId').notNull().unique(),
  status: text('status').notNull().default('active'),
  destinationUrl: text('destinationUrl').notNull(),
  retryPolicy: text('retryPolicy').notNull().default('none'),
  authType: text('authType').notNull().default('none'),
  authValue: text('authValue'),
  rateLimit: integer('rateLimit'),
  rateLimitWindowMs: integer('rateLimitWindowMs'),
  hmacSecret: text('hmacSecret'),
  hmacHeader: text('hmacHeader'),
  hmacAlgorithm: text('hmacAlgorithm').notNull().default('sha256'),
  overrideEnabled: integer('overrideEnabled').notNull().default(0),
  overridePayload: text('overridePayload'),
  skipTlsVerify: integer('skipTlsVerify').notNull().default(0),
  customAuthHeader: text('customAuthHeader'),
  deliveryMode: text('deliveryMode').notNull().default('broadcast'),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

export const filterRules = sqliteTable('filter_rules', {
  id: text('id').primaryKey(),
  trapperId: text('trapperId').notNull(),
  fieldPath: text('fieldPath').notNull(),
  operator: text('operator').notNull(),
  value: text('value'),
  order: integer('order').notNull().default(0),
  logicOp: text('logicOp').notNull().default('AND'),
  groupBefore: integer('groupBefore').notNull().default(0),
  groupAfter: integer('groupAfter').notNull().default(0),
});

export const destinations = sqliteTable('destinations', {
  id: text('id').primaryKey(),
  trapperId: text('trapperId').notNull(),
  label: text('label').notNull(),
  url: text('url').notNull(),
  authType: text('authType').notNull().default('none'),
  authValue: text('authValue'),
  customAuthHeader: text('customAuthHeader'),
  skipTlsVerify: integer('skipTlsVerify').notNull().default(0),
  retryPolicy: text('retryPolicy').notNull().default('none'),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
});

export const webhookLogs = sqliteTable('webhook_logs', {
  id: text('id').primaryKey(),
  trapperId: text('trapperId').notNull(),
  timestamp: text('timestamp').notNull(),
  sourceIp: text('sourceIp').notNull(),
  method: text('method').notNull(),
  headers: text('headers').notNull(),
  payload: text('payload').notNull(),
  status: text('status').notNull(),
  responseCode: integer('responseCode'),
  latency: integer('latency'),
  errorMessage: text('errorMessage'),
  parentLogId: text('parentLogId'),
  destinationId: text('destinationId'),
  destinationLabel: text('destinationLabel'),
  createdAt: text('createdAt').notNull().$defaultFn(() => new Date().toISOString()),
});

// Inferred types
export type Trapper = typeof trappers.$inferSelect;
export type TrapperInsert = typeof trappers.$inferInsert;
export type FilterRule = typeof filterRules.$inferSelect;
export type FilterRuleInsert = typeof filterRules.$inferInsert;
export type WebhookLog = typeof webhookLogs.$inferSelect;
export type WebhookLogInsert = typeof webhookLogs.$inferInsert;
export type Destination = typeof destinations.$inferSelect;
export type DestinationInsert = typeof destinations.$inferInsert;

// Enum-style string literal types
export type RetryPolicy = 'exponential' | 'immediate' | 'none';
export type DeliveryMode = 'broadcast' | 'fallback';
export type AuthType = 'bearer' | 'basic' | 'hmac' | 'none' | 'custom';
export type TrapperStatus = 'active' | 'paused';
export type LogStatus = 'SENT' | 'FILTERED' | 'REJECTED' | 'QUEUED';
export type Operator =
  | 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 'matches' | 'is_empty' | 'is_not_empty'
  | 'is_true' | 'is_false'
  | 'gt' | 'lt' | 'gte' | 'lte'
  | 'in' | 'not_in'
  | 'has_key' | 'has_keys' | 'is_null' | 'is_not_null'
  | 'exists' | 'not_exists';
export type LogicOp = 'AND' | 'OR';
