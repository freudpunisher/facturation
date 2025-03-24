// src/db/schema.ts
import { pgTable, serial, varchar, integer, timestamp, decimal, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Client Table
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  nifClient: varchar('nifClient', { length: 50 }).unique(),
  company: varchar('company', { length: 255 }).notNull(),
  status: varchar('status', { enum: ['active', 'inactive'] }).default('active'),
  // tp_fiscal_center: varchar('status', { enum: ['DGC', 'DMC','DPMC'] }).default('DMC'),
  vat_taxpayer:integer('vat_taxpayer').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Facturation (Invoices) Table
export const invoiceStatusEnum = pgEnum('invoice_status', ['paid', 'pending', 'overdue']);

export const facturations = pgTable('facturations', {
  id: serial('id').primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).unique().notNull(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  sync: boolean('sync').default(false),

  invoice_type: varchar('invoice_type', { enum: ['FN', 'FA', 'RC', 'RHF'] }).default('FN'),
  payment_type: integer('payment_type').default(0),
  invoice_currency: varchar('invoice_currency', { enum: ['EUR', 'USD', 'BIF'] }).default('BIF'),
  tp_fiscal_center: varchar('tp_fiscal_center', { enum: ['DGC', 'DMC', 'DPMC'] }).default('DMC'),
  // Removed issueDate and dueDate fields
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).notNull(),
  status: invoiceStatusEnum('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Invoice Details Table
export const detailFacturations = pgTable('detail_facturations', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').references(() => facturations.id).notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).generatedAlwaysAs(sql`quantity * unit_price`),
});

// Tax Table (For Tax Collectors)
// export const taxTypeEnum = pgEnum('tax_type', ['VAT', 'Sales Tax', 'Income Tax']);

export const taxes = pgTable('taxes', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').references(() => facturations.id).notNull(),
  invoice_registered_date:  varchar('invoice_registered_date', { length: 255 }).notNull(),
  authorityReference: varchar('authority_reference', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const clientsRelations = relations(clients, ({ many }) => ({
  invoices: many(facturations),
}));

export const facturationRelations = relations(facturations, ({ one, many }) => ({
  client: one(clients, {
    fields: [facturations.clientId],
    references: [clients.id]
  }),
  items: many(detailFacturations),
  taxes: many(taxes),
}));

export const detailFacturationRelations = relations(detailFacturations, ({ one }) => ({
  invoice: one(facturations, {
    fields: [detailFacturations.invoiceId],
    references: [facturations.id]
  }),
}));

export const taxRelations = relations(taxes, ({ one }) => ({
  invoice: one(facturations, {
    fields: [taxes.invoiceId],
    references: [facturations.id]
  }),
}));