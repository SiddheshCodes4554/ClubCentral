import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Clubs table
export const clubs = pgTable("clubs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  collegeName: text("college_name").notNull(),
  logoUrl: text("logo_url"),
  description: text("description"),
  clubCode: varchar("club_code", { length: 8 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users table - for approved members with login access
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clubId: varchar("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  idNumber: text("id_number"),
  linkedin: text("linkedin"),
  portfolio: text("portfolio"),
  role: text("role").notNull(), // President, Vice-President, Council Head, Member
  roleId: varchar("role_id").references(() => roles.id), // For custom roles
  isPresident: boolean("is_president").default(false).notNull(),
  isApproved: boolean("is_approved").default(true).notNull(),
  canLogin: boolean("can_login").default(true).notNull(), // Only President/VP/Heads can login
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Pending members table - applications awaiting approval
export const pendingMembers = pgTable("pending_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clubId: varchar("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  phone: text("phone"),
  idNumber: text("id_number"),
  linkedin: text("linkedin"),
  portfolio: text("portfolio"),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
});

// Custom roles table
export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clubId: varchar("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g., "Content Head", "Finance Head", "Event Head"
  permissions: jsonb("permissions").notNull(), // JSON object with permission flags
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Events table
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clubId: varchar("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("Planning"), // Planning, Ongoing, Completed
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  clubId: varchar("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("Pending"), // Pending, In Progress, Done
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Finance table
export const finance = pgTable("finance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clubId: varchar("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
  transactionName: text("transaction_name").notNull(),
  type: text("type").notNull(), // income, expense
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  receiptUrl: text("receipt_url"),
  status: text("status").notNull().default("Pending"), // Pending, Approved
  approvedById: varchar("approved_by_id").references(() => users.id),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Social posts table
export const socialPosts = pgTable("social_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clubId: varchar("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
  caption: text("caption").notNull(),
  imageUrl: text("image_url"),
  platform: text("platform").notNull(), // Instagram, Twitter, Facebook, LinkedIn
  scheduledDate: timestamp("scheduled_date"),
  status: text("status").notNull().default("Draft"), // Draft, Scheduled, Posted
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const clubsRelations = relations(clubs, ({ many }) => ({
  users: many(users),
  pendingMembers: many(pendingMembers),
  roles: many(roles),
  events: many(events),
  tasks: many(tasks),
  finance: many(finance),
  socialPosts: many(socialPosts),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  club: one(clubs, {
    fields: [users.clubId],
    references: [clubs.id],
  }),
  customRole: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  eventsCreated: many(events, { relationName: "created_by" }),
  eventsAssigned: many(events, { relationName: "assigned_to" }),
  tasksAssigned: many(tasks),
  financeCreated: many(finance, { relationName: "finance_created_by" }),
  financeApproved: many(finance, { relationName: "finance_approved_by" }),
  socialPostsCreated: many(socialPosts),
}));

export const pendingMembersRelations = relations(pendingMembers, ({ one }) => ({
  club: one(clubs, {
    fields: [pendingMembers.clubId],
    references: [clubs.id],
  }),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  club: one(clubs, {
    fields: [roles.clubId],
    references: [clubs.id],
  }),
  users: many(users),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  club: one(clubs, {
    fields: [events.clubId],
    references: [clubs.id],
  }),
  assignedTo: one(users, {
    fields: [events.assignedToId],
    references: [users.id],
    relationName: "assigned_to",
  }),
  createdBy: one(users, {
    fields: [events.createdById],
    references: [users.id],
    relationName: "created_by",
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  event: one(events, {
    fields: [tasks.eventId],
    references: [events.id],
  }),
  club: one(clubs, {
    fields: [tasks.clubId],
    references: [clubs.id],
  }),
  assignedTo: one(users, {
    fields: [tasks.assignedToId],
    references: [users.id],
  }),
}));

export const financeRelations = relations(finance, ({ one }) => ({
  club: one(clubs, {
    fields: [finance.clubId],
    references: [clubs.id],
  }),
  approvedBy: one(users, {
    fields: [finance.approvedById],
    references: [users.id],
    relationName: "finance_approved_by",
  }),
  createdBy: one(users, {
    fields: [finance.createdById],
    references: [users.id],
    relationName: "finance_created_by",
  }),
}));

export const socialPostsRelations = relations(socialPosts, ({ one }) => ({
  club: one(clubs, {
    fields: [socialPosts.clubId],
    references: [clubs.id],
  }),
  createdBy: one(users, {
    fields: [socialPosts.createdById],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertClubSchema = createInsertSchema(clubs).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPendingMemberSchema = createInsertSchema(pendingMembers).omit({
  id: true,
  appliedAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export const insertFinanceSchema = createInsertSchema(finance).omit({
  id: true,
  createdAt: true,
});

export const insertSocialPostSchema = createInsertSchema(socialPosts).omit({
  id: true,
  createdAt: true,
});

// Types
export type Club = typeof clubs.$inferSelect;
export type InsertClub = z.infer<typeof insertClubSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type PendingMember = typeof pendingMembers.$inferSelect;
export type InsertPendingMember = z.infer<typeof insertPendingMemberSchema>;

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Finance = typeof finance.$inferSelect;
export type InsertFinance = z.infer<typeof insertFinanceSchema>;

export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
