import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const roleEnum = pgEnum("user_role", [
  "TEACH_LEAD",
  "SENIOR_DEVELOPER",
  "MID_LEVEL_DEVELOPER",
  "RECRUITER",
]);

const interviewStatusEnum = pgEnum("interview_status", [
  "schedulled",
  "in_progress",
  "completed",
  "approved",
  "rejected",
  "canceled",
]);

export const companySchema = pgTable("company", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  rate: numeric({ mode: "number", precision: 5, scale: 4 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const companyRelations = relations(companySchema, ({ many }) => ({
  companyMembers: many(companyMemberSchema),
  interviews: many(interviewSchema),
}));

export const userSchema = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const companyMemberSchema = pgTable("company_member", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .references(() => companySchema.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => userSchema.id)
    .notNull(),
  role: roleEnum(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const companyMemberRelations = relations(
  companyMemberSchema,
  ({ one }) => ({
    user: one(userSchema, {
      fields: [companyMemberSchema.userId],
      references: [userSchema.id],
    }),
    company: one(companySchema, {
      fields: [companyMemberSchema.companyId],
      references: [companySchema.id],
    }),
  }),
);

export const userRelations = relations(userSchema, ({ many }) => ({
  companyMembers: many(companyMemberSchema),
  interviewsAsInterviewer: many(interviewSchema, {
    relationName: "interviewer",
  }),
  interviewsAsInterviewee: many(interviewSchema, {
    relationName: "interviewee",
  }),
}));

export const interviewSchema = pgTable("interview", {
  id: uuid("id").primaryKey().defaultRandom(),
  position: text("position"),
  level: text("level"),
  status: interviewStatusEnum(),
  rawData: jsonb("raw_data"),
  companyId: uuid("company_id")
    .references(() => companySchema.id)
    .notNull(),
  interviewerId: uuid("interviewer_id")
    .references(() => companyMemberSchema.id)
    .notNull(),
  intervieweeId: uuid("interviewee_id")
    .references(() => userSchema.id)
    .notNull(),
  interviewDate: timestamp("interview_date", { withTimezone: true }),
  interviewTime: integer("interview_time"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const interviewRelations = relations(interviewSchema, ({ one }) => ({
  company: one(companySchema, {
    fields: [interviewSchema.companyId],
    references: [companySchema.id],
  }),
  interviewer: one(companyMemberSchema, {
    fields: [interviewSchema.interviewerId],
    references: [companyMemberSchema.id],
    relationName: "interviewer",
  }),
  interviewee: one(userSchema, {
    fields: [interviewSchema.intervieweeId],
    references: [userSchema.id],
    relationName: "interviewee",
  }),
}));
