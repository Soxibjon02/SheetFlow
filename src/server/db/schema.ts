import { pgTable, text, timestamp, integer, boolean, jsonb, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  emailVerified: boolean('email_verified').default(false).notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const googleAccounts = pgTable('google_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  googleUserId: text('google_user_id').notNull(),
  email: text('email').notNull(),
  accessTokenEncrypted: text('access_token_encrypted').notNull(),
  refreshTokenEncrypted: text('refresh_token_encrypted').notNull(),
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const connectedSheets = pgTable('connected_sheets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  googleAccountId: uuid('google_account_id').references(() => googleAccounts.id, { onDelete: 'set null' }),
  spreadsheetId: text('spreadsheet_id').notNull(),
  spreadsheetUrl: text('spreadsheet_url').notNull(),
  spreadsheetName: text('spreadsheet_name').notNull(),
  selectedSheetName: text('selected_sheet_name').default('Sheet1').notNull(),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sheetColumns = pgTable('sheet_columns', {
  id: uuid('id').defaultRandom().primaryKey(),
  connectedSheetId: uuid('connected_sheet_id').references(() => connectedSheets.id, { onDelete: 'cascade' }).notNull(),
  columnIndex: integer('column_index').notNull(),
  columnName: text('column_name').notNull(),
  detectedType: text('detected_type').notNull(),
  nullable: boolean('nullable').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const calculations = pgTable('calculations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  connectedSheetId: uuid('connected_sheet_id').references(() => connectedSheets.id, { onDelete: 'cascade' }).notNull(),
  functionName: text('function_name').notNull(),
  sourceColumn: text('source_column'),
  groupByColumn: text('group_by_column'),
  filtersJson: jsonb('filters_json'),
  parametersJson: jsonb('parameters_json'),
  resultJson: jsonb('result_json'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const dashboards = pgTable('dashboards', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  connectedSheetId: uuid('connected_sheet_id').references(() => connectedSheets.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  configurationJson: jsonb('configuration_json').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  connectedSheetId: uuid('connected_sheet_id').references(() => connectedSheets.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  configurationJson: jsonb('configuration_json').notNull(),
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const templates = pgTable('templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(), // Education, Business, Personal, Project Management
  configurationJson: jsonb('configuration_json').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userSettings = pgTable('user_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  language: text('language').default('en').notNull(), // 'uz' | 'en'
  theme: text('theme').default('dark').notNull(), // 'dark' | 'light' | 'system'
  timezone: text('timezone').default('Asia/Tashkent').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(), // 'connect_sheet', 'add_row', 'update_row', 'delete_row', etc.
  resourceType: text('resource_type').notNull(), // 'sheet', 'row', 'dashboard', 'calculation'
  resourceId: text('resource_id'),
  metadataJson: jsonb('metadata_json'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
