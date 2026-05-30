import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
  email: text('email'),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});