import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  jsonb,
  boolean,
  decimal,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Institutions table (enterprise layer)
export const institutions = pgTable("institutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // College / University
  code: varchar("code", { length: 12 }).notNull().unique(),
  phone: text("phone"),
  adminEmail: text("admin_email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Institution-level users (admins, coordinators, department heads)
export const institutionUsers = pgTable("institution_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  role: text("role").notNull(), // Institution Admin, Faculty Coordinator, Department Head
  department: text("department"),
  permissions: jsonb("permissions").default(sql`'{}'::jsonb`).notNull(),
  status: text("status").default("active").notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Institution-wide analytics snapshots
export const institutionAnalytics = pgTable("institution_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  snapshotDate: timestamp("snapshot_date").defaultNow().notNull(),
  metrics: jsonb("metrics").default(sql`'{}'::jsonb`).notNull(),
  heatmap: jsonb("heatmap").default(sql`'{}'::jsonb`).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Clubs table
export const clubs = pgTable("clubs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").references(() => institutions.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  collegeName: text("college_name").notNull(),
  department: text("department"),
  logoUrl: text("logo_url"),
  description: text("description"),
  performanceIndex: decimal("performance_index", { precision: 5, scale: 2 }).default(sql`0`).notNull(),
  clubCode: varchar("club_code", { length: 8 }).notNull().unique(),
  presidentPassword: text("president_password"), // Encrypted password for admin viewing
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

// Teams table
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clubId: varchar("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  captainId: varchar("captain_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Team members table
export const teamMembers = pgTable(
  "team_members",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    teamId: varchar("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    memberRole: text("member_role"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueTeamMember: uniqueIndex("team_members_team_user_idx").on(table.teamId, table.userId),
  }),
);

// Tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  clubId: varchar("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  teamId: varchar("team_id").references(() => teams.id, { onDelete: "set null" }),
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
export const institutionsRelations = relations(institutions, ({ many }) => ({
  users: many(institutionUsers),
  clubs: many(clubs),
  analytics: many(institutionAnalytics),
}));

export const institutionUsersRelations = relations(institutionUsers, ({ one }) => ({
  institution: one(institutions, {
    fields: [institutionUsers.institutionId],
    references: [institutions.id],
  }),
}));

export const institutionAnalyticsRelations = relations(institutionAnalytics, ({ one }) => ({
  institution: one(institutions, {
    fields: [institutionAnalytics.institutionId],
    references: [institutions.id],
  }),
}));

export const clubsRelations = relations(clubs, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [clubs.institutionId],
    references: [institutions.id],
  }),
  users: many(users),
  pendingMembers: many(pendingMembers),
  roles: many(roles),
  events: many(events),
  teams: many(teams),
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
  teamMemberships: many(teamMembers),
  teamsCaptained: many(teams, { relationName: "captain" }),
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

export const teamsRelations = relations(teams, ({ one, many }) => ({
  club: one(clubs, {
    fields: [teams.clubId],
    references: [clubs.id],
  }),
  captain: one(users, {
    fields: [teams.captainId],
    references: [users.id],
    relationName: "captain",
  }),
  members: many(teamMembers),
  tasks: many(tasks),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
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
  team: one(teams, {
    fields: [tasks.teamId],
    references: [teams.id],
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
export const insertInstitutionSchema = createInsertSchema(institutions).omit({
  id: true,
  createdAt: true,
});

export const insertInstitutionUserSchema = createInsertSchema(institutionUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInstitutionAnalyticsSchema = createInsertSchema(institutionAnalytics).omit({
  id: true,
  createdAt: true,
  snapshotDate: true,
});

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

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
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
export type Institution = typeof institutions.$inferSelect;
export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;

export type InstitutionUser = typeof institutionUsers.$inferSelect;
export type InsertInstitutionUser = z.infer<typeof insertInstitutionUserSchema>;

export type InstitutionAnalytics = typeof institutionAnalytics.$inferSelect;
export type InsertInstitutionAnalytics = z.infer<typeof insertInstitutionAnalyticsSchema>;

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

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

export type Finance = typeof finance.$inferSelect;
export type InsertFinance = z.infer<typeof insertFinanceSchema>;

export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;

// Elections table
export const elections = pgTable("elections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clubId: varchar("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
  institutionId: varchar("institution_id").notNull().references(() => institutions.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled, active, ended
  accessCode: text("access_code").notNull().unique(), // slug for public link
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Election candidates table
export const electionCandidates = pgTable("election_candidates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  electionId: varchar("election_id").notNull().references(() => elections.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }), // Now nullable to support manual names
  candidateName: text("candidate_name"), // For manually entered candidate names
  voteCount: integer("vote_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Election votes table (to prevent double voting via IP)
export const electionVotes = pgTable("election_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  electionId: varchar("election_id").notNull().references(() => elections.id, { onDelete: "cascade" }),
  ipHash: text("ip_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations for Elections
export const electionsRelations = relations(elections, ({ one, many }) => ({
  club: one(clubs, {
    fields: [elections.clubId],
    references: [clubs.id],
  }),
  institution: one(institutions, {
    fields: [elections.institutionId],
    references: [institutions.id],
  }),
  candidates: many(electionCandidates),
  votes: many(electionVotes),
}));

export const electionCandidatesRelations = relations(electionCandidates, ({ one }) => ({
  election: one(elections, {
    fields: [electionCandidates.electionId],
    references: [elections.id],
  }),
  user: one(users, {
    fields: [electionCandidates.userId],
    references: [users.id],
  }),
}));

export const electionVotesRelations = relations(electionVotes, ({ one }) => ({
  election: one(elections, {
    fields: [electionVotes.electionId],
    references: [elections.id],
  }),
}));

// Insert schemas for Elections
export const insertElectionSchema = createInsertSchema(elections).omit({
  id: true,
  createdAt: true,
});

export const insertElectionCandidateSchema = createInsertSchema(electionCandidates).omit({
  id: true,
  createdAt: true,
  voteCount: true,
});

export const insertElectionVoteSchema = createInsertSchema(electionVotes).omit({
  id: true,
  createdAt: true,
});

// Types for Elections
export type Election = typeof elections.$inferSelect;
export type InsertElection = z.infer<typeof insertElectionSchema>;

export type ElectionCandidate = typeof electionCandidates.$inferSelect;
export type InsertElectionCandidate = z.infer<typeof insertElectionCandidateSchema>;

export type ElectionVote = typeof electionVotes.$inferSelect;
export type InsertElectionVote = z.infer<typeof insertElectionVoteSchema>;
