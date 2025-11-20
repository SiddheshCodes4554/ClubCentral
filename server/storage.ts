import {
  institutions,
  institutionUsers,
  institutionAnalytics,
  clubs,
  users,
  pendingMembers,
  roles,
  events,
  teams,
  teamMembers,
  tasks,
  finance,
  socialPosts,
  type Institution,
  type InstitutionUser,
  type InstitutionAnalytics,
  type Club,
  type User,
  type PendingMember,
  type Role,
  type Event,
  type Team,
  type TeamMember,
  type Task,
  type Finance,
  type SocialPost,
  type InsertInstitution,
  type InsertInstitutionUser,
  type InsertInstitutionAnalytics,
  type InsertClub,
  type InsertUser,
  type InsertPendingMember,
  type InsertRole,
  type InsertEvent,
  type InsertTeam,
  type InsertTeamMember,
  type InsertTask,
  type InsertFinance,
  type InsertSocialPost,
  type InsertElection,
  type InsertElectionCandidate,
  type InsertElectionVote,
  elections,
  electionCandidates,
  electionVotes,
  type Election,
  type ElectionCandidate,
  type ElectionVote,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // Institution operations
  getInstitution(id: string): Promise<Institution | undefined>;
  getInstitutionByCode(code: string): Promise<Institution | undefined>;
  createInstitution(data: InsertInstitution): Promise<Institution>;
  updateInstitution(id: string, data: Partial<InsertInstitution>): Promise<Institution | undefined>;

  // Institution user operations
  getInstitutionUser(id: string): Promise<InstitutionUser | undefined>;
  getInstitutionUserByEmail(email: string): Promise<InstitutionUser | undefined>;
  getInstitutionUsers(institutionId: string): Promise<InstitutionUser[]>;
  createInstitutionUser(user: InsertInstitutionUser): Promise<InstitutionUser>;
  updateInstitutionUser(id: string, data: Partial<InsertInstitutionUser>): Promise<InstitutionUser | undefined>;

  // Institution analytics operations
  createInstitutionAnalytics(data: InsertInstitutionAnalytics): Promise<InstitutionAnalytics>;
  getInstitutionAnalytics(institutionId: string, limit?: number): Promise<InstitutionAnalytics[]>;

  // Club operations
  getClub(id: string): Promise<Club | undefined>;
  getClubByCode(code: string): Promise<Club | undefined>;
  createClub(club: InsertClub): Promise<Club>;
  updateClub(id: string, data: Partial<InsertClub>): Promise<Club | undefined>;
  deleteClub(id: string): Promise<void>;
  getClubsByInstitution(institutionId: string): Promise<Club[]>;

  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByClub(clubId: string): Promise<User[]>;
  getUsersByInstitution(institutionId: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;

  // Pending member operations
  getPendingMembersByClub(clubId: string): Promise<PendingMember[]>;
  getPendingMembersByInstitution(institutionId: string): Promise<PendingMember[]>;
  createPendingMember(member: InsertPendingMember): Promise<PendingMember>;
  getPendingMember(id: string): Promise<PendingMember | undefined>;
  deletePendingMember(id: string): Promise<void>;

  // Role operations
  getRolesByClub(clubId: string): Promise<Role[]>;
  getRole(id: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: string, data: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: string): Promise<void>;

  // Event operations
  getEventsByClub(clubId: string): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<void>;

  countEventsByStatus(clubId: string, status: string): Promise<number>;
  countUpcomingEvents(clubId: string, current: Date): Promise<number>;
  getEventsByInstitution(institutionId: string): Promise<Event[]>;

  // Team operations
  getTeamsByClub(clubId: string): Promise<Team[]>;
  getTeam(id: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, data: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: string): Promise<void>;
  getTeamMembersWithUsers(teamId: string): Promise<Array<{ membership: TeamMember; user: User }>>;
  getTeamMember(teamId: string, userId: string): Promise<TeamMember | undefined>;
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: string, data: Partial<InsertTeamMember>): Promise<TeamMember | undefined>;
  removeTeamMember(teamId: string, userId: string): Promise<void>;

  // Task operations
  getTasksByClub(clubId: string): Promise<Task[]>;
  getTasksByEvent(eventId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  getTasksByInstitution(institutionId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;

  countTasksByStatus(clubId: string, status: string): Promise<number>;
  countTasksAssignedToUser(clubId: string, userId: string): Promise<number>;

  // Finance operations
  getFinanceByClub(clubId: string): Promise<Finance[]>;
  getFinanceByInstitution(institutionId: string): Promise<Finance[]>;
  getFinanceEntry(id: string): Promise<Finance | undefined>;
  createFinanceEntry(entry: InsertFinance): Promise<Finance>;
  updateFinanceEntry(id: string, data: Partial<InsertFinance>): Promise<Finance | undefined>;
  deleteFinanceEntry(id: string): Promise<void>;
  sumFinanceByStatus(clubId: string, type: 'income' | 'expense', status: string): Promise<number>;
  countFinanceByStatus(clubId: string, status: string): Promise<number>;

  // Social post operations
  getSocialPostsByClub(clubId: string): Promise<SocialPost[]>;
  getSocialPostsByInstitution(institutionId: string): Promise<SocialPost[]>;
  getSocialPost(id: string): Promise<SocialPost | undefined>;
  createSocialPost(post: InsertSocialPost): Promise<SocialPost>;
  updateSocialPost(id: string, data: Partial<InsertSocialPost>): Promise<SocialPost | undefined>;
  deleteSocialPost(id: string): Promise<void>;
  countSocialPostsByStatus(clubId: string, status: string): Promise<number>;

  // Election operations
  createElection(election: InsertElection): Promise<Election>;
  getElection(id: string): Promise<Election | undefined>;
  getElectionByAccessCode(code: string): Promise<Election | undefined>;
  getElectionsByInstitution(institutionId: string): Promise<Election[]>;
  createElectionCandidate(candidate: InsertElectionCandidate): Promise<ElectionCandidate>;
  getElectionCandidate(id: string): Promise<ElectionCandidate | undefined>;
  getElectionCandidates(electionId: string): Promise<ElectionCandidate[]>;
  createElectionVote(vote: InsertElectionVote): Promise<ElectionVote>;
  getElectionVoteByToken(electionId: string, voterToken: string): Promise<ElectionVote | undefined>;
  incrementCandidateVote(candidateId: string): Promise<void>;
  deleteElection(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Institution operations
  async getInstitution(id: string): Promise<Institution | undefined> {
    const [institution] = await db.select().from(institutions).where(eq(institutions.id, id));
    return institution || undefined;
  }

  async getInstitutionByCode(code: string): Promise<Institution | undefined> {
    const [institution] = await db.select().from(institutions).where(eq(institutions.code, code));
    return institution || undefined;
  }

  async createInstitution(data: InsertInstitution): Promise<Institution> {
    const [created] = await db.insert(institutions).values(data).returning();
    return created;
  }

  async updateInstitution(id: string, data: Partial<InsertInstitution>): Promise<Institution | undefined> {
    const [updated] = await db.update(institutions).set(data).where(eq(institutions.id, id)).returning();
    return updated || undefined;
  }

  // Institution user operations
  async getInstitutionUser(id: string): Promise<InstitutionUser | undefined> {
    const [user] = await db.select().from(institutionUsers).where(eq(institutionUsers.id, id));
    return user || undefined;
  }

  async getInstitutionUserByEmail(email: string): Promise<InstitutionUser | undefined> {
    const [user] = await db.select().from(institutionUsers).where(eq(institutionUsers.email, email));
    return user || undefined;
  }

  async getInstitutionUsers(institutionId: string): Promise<InstitutionUser[]> {
    return await db.select().from(institutionUsers).where(eq(institutionUsers.institutionId, institutionId));
  }

  async createInstitutionUser(user: InsertInstitutionUser): Promise<InstitutionUser> {
    const [created] = await db.insert(institutionUsers).values(user).returning();
    return created;
  }

  async updateInstitutionUser(
    id: string,
    data: Partial<InsertInstitutionUser>,
  ): Promise<InstitutionUser | undefined> {
    const [updated] = await db
      .update(institutionUsers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(institutionUsers.id, id))
      .returning();
    return updated || undefined;
  }

  // Institution analytics
  async createInstitutionAnalytics(data: InsertInstitutionAnalytics): Promise<InstitutionAnalytics> {
    const [created] = await db.insert(institutionAnalytics).values(data).returning();
    return created;
  }

  async getInstitutionAnalytics(institutionId: string, limit = 6): Promise<InstitutionAnalytics[]> {
    return await db
      .select()
      .from(institutionAnalytics)
      .where(eq(institutionAnalytics.institutionId, institutionId))
      .orderBy(sql`${institutionAnalytics.snapshotDate} DESC`)
      .limit(limit);
  }

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

  async getClubsByInstitution(institutionId: string): Promise<Club[]> {
    return await db.select().from(clubs).where(eq(clubs.institutionId, institutionId));
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

  async getUsersByInstitution(institutionId: string): Promise<User[]> {
    const institutionClubs = await this.getClubsByInstitution(institutionId);
    if (institutionClubs.length === 0) {
      return [];
    }
    const clubIds = institutionClubs.map((club) => club.id);
    return await db.select().from(users).where(inArray(users.clubId, clubIds));
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

  async getPendingMembersByInstitution(institutionId: string): Promise<PendingMember[]> {
    const institutionClubs = await this.getClubsByInstitution(institutionId);
    if (institutionClubs.length === 0) {
      return [];
    }
    const clubIds = institutionClubs.map((club) => club.id);
    return await db.select().from(pendingMembers).where(inArray(pendingMembers.clubId, clubIds));
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

  async deleteRole(id: string): Promise<void> {
    await db.delete(roles).where(eq(roles.id, id));
  }

  // Event operations
  async getEventsByClub(clubId: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.clubId, clubId));
  }

  async countEventsByStatus(clubId: string, status: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(and(eq(events.clubId, clubId), eq(events.status, status)));
    return Number(result[0]?.count ?? 0);
  }

  async countUpcomingEvents(clubId: string, current: Date): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(and(eq(events.clubId, clubId), sql`${events.date} > ${current}`));
    return Number(result[0]?.count ?? 0);
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

  async getEventsByInstitution(institutionId: string): Promise<Event[]> {
    const institutionClubs = await this.getClubsByInstitution(institutionId);
    if (!institutionClubs.length) {
      return [];
    }
    const clubIds = institutionClubs.map((club) => club.id);
    return await db.select().from(events).where(inArray(events.clubId, clubIds));
  }

  // Team operations
  async getTeamsByClub(clubId: string): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.clubId, clubId));
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async updateTeam(id: string, data: Partial<InsertTeam>): Promise<Team | undefined> {
    const [updated] = await db.update(teams).set(data).where(eq(teams.id, id)).returning();
    return updated || undefined;
  }

  async deleteTeam(id: string): Promise<void> {
    await db.delete(teams).where(eq(teams.id, id));
  }

  async getTeamMembersWithUsers(teamId: string): Promise<Array<{ membership: TeamMember; user: User }>> {
    const rows = await db
      .select({
        membership: {
          id: teamMembers.id,
          teamId: teamMembers.teamId,
          userId: teamMembers.userId,
          memberRole: teamMembers.memberRole,
          createdAt: teamMembers.createdAt,
        },
        user: users,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId));

    return rows.map((row) => ({
      membership: {
        id: row.membership.id,
        teamId: row.membership.teamId,
        userId: row.membership.userId,
        memberRole: row.membership.memberRole,
        createdAt: row.membership.createdAt,
      },
      user: row.user,
    }));
  }

  async getTeamMember(teamId: string, userId: string): Promise<TeamMember | undefined> {
    const [membership] = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
    return membership || undefined;
  }

  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const [newMember] = await db.insert(teamMembers).values(member).returning();
    return newMember;
  }

  async updateTeamMember(id: string, data: Partial<InsertTeamMember>): Promise<TeamMember | undefined> {
    const [updated] = await db.update(teamMembers).set(data).where(eq(teamMembers.id, id)).returning();
    return updated || undefined;
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    await db
      .delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
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

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getTasksByInstitution(institutionId: string): Promise<Task[]> {
    const institutionClubs = await this.getClubsByInstitution(institutionId);
    if (!institutionClubs.length) {
      return [];
    }
    const clubIds = institutionClubs.map((club) => club.id);
    return await db.select().from(tasks).where(inArray(tasks.clubId, clubIds));
  }

  async countTasksByStatus(clubId: string, status: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(and(eq(tasks.clubId, clubId), eq(tasks.status, status)));
    return Number(result[0]?.count ?? 0);
  }

  async countTasksAssignedToUser(clubId: string, userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(and(eq(tasks.clubId, clubId), eq(tasks.assignedToId, userId), sql`${tasks.status} != 'Done'`));
    return Number(result[0]?.count ?? 0);
  }

  // Finance operations
  async getFinanceByClub(clubId: string): Promise<Finance[]> {
    return await db.select().from(finance).where(eq(finance.clubId, clubId));
  }

  async getFinanceByInstitution(institutionId: string): Promise<Finance[]> {
    const institutionClubs = await this.getClubsByInstitution(institutionId);
    if (!institutionClubs.length) {
      return [];
    }
    const clubIds = institutionClubs.map((club) => club.id);
    return await db.select().from(finance).where(inArray(finance.clubId, clubIds));
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

  async deleteFinanceEntry(id: string): Promise<void> {
    await db.delete(finance).where(eq(finance.id, id));
  }

  async sumFinanceByStatus(clubId: string, type: 'income' | 'expense', status: string): Promise<number> {
    const result = await db
      .select({ total: sql<string>`coalesce(sum(${finance.amount}), '0')` })
      .from(finance)
      .where(and(eq(finance.clubId, clubId), eq(finance.type, type), eq(finance.status, status)));
    return parseFloat(result[0]?.total ?? '0');
  }

  async countFinanceByStatus(clubId: string, status: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(finance)
      .where(and(eq(finance.clubId, clubId), eq(finance.status, status)));
    return Number(result[0]?.count ?? 0);
  }

  // Social post operations
  async getSocialPostsByClub(clubId: string): Promise<SocialPost[]> {
    return await db.select().from(socialPosts).where(eq(socialPosts.clubId, clubId));
  }

  async getSocialPostsByInstitution(institutionId: string): Promise<SocialPost[]> {
    const institutionClubs = await this.getClubsByInstitution(institutionId);
    if (!institutionClubs.length) {
      return [];
    }
    const clubIds = institutionClubs.map((club) => club.id);
    return await db.select().from(socialPosts).where(inArray(socialPosts.clubId, clubIds));
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

  async countSocialPostsByStatus(clubId: string, status: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(socialPosts)
      .where(and(eq(socialPosts.clubId, clubId), eq(socialPosts.status, status)));
    return Number(result[0]?.count ?? 0);
  }

  // Election operations
  async createElection(election: InsertElection): Promise<Election> {
    const [newElection] = await db.insert(elections).values(election).returning();
    return newElection;
  }

  async getElection(id: string): Promise<Election | undefined> {
    const [election] = await db.select().from(elections).where(eq(elections.id, id));
    return election || undefined;
  }

  async getElectionByAccessCode(code: string): Promise<Election | undefined> {
    const [election] = await db.select().from(elections).where(eq(elections.accessCode, code));
    return election || undefined;
  }

  async getElectionsByInstitution(institutionId: string): Promise<Election[]> {
    return await db.select().from(elections).where(eq(elections.institutionId, institutionId));
  }

  async createElectionCandidate(candidate: InsertElectionCandidate): Promise<ElectionCandidate> {
    const [newCandidate] = await db.insert(electionCandidates).values(candidate).returning();
    return newCandidate;
  }

  async getElectionCandidate(id: string): Promise<ElectionCandidate | undefined> {
    const [candidate] = await db.select().from(electionCandidates).where(eq(electionCandidates.id, id));
    return candidate || undefined;
  }

  async getElectionCandidates(electionId: string): Promise<ElectionCandidate[]> {
    return await db.select().from(electionCandidates).where(eq(electionCandidates.electionId, electionId));
  }

  async createElectionVote(vote: InsertElectionVote): Promise<ElectionVote> {
    const [newVote] = await db.insert(electionVotes).values(vote).returning();
    return newVote;
  }

  async getElectionVoteByToken(electionId: string, voterToken: string): Promise<ElectionVote | undefined> {
    const [vote] = await db
      .select()
      .from(electionVotes)
      .where(and(eq(electionVotes.electionId, electionId), eq(electionVotes.voterToken, voterToken)));
    return vote || undefined;
  }

  async incrementCandidateVote(candidateId: string): Promise<void> {
    await db
      .update(electionCandidates)
      .set({ voteCount: sql`${electionCandidates.voteCount} + 1` })
      .where(eq(electionCandidates.id, candidateId));
  }

  async deleteElection(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(electionVotes).where(eq(electionVotes.electionId, id));
      await tx.delete(electionCandidates).where(eq(electionCandidates.electionId, id));
      await tx.delete(elections).where(eq(elections.id, id));
    });
  }
}

export const storage = new DatabaseStorage();
