import { pgTable, text, varchar, integer, decimal, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const bankAccounts = pgTable("bank_accounts", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id").notNull(),
  accountName: varchar("account_name", { length: 255 }).notNull(),
  accountType: varchar("account_type", { length: 50 }).notNull(),
  bankName: varchar("bank_name", { length: 255 }).notNull(),
  accountNumber: varchar("account_number", { length: 255 }).notNull(),
  routingNumber: varchar("routing_number", { length: 255 }),
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  plaidAccountId: varchar("plaid_account_id", { length: 255 }),
  plaidAccessToken: text("plaid_access_token"),
  lastSynced: timestamp("last_synced").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const billPayments = pgTable("bill_payments", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id").notNull(),
  billId: integer("bill_id").notNull(),
  bankAccountId: integer("bank_account_id").notNull(),
  payeeWebsite: varchar("payee_website", { length: 255 }).notNull(),
  payeeAccountNumber: varchar("payee_account_number", { length: 255 }).notNull(),
  payeeLoginCredentials: text("payee_login_credentials"),
  isAutoPay: boolean("is_auto_pay").default(false),
  paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: integer("payment_date").notNull(),
  isActive: boolean("is_active").default(true),
  lastPaymentDate: timestamp("last_payment_date"),
  nextPaymentDate: timestamp("next_payment_date").notNull(),
  status: varchar("status", { length: 50 }).default("active"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentTransactions = pgTable("payment_transactions", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id").notNull(),
  billPaymentId: integer("bill_payment_id").notNull(),
  bankAccountId: integer("bank_account_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  transactionId: varchar("transaction_id", { length: 255 }),
  confirmationNumber: varchar("confirmation_number", { length: 255 }),
  errorMessage: text("error_message"),
  initiatedAt: timestamp("initiated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  metadata: json("metadata"),
});

export const paymentLimits = pgTable("payment_limits", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id").notNull(),
  limitType: varchar("limit_type", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const balanceHistory = pgTable("balance_history", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  bankAccountId: integer("bank_account_id").notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull(),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

export const payeeCredentials = pgTable("payee_credentials", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id").notNull(),
  payeeName: varchar("payee_name", { length: 255 }).notNull(),
  website: varchar("website", { length: 255 }).notNull(),
  loginUsername: text("login_username"),
  loginPassword: text("login_password"),
  accountNumber: text("account_number"),
  additionalFields: json("additional_fields"),
  isActive: boolean("is_active").default(true),
  lastVerified: timestamp("last_verified"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSynced: true,
});
export const insertBillPaymentSchema = createInsertSchema(billPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastPaymentDate: true,
});
export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  initiatedAt: true,
  completedAt: true,
});
export const insertPaymentLimitSchema = createInsertSchema(paymentLimits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertPayeeCredentialSchema = createInsertSchema(payeeCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastVerified: true,
});

export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type BillPayment = typeof billPayments.$inferSelect;
export type InsertBillPayment = z.infer<typeof insertBillPaymentSchema>;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;
export type PaymentLimit = typeof paymentLimits.$inferSelect;
export type InsertPaymentLimit = z.infer<typeof insertPaymentLimitSchema>;
export type PayeeCredential = typeof payeeCredentials.$inferSelect;
export type InsertPayeeCredential = z.infer<typeof insertPayeeCredentialSchema>;
export type BalanceHistory = typeof balanceHistory.$inferSelect;