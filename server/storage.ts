import {
  clubs, users, pendingMembers, roles, events, tasks, finance, socialPosts,
  type Club, type User, type PendingMember, type Role, type Event, type Task, type Finance, type SocialPost,
  type InsertClub, type InsertUser, type InsertPendingMember, type InsertRole,
  type InsertEvent, type InsertTask, type InsertFinance, type InsertSocialPost
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Club operations
  getClub(id: string): Promise<Club | undefined>;
  getClubByCode(code: string): Promise<Club | undefined>;
  createClub(club: InsertClub): Promise<Club>;
  updateClub(id: string, data: Partial<InsertClub>): Promise<Club | undefined>;
  deleteClub(id: string): Promise<void>;

  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByClub(clubId: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;

  // Pending member operations
  getPendingMembersByClub(clubId: string): Promise<PendingMember[]>;
  createPendingMember(member: InsertPendingMember): Promise<PendingMember>;
  getPendingMember(id: string): Promise<PendingMember | undefined>;
  deletePendingMember(id: string): Promise<void>;

  // Role operations
  getRolesByClub(clubId: string): Promise<Role[]>;
  getRole(id: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: string, data: Partial<InsertRole>): Promise<Role | undefined>;

  // Event operations
  getEventsByClub(clubId: string): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<void>;

  // Task operations
  getTasksByClub(clubId: string): Promise<Task[]>;
  getTasksByEvent(eventId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<InsertTask>): Promise<Task | undefined>;

  // Finance operations
  getFinanceByClub(clubId: string): Promise<Finance[]>;
  getFinanceEntry(id: string): Promise<Finance | undefined>;
  createFinanceEntry(entry: InsertFinance): Promise<Finance>;
  updateFinanceEntry(id: string, data: Partial<InsertFinance>): Promise<Finance | undefined>;

  // Social post operations
  getSocialPostsByClub(clubId: string): Promise<SocialPost[]>;
  getSocialPost(id: string): Promise<SocialPost | undefined>;
  createSocialPost(post: InsertSocialPost): Promise<SocialPost>;
  updateSocialPost(id: string, data: Partial<InsertSocialPost>): Promise<SocialPost | undefined>;
  deleteSocialPost(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Club operations
  async getClub(id: string): Promise<Club | undefined> {
    const [club] = await db.select().from(clubs).where(eq(clubs.id, id));
    return club || undefined;
  }

  async getClubByCode(code: string): Promise<Club | undefined> {
    const [club] = await db.select().from(clubs).where(eq(clubs.clubCode, code));
    return club || undefined;
  }

  async createClub(club: InsertClub): Promise<Club> {
    const [newClub] = await db.insert(clubs).values(club).returning();
    return newClub;
  }

  async updateClub(id: string, data: Partial<InsertClub>): Promise<Club | undefined> {
    const [updated] = await db.update(clubs).set(data).where(eq(clubs.id, id)).returning();
    return updated || undefined;
  }

  async deleteClub(id: string): Promise<void> {
    await db.delete(clubs).where(eq(clubs.id, id));
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUsersByClub(clubId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.clubId, clubId));
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated || undefined;
  }

  // Pending member operations
  async getPendingMembersByClub(clubId: string): Promise<PendingMember[]> {
    return await db.select().from(pendingMembers).where(eq(pendingMembers.clubId, clubId));
  }

  async createPendingMember(member: InsertPendingMember): Promise<PendingMember> {
    const [newMember] = await db.insert(pendingMembers).values(member).returning();
    return newMember;
  }

  async getPendingMember(id: string): Promise<PendingMember | undefined> {
    const [member] = await db.select().from(pendingMembers).where(eq(pendingMembers.id, id));
    return member || undefined;
  }

  async deletePendingMember(id: string): Promise<void> {
    await db.delete(pendingMembers).where(eq(pendingMembers.id, id));
  }

  // Role operations
  async getRolesByClub(clubId: string): Promise<Role[]> {
    return await db.select().from(roles).where(eq(roles.clubId, clubId));
  }

  async getRole(id: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role || undefined;
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }

  async updateRole(id: string, data: Partial<InsertRole>): Promise<Role | undefined> {
    const [updated] = await db.update(roles).set(data).where(eq(roles.id, id)).returning();
    return updated || undefined;
  }

  // Event operations
  async getEventsByClub(clubId: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.clubId, clubId));
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updated] = await db.update(events).set(data).where(eq(events.id, id)).returning();
    return updated || undefined;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  // Task operations
  async getTasksByClub(clubId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.clubId, clubId));
  }

  async getTasksByEvent(eventId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.eventId, eventId));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: string, data: Partial<InsertTask>): Promise<Task | undefined> {
    const [updated] = await db.update(tasks).set(data).where(eq(tasks.id, id)).returning();
    return updated || undefined;
  }

  // Finance operations
  async getFinanceByClub(clubId: string): Promise<Finance[]> {
    return await db.select().from(finance).where(eq(finance.clubId, clubId));
  }

  async getFinanceEntry(id: string): Promise<Finance | undefined> {
    const [entry] = await db.select().from(finance).where(eq(finance.id, id));
    return entry || undefined;
  }

  async createFinanceEntry(entry: InsertFinance): Promise<Finance> {
    const [newEntry] = await db.insert(finance).values(entry).returning();
    return newEntry;
  }

  async updateFinanceEntry(id: string, data: Partial<InsertFinance>): Promise<Finance | undefined> {
    const [updated] = await db.update(finance).set(data).where(eq(finance.id, id)).returning();
    return updated || undefined;
  }

  // Social post operations
  async getSocialPostsByClub(clubId: string): Promise<SocialPost[]> {
    return await db.select().from(socialPosts).where(eq(socialPosts.clubId, clubId));
  }

  async getSocialPost(id: string): Promise<SocialPost | undefined> {
    const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, id));
    return post || undefined;
  }

  async createSocialPost(post: InsertSocialPost): Promise<SocialPost> {
    const [newPost] = await db.insert(socialPosts).values(post).returning();
    return newPost;
  }

  async updateSocialPost(id: string, data: Partial<InsertSocialPost>): Promise<SocialPost | undefined> {
    const [updated] = await db.update(socialPosts).set(data).where(eq(socialPosts.id, id)).returning();
    return updated || undefined;
  }

  async deleteSocialPost(id: string): Promise<void> {
    await db.delete(socialPosts).where(eq(socialPosts.id, id));
  }
}

export const storage = new DatabaseStorage();
