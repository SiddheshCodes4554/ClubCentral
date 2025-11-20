import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "crypto";
import ExcelJS from "exceljs";
import type {
  InsertEvent,
  InsertTask,
  InsertTeam,
  InsertTeamMember,
  InsertUser,
  InsertFinance,
  InsertSocialPost,
  InsertClub,
  InsertInstitution,
  InsertInstitutionUser,
  User,
  Team,
  TeamMember,
  Institution,
  InstitutionUser,
  Club,
  PendingMember,
  Event,
  Task,
  Finance,
  SocialPost,
} from "@shared/schema";
import {
  type Permission,
  type PermissionSet,
  getUserPermissions,
  hasPermission,
  getPresidentPermissions,
  getVicePresidentPermissions,
  ALL_PERMISSIONS,
} from "@shared/permissions";
import PDFDocument from "pdfkit";
import archiver from "archiver";
import { PassThrough } from "stream";

const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-in-production";
const APP_BASE_URL = process.env.APP_BASE_URL || process.env.CLIENT_URL || "https://app.clubcentral.local";

// Simple encryption for storing passwords (admin viewing only)
function encryptPassword(password: string): string {
  // Simple base64 encoding - in production, use proper encryption
  return Buffer.from(password).toString('base64');
}

function decryptPassword(encrypted: string): string {
  return Buffer.from(encrypted, 'base64').toString('utf-8');
}

type InstitutionPermissionSet = {
  canManageInstitution: boolean;
  canCreateClubs: boolean;
  canAssignPresident: boolean;
  canManageAdmins: boolean;
  canCommentOnEvents: boolean;
  scope: "all" | "department";
};

const INSTITUTION_ROLE_PERMISSIONS: Record<string, InstitutionPermissionSet> = {
  "Institution Admin": {
    canManageInstitution: true,
    canCreateClubs: true,
    canAssignPresident: true,
    canManageAdmins: true,
    canCommentOnEvents: true,
    scope: "all",
  },
  "Faculty Coordinator": {
    canManageInstitution: false,
    canCreateClubs: false,
    canAssignPresident: false,
    canManageAdmins: false,
    canCommentOnEvents: true,
    scope: "all",
  },
  "Department Head": {
    canManageInstitution: false,
    canCreateClubs: false,
    canAssignPresident: false,
    canManageAdmins: false,
    canCommentOnEvents: false,
    scope: "department",
  },
};

const ALLOWED_INSTITUTION_ROLES = ["Institution Admin", "Faculty Coordinator", "Department Head"] as const;

const getInstitutionPermissions = (role: string): InstitutionPermissionSet => {
  return INSTITUTION_ROLE_PERMISSIONS[role] ?? {
    canManageInstitution: false,
    canCreateClubs: false,
    canAssignPresident: false,
    canManageAdmins: false,
    canCommentOnEvents: false,
    scope: "all",
  };
};

type PublicUser = Omit<User, "password">;

const sanitizeUser = (user?: User | null): PublicUser | null => {
  if (!user) return null;
  const { password: _password, ...rest } = user;
  return rest;
};

const sanitizeUsers = (users: User[]): PublicUser[] => {
  return users.map((user) => sanitizeUser(user)!).filter(Boolean) as PublicUser[];
};

type PublicInstitutionUser = Omit<InstitutionUser, "password">;
const sanitizeInstitutionUser = (user?: InstitutionUser | null): PublicInstitutionUser | null => {
  if (!user) return null;
  const { password: _password, ...rest } = user;
  return rest;
};

type TeamMemberResponse = PublicUser & { memberRole: string | null };

const sanitizeTeamMember = (membership: TeamMember, user: User): TeamMemberResponse => {
  const sanitized = sanitizeUser(user);
  if (!sanitized) {
    throw new Error("Unable to sanitize user");
  }

  return {
    ...sanitized,
    memberRole: membership.memberRole ?? null,
  };
};

const buildTeamResponse = async (team: Team) => {
  const memberRows = await storage.getTeamMembersWithUsers(team.id);
  const members = memberRows.map(({ membership, user }) => sanitizeTeamMember(membership, user));
  const captain = team.captainId ? members.find((member) => member.id === team.captainId) ?? null : null;

  return {
    id: team.id,
    clubId: team.clubId,
    name: team.name,
    description: team.description,
    captainId: team.captainId,
    captain,
    members,
    createdAt: team.createdAt,
  };
};

const EXCEL_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const sendWorkbook = async (res: Response, workbook: ExcelJS.Workbook, filename: string) => {
  const buffer = await workbook.xlsx.writeBuffer();
  res.setHeader("Content-Type", EXCEL_CONTENT_TYPE);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(Buffer.from(buffer));
};

const formatDateDisplay = (value?: Date | string | null) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
};

const fileDateStamp = () => {
  const now = new Date();
  return now.toISOString().split("T")[0];
};

// JWT middleware
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    clubId: string;
    role: string;
    isPresident: boolean;
    permissions: PermissionSet;
  };
}

interface InstitutionAuthRequest extends Request {
  institutionUser?: {
    id: string;
    institutionId: string;
    role: string;
    department: string | null;
    permissions: InstitutionPermissionSet;
  };
}

const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.scope && decoded.scope !== 'club') {
      return res.status(403).json({ message: 'Invalid token scope' });
    }
    const user = await storage.getUser(decoded.userId);

    if (!user || !user.canLogin) {
      console.error('[AUTH ERROR] User not found or cannot login:', { userId: decoded.userId });
      return res.status(403).json({ message: 'Access denied' });
    }

    // Verify club exists and user is properly associated
    const club = await storage.getClub(user.clubId);
    if (!club) {
      console.error('[AUTH ERROR] User club not found:', { userId: user.id, clubId: user.clubId, email: user.email });
      return res.status(403).json({ message: 'User club association error. Please contact support.' });
    }

    // Get custom role permissions if user has a roleId
    let customRolePermissions: PermissionSet | null = null;
    if (user.roleId) {
      const customRole = await storage.getRole(user.roleId);
      if (customRole) {
        customRolePermissions = (customRole.permissions as PermissionSet) || null;
      }
    }

    // Calculate effective permissions
    const permissions = getUserPermissions(
      user.isPresident,
      user.role,
      customRolePermissions,
    );

    // Enhanced logging for debugging
    console.log('[AUTH SUCCESS]', {
      userId: user.id,
      email: user.email,
      clubId: user.clubId,
      clubName: club.name,
      role: user.role,
      isPresident: user.isPresident,
    });

    req.user = {
      id: user.id,
      email: user.email,
      clubId: user.clubId,
      role: user.role,
      isPresident: user.isPresident,
      permissions,
    };
    next();
  } catch (error) {
    console.error('[AUTH ERROR] Token verification failed:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

const authenticateInstitutionToken = async (req: InstitutionAuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.scope !== 'institution') {
      return res.status(403).json({ message: 'Invalid token scope' });
    }
    const institutionUser = await storage.getInstitutionUser(decoded.userId);
    if (!institutionUser || institutionUser.status !== 'active') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const permissions = getInstitutionPermissions(institutionUser.role);

    req.institutionUser = {
      id: institutionUser.id,
      institutionId: institutionUser.institutionId,
      role: institutionUser.role,
      department: institutionUser.department ?? null,
      permissions,
    };

    await storage.updateInstitutionUser(institutionUser.id, { lastLoginAt: new Date() });

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Permission checking middleware factory
const requirePermission = (permission: Permission) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!hasPermission(req.user.permissions, permission)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

const requireInstitutionRole = (roles: string[]) => {
  return (req: InstitutionAuthRequest, res: Response, next: NextFunction) => {
    if (!req.institutionUser) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.institutionUser.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Generate unique club code
function generateClubCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

function generateInstitutionCode(): string {
  return randomBytes(3).toString('hex').toUpperCase();
}

function generateTemporaryPassword(): string {
  return randomBytes(6).toString('base64url').slice(0, 10);
}

function filterClubsForInstitutionUser(clubs: Club[], ctx: InstitutionAuthRequest["institutionUser"]) {
  if (!ctx) return [];
  if (ctx.permissions.scope === "all") {
    return clubs;
  }
  const department = (ctx.department || "").toLowerCase();
  return clubs.filter((club) => (club.department || "").toLowerCase() === department);
}

function calculateClubPerformanceScore(
  clubId: string,
  events: Event[],
  tasks: Task[],
  members: User[],
  financeEntries: Finance[],
) {
  const clubEvents = events.filter((event) => event.clubId === clubId);
  const clubTasks = tasks.filter((task) => task.clubId === clubId);
  const clubMembers = members.filter((member) => member.clubId === clubId);
  const completedTasks = clubTasks.filter((task) => task.status === "Done").length;
  const totalTasks = clubTasks.length || 1;
  const approvedExpenses = financeEntries.filter(
    (entry) => entry.clubId === clubId && entry.type === "expense" && entry.status === "Approved",
  );
  const totalSpend = approvedExpenses.reduce((sum, entry) => sum + parseFloat(entry.amount), 0);

  const score =
    clubEvents.length * 10 +
    (completedTasks / totalTasks) * 40 +
    clubMembers.length * 2 -
    totalSpend * 0.01;

  return Math.max(0, Math.min(100, Number(score.toFixed(2))));
}

async function loadInstitutionCollections(institutionId: string) {
  const [institution, clubs, users, events, tasks, financeEntries, pendingMembers] = await Promise.all([
    storage.getInstitution(institutionId),
    storage.getClubsByInstitution(institutionId),
    storage.getUsersByInstitution(institutionId),
    storage.getEventsByInstitution(institutionId),
    storage.getTasksByInstitution(institutionId),
    storage.getFinanceByInstitution(institutionId),
    storage.getPendingMembersByInstitution(institutionId),
  ]);

  if (!institution) {
    throw new Error("Institution not found");
  }

  return { institution, clubs, users, events, tasks, financeEntries, pendingMembers };
}

function emitPresidentInviteLog(email: string, inviteLink: string, temporaryPassword: string) {
  console.log(
    `President invite prepared for ${email}. Login link: ${inviteLink}. Temporary password: ${temporaryPassword}`,
  );
}

function scopeInstitutionCollections(
  data: Awaited<ReturnType<typeof loadInstitutionCollections>>,
  ctx: InstitutionAuthRequest["institutionUser"],
) {
  const scopedClubs = filterClubsForInstitutionUser(data.clubs, ctx);
  const allowedClubIds = new Set(scopedClubs.map((club) => club.id));

  const scopedUsers = data.users.filter((user) => allowedClubIds.has(user.clubId));
  const scopedEvents = data.events.filter((event) => allowedClubIds.has(event.clubId));
  const scopedTasks = data.tasks.filter((task) => allowedClubIds.has(task.clubId));
  const scopedFinance = data.financeEntries.filter((entry) => allowedClubIds.has(entry.clubId));
  const scopedPendingMembers = data.pendingMembers.filter((pending) => allowedClubIds.has(pending.clubId));

  return {
    institution: data.institution,
    clubs: scopedClubs,
    users: scopedUsers,
    events: scopedEvents,
    tasks: scopedTasks,
    financeEntries: scopedFinance,
    pendingMembers: scopedPendingMembers,
  };
}

async function getScopedInstitutionData(req: InstitutionAuthRequest) {
  if (!req.institutionUser) {
    throw new Error("Institution context missing");
  }
  const collections = await loadInstitutionCollections(req.institutionUser.institutionId);
  return scopeInstitutionCollections(collections, req.institutionUser);
}

function createPdfResponse(res: Response, filename: string) {
  const doc = new PDFDocument({ margin: 40 });
  const stream = new PassThrough();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(stream);
  stream.pipe(res);
  return doc;
}

type FinanceCategoryTotals = Record<"Operations" | "PR" | "Logistics" | "Marketing", number>;
type FinanceCategory = keyof FinanceCategoryTotals;

const FINANCE_CATEGORY_KEYWORDS: Record<string, FinanceCategory> = {
  marketing: "Marketing",
  promo: "Marketing",
  sponsor: "Marketing",
  logistics: "Logistics",
  venue: "Logistics",
  travel: "Logistics",
  operations: "Operations",
  ops: "Operations",
  print: "Operations",
  design: "PR",
  media: "PR",
  pr: "PR",
};

function categorizeFinanceEntry(entry: Finance): FinanceCategory {
  const name = (entry.transactionName || "").toLowerCase();
  for (const keyword in FINANCE_CATEGORY_KEYWORDS) {
    if (name.includes(keyword)) {
      return FINANCE_CATEGORY_KEYWORDS[keyword];
    }
  }
  return "Operations";
}

function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildEventsPerMonth(events: Event[], months = 6) {
  const now = new Date();
  const result: { month: string; count: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    result.push({
      month: label,
      count: events.filter((event) => {
        const eventDate = new Date(event.date as unknown as string);
        return eventDate.getMonth() === date.getMonth() && eventDate.getFullYear() === date.getFullYear();
      }).length,
    });
  }
  return result;
}

function buildTaskBreakdown(tasks: Task[]) {
  const breakdown = { Pending: 0, 'In Progress': 0, Done: 0 };
  tasks.forEach((task) => {
    if (task.status === 'Done') breakdown.Done += 1;
    else if (task.status === 'In Progress') breakdown['In Progress'] += 1;
    else breakdown.Pending += 1;
  });
  return breakdown;
}

function buildActivityHeatmap(events: Event[], tasks: Task[]) {
  const heatmap = new Map<string, number>();

  events.forEach((event) => {
    const key = new Date(event.date as unknown as string).toISOString().split('T')[0];
    heatmap.set(key, (heatmap.get(key) || 0) + 1);
  });

  tasks.forEach((task) => {
    if (!task.createdAt) return;
    const key = new Date(task.createdAt as unknown as string).toISOString().split('T')[0];
    heatmap.set(key, (heatmap.get(key) || 0) + 0.5);
  });

  return Array.from(heatmap.entries()).map(([date, intensity]) => ({ date, intensity }));
}

function buildClubBudgetUsage(clubs: Club[], events: Event[], financeEntries: Finance[]) {
  return clubs.map((club) => {
    const clubEvents = events.filter((event) => event.clubId === club.id);
    const clubFinance = financeEntries.filter((entry) => entry.clubId === club.id);
    const assigned = clubEvents.reduce((sum, event) => sum + toNumber(event.budget), 0);
    const spent = clubFinance
      .filter((entry) => entry.type === 'expense' && entry.status === 'Approved')
      .reduce((sum, entry) => sum + toNumber(entry.amount), 0);

    return {
      clubId: club.id,
      clubName: club.name,
      department: club.department,
      assignedBudget: Number(assigned.toFixed(2)),
      spentBudget: Number(spent.toFixed(2)),
    };
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================================
  // AUTH ROUTES
  // ============================================================

  // President signup disabled in Institution Mode
  app.post('/api/auth/register-president', (_req, res) => {
    return res.status(403).json({
      message: 'Clubs can only be created by your institution administrator.',
    });
  });

  // Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!user.canLogin) {
        return res.status(403).json({ message: 'Account pending approval or no login access' });
      }

      // Debug logging (remove in production)
      console.log('[LOGIN DEBUG]', {
        email,
        userId: user.id,
        clubId: user.clubId,
        userExists: !!user,
        canLogin: user.canLogin,
        isPresident: user.isPresident,
        role: user.role,
        passwordLength: password?.length,
        storedPasswordLength: user.password?.length,
        storedPasswordPrefix: user.password?.substring(0, 10),
      });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        console.error('[LOGIN FAILED] Password comparison failed for:', email);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify club exists and user is properly associated
      const club = await storage.getClub(user.clubId);
      if (!club) {
        console.error('[LOGIN ERROR] User club not found:', { userId: user.id, clubId: user.clubId, email });
        return res.status(500).json({ message: 'User club association error. Please contact support.' });
      }

      const token = jwt.sign({ userId: user.id, scope: 'club' }, JWT_SECRET, { expiresIn: '30d' });

      // Get custom role permissions if user has a roleId
      let customRolePermissions: PermissionSet | null = null;
      if (user.roleId) {
        const customRole = await storage.getRole(user.roleId);
        if (customRole) {
          customRolePermissions = (customRole.permissions as PermissionSet) || null;
        }
      }

      // Calculate effective permissions
      const permissions = getUserPermissions(
        user.isPresident,
        user.role,
        customRolePermissions,
      );

      // Double-check club association before returning
      const verifiedClub = await storage.getClub(user.clubId);
      if (!verifiedClub) {
        console.error('[LOGIN CRITICAL] User club association broken:', {
          userId: user.id,
          email: user.email,
          clubId: user.clubId,
        });
        return res.status(500).json({
          message: 'User club association error. Please contact support.',
        });
      }

      console.log('[LOGIN SUCCESS]', {
        userId: user.id,
        email: user.email,
        clubId: user.clubId,
        clubName: verifiedClub.name,
        role: user.role,
      });

      res.json({
        token,
        user: {
          accountType: 'club',
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isPresident: user.isPresident,
          clubId: user.clubId,
          permissions,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  });

  // ============================================================
  // INSTITUTION MODE ROUTES
  // ============================================================

  app.post('/api/institution/create', async (req, res) => {
    try {
      const {
        institutionName,
        institutionType,
        adminName,
        adminEmail,
        password,
        phoneNumber,
      } = req.body as {
        institutionName?: string;
        institutionType?: string;
        adminName?: string;
        adminEmail?: string;
        password?: string;
        phoneNumber?: string;
      };

      if (!institutionName || !institutionType || !adminName || !adminEmail || !password) {
        return res.status(400).json({ message: 'All required fields must be provided' });
      }

      if (!ALLOWED_INSTITUTION_ROLES.includes("Institution Admin")) {
        return res.status(500).json({ message: 'Institution roles misconfigured' });
      }

      const existingInstitutionUser = await storage.getInstitutionUserByEmail(adminEmail);
      if (existingInstitutionUser) {
        return res.status(400).json({ message: 'Admin email already registered' });
      }

      let institutionCode = generateInstitutionCode();
      while (await storage.getInstitutionByCode(institutionCode)) {
        institutionCode = generateInstitutionCode();
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const institution = await storage.createInstitution({
        name: institutionName,
        type: institutionType,
        code: institutionCode,
        phone: phoneNumber || null,
        adminEmail,
      } as InsertInstitution);

      const permissions = getInstitutionPermissions('Institution Admin');

      const adminUser = await storage.createInstitutionUser({
        institutionId: institution.id,
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        phone: phoneNumber || null,
        role: 'Institution Admin',
        department: null,
        permissions,
        status: 'active',
      } as InsertInstitutionUser);

      const token = jwt.sign({ userId: adminUser.id, scope: 'institution' }, JWT_SECRET, { expiresIn: '30d' });

      res.status(201).json({
        token,
        institution,
        user: {
          accountType: 'institution',
          ...sanitizeInstitutionUser(adminUser),
        },
      });
    } catch (error: any) {
      console.error('Institution create error:', error);
      res.status(500).json({ message: 'Failed to onboard institution' });
    }
  });

  app.post('/api/auth/institution/login', async (req, res) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const institutionUser = await storage.getInstitutionUserByEmail(email);
      if (!institutionUser || institutionUser.status !== 'active') {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, institutionUser.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: institutionUser.id, scope: 'institution' }, JWT_SECRET, { expiresIn: '30d' });
      const permissions = getInstitutionPermissions(institutionUser.role);

      res.json({
        token,
        user: {
          accountType: 'institution',
          ...sanitizeInstitutionUser(institutionUser),
          permissions,
        },
      });
    } catch (error: any) {
      console.error('Institution login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  });

  app.post(
    '/api/institution/admin/register',
    authenticateInstitutionToken,
    requireInstitutionRole(['Institution Admin']),
    async (req: InstitutionAuthRequest, res) => {
      try {
        const { name, email, password, phone, role, department } = req.body as {
          name?: string;
          email?: string;
          password?: string;
          phone?: string;
          role?: string;
          department?: string | null;
        };

        if (!name || !email || !password || !role) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        if (!ALLOWED_INSTITUTION_ROLES.includes(role as (typeof ALLOWED_INSTITUTION_ROLES)[number])) {
          return res.status(400).json({ message: 'Invalid role selected' });
        }

        if (role === 'Department Head' && (!department || department.trim() === '')) {
          return res.status(400).json({ message: 'Department is required for Department Heads' });
        }

        const existing = await storage.getInstitutionUserByEmail(email);
        if (existing) {
          return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const permissions = getInstitutionPermissions(role);

        const newUser = await storage.createInstitutionUser({
          institutionId: req.institutionUser!.institutionId,
          name,
          email,
          password: hashedPassword,
          phone: phone || null,
          role,
          department: department || null,
          permissions,
          status: 'active',
        } as InsertInstitutionUser);

        res.status(201).json({ user: sanitizeInstitutionUser(newUser) });
      } catch (error: any) {
        console.error('Institution admin register error:', error);
        res.status(500).json({ message: 'Failed to create institution user' });
      }
    },
  );

  app.post(
    '/api/institution/club/create',
    authenticateInstitutionToken,
    requireInstitutionRole(['Institution Admin']),
    async (req: InstitutionAuthRequest, res) => {
      try {
        const {
          clubName,
          department,
          logo,
          description,
          presidentName,
          presidentEmail,
          presidentPhone,
          enrollmentNumber,
          presidentPassword,
        } = req.body as {
          clubName?: string;
          department?: string | null;
          logo?: string | null;
          description?: string | null;
          presidentName?: string;
          presidentEmail?: string;
          presidentPhone?: string | null;
          enrollmentNumber?: string | null;
          presidentPassword?: string | null;
        };

        if (!clubName) {
          return res.status(400).json({ message: 'Club name is required' });
        }

        const institution = await storage.getInstitution(req.institutionUser!.institutionId);
        if (!institution) {
          return res.status(404).json({ message: 'Institution not found' });
        }

        // Only validate president email if provided
        if (presidentEmail) {
          const existingPresident = await storage.getUserByEmail(presidentEmail);
          if (existingPresident) {
            return res.status(400).json({ message: 'President email already in use' });
          }
        }

        let clubCode = generateClubCode();
        while (await storage.getClubByCode(clubCode)) {
          clubCode = generateClubCode();
        }

        // Setup president password if president is being created
        let passwordToUse: string | null = null;
        let hashedPassword: string | null = null;

        if (presidentEmail) {
          passwordToUse = presidentPassword && presidentPassword.trim() !== ''
            ? presidentPassword
            : generateTemporaryPassword();
          hashedPassword = await bcrypt.hash(passwordToUse, 10);
        }

        const newClub = await storage.createClub({
          name: clubName,
          collegeName: institution.name,
          logoUrl: logo || null,
          description: description || null,
          clubCode,
          institutionId: req.institutionUser!.institutionId,
          department: department || null,
          presidentPassword: passwordToUse ? encryptPassword(passwordToUse) : null,
        } as InsertClub);

        let presidentUser = null;
        let inviteLink = null;

        if (presidentName && presidentEmail && hashedPassword) {
          presidentUser = await storage.createUser({
            clubId: newClub.id,
            name: presidentName,
            email: presidentEmail,
            password: hashedPassword,
            phone: presidentPhone || null,
            idNumber: enrollmentNumber || null,
            linkedin: null,
            portfolio: null,
            role: 'President',
            roleId: null,
            isPresident: true,
            isApproved: true,
            canLogin: true,
          });

          inviteLink = `${APP_BASE_URL}/login?email=${encodeURIComponent(presidentEmail)}`;
          emitPresidentInviteLog(presidentEmail, inviteLink, passwordToUse!);
        }

        res.status(201).json({
          club: newClub,
          president: presidentUser ? sanitizeUser(presidentUser) : null,
          invite: inviteLink ? {
            link: inviteLink,
            temporaryPassword: passwordToUse,
          } : null,
        });
      } catch (error: any) {
        console.error('Institution club create error:', error);
        res.status(500).json({ message: 'Failed to create club' });
      }
    },
  );

  app.post(
    '/api/institution/club/assign-president',
    authenticateInstitutionToken,
    requireInstitutionRole(['Institution Admin']),
    async (req: InstitutionAuthRequest, res) => {
      try {
        const { clubId, presidentName, presidentEmail, presidentPhone, enrollmentNumber, presidentPassword } = req.body as {
          clubId?: string;
          presidentName?: string;
          presidentEmail?: string;
          presidentPhone?: string | null;
          enrollmentNumber?: string | null;
          presidentPassword?: string | null;
        };

        if (!clubId || !presidentName || !presidentEmail) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        const club = await storage.getClub(clubId);
        if (!club || club.institutionId !== req.institutionUser!.institutionId) {
          return res.status(404).json({ message: 'Club not found for this institution' });
        }

        const clubMembers = await storage.getUsersByClub(club.id);
        const existingPresident = clubMembers.find((member) => member.isPresident);

        if (existingPresident) {
          await storage.updateUser(existingPresident.id, {
            isPresident: false,
            role: 'Member',
          });
        }

        const passwordToUse = presidentPassword && presidentPassword.trim() !== ''
          ? presidentPassword
          : generateTemporaryPassword();
        const hashedPassword = await bcrypt.hash(passwordToUse, 10);

        // Update club with password for admin viewing
        await storage.updateClub(club.id, {
          presidentPassword: passwordToUse ? encryptPassword(passwordToUse) : null,
        } as Partial<InsertClub>);

        const existingUser = await storage.getUserByEmail(presidentEmail);
        let presidentUser: User;

        if (existingUser && existingUser.clubId === club.id) {
          presidentUser = (await storage.updateUser(existingUser.id, {
            name: presidentName,
            phone: presidentPhone || existingUser.phone,
            idNumber: enrollmentNumber || existingUser.idNumber,
            isPresident: true,
            role: 'President',
            canLogin: true,
            password: hashedPassword,
          }))!;
        } else if (existingUser) {
          return res.status(400).json({ message: 'This email is already associated with another club' });
        } else {
          presidentUser = await storage.createUser({
            clubId: club.id,
            name: presidentName,
            email: presidentEmail,
            password: hashedPassword,
            phone: presidentPhone || null,
            idNumber: enrollmentNumber || null,
            linkedin: null,
            portfolio: null,
            role: 'President',
            roleId: null,
            isPresident: true,
            isApproved: true,
            canLogin: true,
          });
        }

        const inviteLink = `${APP_BASE_URL}/login?email=${encodeURIComponent(presidentEmail)}`;
        emitPresidentInviteLog(presidentEmail, inviteLink, passwordToUse);

        res.json({
          president: sanitizeUser(presidentUser),
          invite: {
            link: inviteLink,
            temporaryPassword: passwordToUse,
          },
        });
      } catch (error: any) {
        console.error('Assign president error:', error);
        res.status(500).json({ message: 'Failed to assign president' });
      }
    },
  );

  app.get('/api/institution/dashboard', authenticateInstitutionToken, async (req: InstitutionAuthRequest, res) => {
    try {
      const data = await getScopedInstitutionData(req);
      const now = new Date();

      const totalClubs = data.clubs.length;
      const totalMembers = data.users.length;
      const totalCoreMembers = data.users.filter((user) => user.canLogin && !user.isPresident).length;
      const totalEvents = data.events.length;
      const eventsThisMonth = data.events.filter((event) => {
        const date = new Date(event.date as unknown as string);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length;
      const upcomingEvents = data.events.filter(
        (event) => new Date(event.date as unknown as string) > now,
      ).length;

      const assignedBudget = data.events.reduce((sum, event) => sum + toNumber(event.budget), 0);
      const spentBudget = data.financeEntries
        .filter((entry) => entry.type === 'expense' && entry.status === 'Approved')
        .reduce((sum, entry) => sum + toNumber(entry.amount), 0);
      const pendingBudget = data.financeEntries
        .filter((entry) => entry.status === 'Pending')
        .reduce((sum, entry) => sum + toNumber(entry.amount), 0);

      const totalTasks = data.tasks.length;
      const completedTasks = data.tasks.filter((task) => task.status === 'Done').length;
      const taskCompletionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const approvals = {
        pending: data.pendingMembers.length,
        approved: totalMembers,
      };

      const eventsPerMonth = buildEventsPerMonth(data.events);
      const taskBreakdown = buildTaskBreakdown(data.tasks);
      const heatmap = buildActivityHeatmap(data.events, data.tasks);
      const budgetUsage = buildClubBudgetUsage(data.clubs, data.events, data.financeEntries);

      const clubPerformance = await Promise.all(
        data.clubs.map(async (club) => {
          const score = calculateClubPerformanceScore(club.id, data.events, data.tasks, data.users, data.financeEntries);
          await storage.updateClub(club.id, { performanceIndex: score.toString() } as Partial<InsertClub>);
          const president = data.users.find((user) => user.clubId === club.id && user.isPresident);
          const vicePresident = data.users.find(
            (user) => user.clubId === club.id && user.role === 'Vice-President',
          );
          const members = data.users.filter((user) => user.clubId === club.id);
          const clubEvents = data.events.filter((event) => event.clubId === club.id);
          return {
            clubId: club.id,
            clubName: club.name,
            department: club.department,
            performanceIndex: score,
            president: president ? sanitizeUser(president) : null,
            vicePresident: vicePresident ? sanitizeUser(vicePresident) : null,
            members: members.length,
            events: clubEvents.length,
          };
        }),
      );

      const financeCategories: FinanceCategoryTotals = { Operations: 0, PR: 0, Logistics: 0, Marketing: 0 };
      data.financeEntries.forEach((entry) => {
        if (entry.type !== 'expense') return;
        const category = categorizeFinanceEntry(entry);
        financeCategories[category] += toNumber(entry.amount);
      });

      res.json({
        metrics: {
          totalClubs,
          totalMembers,
          totalCoreMembers,
          totalEvents,
          eventsThisMonth,
          upcomingEvents,
          taskCompletionRate,
          approvals,
        },
        budget: {
          assigned: Number(assignedBudget.toFixed(2)),
          spent: Number(spentBudget.toFixed(2)),
          pendingApproval: Number(pendingBudget.toFixed(2)),
          categories: financeCategories,
        },
        tasks: {
          breakdown: taskBreakdown,
          completed: completedTasks,
          total: totalTasks,
        },
        charts: {
          eventsPerMonth,
          budgetUsage,
          heatmap,
        },
        clubPerformance: clubPerformance.sort((a, b) => b.performanceIndex - a.performanceIndex),
      });
    } catch (error: any) {
      console.error('Institution dashboard error:', error);
      res.status(500).json({ message: 'Failed to load institution dashboard' });
    }
  });

  app.get('/api/institution/clubs', authenticateInstitutionToken, async (req: InstitutionAuthRequest, res) => {
    try {
      const data = await getScopedInstitutionData(req);
      const clubs = data.clubs.map((club) => {
        const clubMembers = data.users.filter((user) => user.clubId === club.id);
        const president = clubMembers.find((member) => member.isPresident);
        const vicePresident = clubMembers.find((member) => member.role === 'Vice-President');
        const totalEvents = data.events.filter((event) => event.clubId === club.id).length;
        const performanceIndex = parseFloat(String(club.performanceIndex ?? 0));
        return {
          id: club.id,
          name: club.name,
          department: club.department,
          logoUrl: club.logoUrl,
          president: president ? sanitizeUser(president) : null,
          vicePresident: vicePresident ? sanitizeUser(vicePresident) : null,
          totalMembers: clubMembers.length,
          totalEvents,
          performanceIndex,
          presidentPassword: club.presidentPassword ? decryptPassword(club.presidentPassword) : null,
          quickActions: {
            report: `/api/institution/report/club/${club.id}`,
            events: `/institution/clubs/${club.id}/events`,
            members: `/institution/clubs/${club.id}/members`,
          },
        };
      });

      res.json({ clubs });
    } catch (error: any) {
      console.error('Institution clubs error:', error);
      res.status(500).json({ message: 'Failed to load club directory' });
    }
  });

  app.get('/api/institution/club/:id', authenticateInstitutionToken, async (req: InstitutionAuthRequest, res) => {
    try {
      const clubId = req.params.id;
      const data = await getScopedInstitutionData(req);
      const club = data.clubs.find((c) => c.id === clubId);
      if (!club) {
        return res.status(404).json({ message: 'Club not found in your scope' });
      }

      const members = data.users.filter((user) => user.clubId === club.id);
      const president = members.find((member) => member.isPresident);
      const events = data.events.filter((event) => event.clubId === club.id);
      const tasks = data.tasks.filter((task) => task.clubId === club.id);
      const financeEntries = data.financeEntries.filter((entry) => entry.clubId === club.id);

      res.json({
        club: {
          ...club,
          presidentPassword: club.presidentPassword ? decryptPassword(club.presidentPassword) : null,
        },
        president: president ? {
          ...sanitizeUser(president),
          id: president.id,
        } : null,
        members: sanitizeUsers(members),
        events,
        tasks,
        finance: financeEntries,
      });
    } catch (error: any) {
      console.error('Institution club detail error:', error);
      res.status(500).json({ message: 'Failed to load club details' });
    }
  });

  // Update club (Institution Admin only)
  app.patch(
    '/api/institution/club/:id',
    authenticateInstitutionToken,
    requireInstitutionRole(['Institution Admin']),
    async (req: InstitutionAuthRequest, res) => {
      try {
        const clubId = req.params.id;
        const { name, department, logoUrl, description } = req.body as {
          name?: string;
          department?: string | null;
          logoUrl?: string | null;
          description?: string | null;
        };

        const club = await storage.getClub(clubId);
        if (!club || club.institutionId !== req.institutionUser!.institutionId) {
          return res.status(404).json({ message: 'Club not found' });
        }

        const updated = await storage.updateClub(clubId, {
          name,
          department: department || null,
          logoUrl: logoUrl || null,
          description: description || null,
        } as Partial<InsertClub>);

        if (!updated) {
          return res.status(404).json({ message: 'Club not found' });
        }

        res.json(updated);
      } catch (error: any) {
        console.error('Update institution club error:', error);
        res.status(500).json({ message: 'Failed to update club' });
      }
    },
  );

  // Delete club (Institution Admin only)
  app.delete(
    '/api/institution/club/:id',
    authenticateInstitutionToken,
    requireInstitutionRole(['Institution Admin']),
    async (req: InstitutionAuthRequest, res) => {
      try {
        const clubId = req.params.id;

        const club = await storage.getClub(clubId);
        if (!club || club.institutionId !== req.institutionUser!.institutionId) {
          return res.status(404).json({ message: 'Club not found' });
        }

        await storage.deleteClub(clubId);
        res.json({ message: 'Club deleted successfully' });
      } catch (error: any) {
        console.error('Delete institution club error:', error);
        res.status(500).json({ message: 'Failed to delete club' });
      }
    },
  );

  app.get('/api/institution/events', authenticateInstitutionToken, async (req: InstitutionAuthRequest, res) => {
    try {
      const { status, clubId, department, month, view } = req.query as Record<string, string | undefined>;
      const data = await getScopedInstitutionData(req);
      const monthFilter = month ? new Date(`${month}-01`) : null;

      const filteredEvents = data.events
        .filter((event) => {
          if (clubId && event.clubId !== clubId) return false;
          if (status && event.status !== status) return false;
          if (department) {
            const club = data.clubs.find((c) => c.id === event.clubId);
            if (!club || (club.department || '').toLowerCase() !== department.toLowerCase()) {
              return false;
            }
          }
          if (monthFilter) {
            const eventDate = new Date(event.date as unknown as string);
            if (
              eventDate.getMonth() !== monthFilter.getMonth() ||
              eventDate.getFullYear() !== monthFilter.getFullYear()
            ) {
              return false;
            }
          }
          if (view === 'upcoming') {
            return new Date(event.date as unknown as string) > new Date();
          }
          if (view === 'in-progress') {
            return event.status === 'Ongoing';
          }
          if (view === 'completed') {
            return event.status === 'Completed';
          }
          return true;
        })
        .map((event) => {
          const club = data.clubs.find((c) => c.id === event.clubId);
          const assigned = event.assignedToId
            ? sanitizeUser(data.users.find((user) => user.id === event.assignedToId) || null)
            : null;
          return {
            ...event,
            clubName: club?.name,
            department: club?.department,
            assignedTo: assigned,
          };
        });

      res.json({ events: filteredEvents });
    } catch (error: any) {
      console.error('Institution events error:', error);
      res.status(500).json({ message: 'Failed to load cross-club events' });
    }
  });

  app.get('/api/institution/finance', authenticateInstitutionToken, async (req: InstitutionAuthRequest, res) => {
    try {
      const data = await getScopedInstitutionData(req);
      const clubSpend = data.clubs.map((club) => {
        const entries = data.financeEntries.filter((entry) => entry.clubId === club.id && entry.type === 'expense');
        const total = entries.reduce((sum, entry) => sum + toNumber(entry.amount), 0);
        return {
          clubId: club.id,
          clubName: club.name,
          department: club.department,
          totalSpend: Number(total.toFixed(2)),
        };
      });

      const monthlySpend: Record<string, number> = {};
      data.financeEntries.forEach((entry) => {
        if (entry.type !== 'expense') return;
        const date = new Date(entry.createdAt as unknown as string);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlySpend[key] = (monthlySpend[key] || 0) + toNumber(entry.amount);
      });

      const pendingApprovals = data.financeEntries.filter((entry) => entry.status === 'Pending').length;
      const categories: FinanceCategoryTotals = { Operations: 0, PR: 0, Logistics: 0, Marketing: 0 };
      data.financeEntries.forEach((entry) => {
        if (entry.type === 'expense') {
          const category = categorizeFinanceEntry(entry);
          categories[category] += toNumber(entry.amount);
        }
      });

      const recentTransactions = data.financeEntries
        .sort(
          (a, b) =>
            new Date(b.createdAt as unknown as string).getTime() -
            new Date(a.createdAt as unknown as string).getTime(),
        )
        .slice(0, 20);

      res.json({
        metrics: {
          totalSpent: Number(
            data.financeEntries
              .filter((entry) => entry.type === 'expense')
              .reduce((sum, entry) => sum + toNumber(entry.amount), 0)
              .toFixed(2),
          ),
          pendingApprovals,
        },
        clubSpend,
        monthlySpend,
        categories,
        recentTransactions,
      });
    } catch (error: any) {
      console.error('Institution finance error:', error);
      res.status(500).json({ message: 'Failed to load finance data' });
    }
  });

  app.get('/api/institution/members', authenticateInstitutionToken, async (req: InstitutionAuthRequest, res) => {
    try {
      const data = await getScopedInstitutionData(req);

      // Combine approved users and pending members for complete member list
      // Normal members are users with canLogin: false (approved but not core)
      // Pending members are those awaiting approval
      const allMembers = [
        ...data.users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isPresident: user.isPresident,
          canLogin: user.canLogin,
          clubId: user.clubId,
          isPending: false,
        })),
        ...data.pendingMembers.map((pending) => ({
          id: pending.id,
          name: pending.name,
          email: pending.email,
          role: 'Member',
          isPresident: false,
          canLogin: false,
          clubId: pending.clubId,
          isPending: true,
        })),
      ];

      const coreMembers = allMembers.filter((member) => member.canLogin);
      const generalMembers = allMembers.filter((member) => !member.canLogin);

      // Club-wise members sorted by role: President, VP, Core, Normal, Pending
      const clubMembers: Array<{
        clubId: string;
        clubName: string;
        department: string | null;
        members: Array<{
          id: string;
          name: string;
          email: string;
          role: string;
          isPresident: boolean;
          canLogin: boolean;
          isPending?: boolean;
        }>;
      }> = [];

      // Ensure ALL clubs are included, even if they have no members
      data.clubs.forEach((club) => {
        const clubUsers = allMembers.filter((u) => u.clubId === club.id);

        // Sort members: President first, then VP, then core members (canLogin), then normal members, then pending
        const sortedMembers = clubUsers.sort((a, b) => {
          if (a.isPresident && !b.isPresident) return -1;
          if (!a.isPresident && b.isPresident) return 1;
          if (a.role === 'Vice-President' && b.role !== 'Vice-President') return -1;
          if (a.role !== 'Vice-President' && b.role === 'Vice-President') return 1;
          if (a.canLogin && !b.canLogin) return -1;
          if (!a.canLogin && b.canLogin) return 1;
          if (!a.isPending && b.isPending) return -1;
          if (a.isPending && !b.isPending) return 1;
          return a.name.localeCompare(b.name);
        });

        clubMembers.push({
          clubId: club.id,
          clubName: club.name,
          department: club.department,
          members: sortedMembers.map((member) => ({
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role,
            isPresident: member.isPresident,
            canLogin: member.canLogin,
            isPending: member.isPending,
          })),
        });
      });

      // Club-wise teams
      const clubTeams: Array<{
        clubId: string;
        clubName: string;
        department: string | null;
        teams: Array<{
          id: string;
          name: string;
          description: string | null;
          captainName: string | null;
          memberCount: number;
        }>;
      }> = [];

      for (const club of data.clubs) {
        const teams = await storage.getTeamsByClub(club.id);
        const teamMembers = await Promise.all(
          teams.map(async (team) => {
            const members = await storage.getTeamMembersWithUsers(team.id);
            const captain = team.captainId
              ? members.find((m) => m.user.id === team.captainId)?.user
              : null;
            return {
              id: team.id,
              name: team.name,
              description: team.description,
              captainName: captain?.name || null,
              memberCount: members.length,
            };
          }),
        );

        clubTeams.push({
          clubId: club.id,
          clubName: club.name,
          department: club.department,
          teams: teamMembers,
        });
      }

      // Ensure all clubs are in clubMembers array (even with 0 members)
      const allClubIds = new Set(clubMembers.map((c) => c.clubId));
      data.clubs.forEach((club) => {
        if (!allClubIds.has(club.id)) {
          clubMembers.push({
            clubId: club.id,
            clubName: club.name,
            department: club.department,
            members: [],
          });
        }
      });

      // Ensure all clubs are in clubTeams array (even with 0 teams)
      const allTeamClubIds = new Set(clubTeams.map((c) => c.clubId));
      data.clubs.forEach((club) => {
        if (!allTeamClubIds.has(club.id)) {
          clubTeams.push({
            clubId: club.id,
            clubName: club.name,
            department: club.department,
            teams: [],
          });
        }
      });

      res.json({
        totals: {
          members: allMembers.length,
          coreMembers: coreMembers.length,
          generalMembers: generalMembers.length,
        },
        clubMembers: clubMembers || [],
        clubTeams: clubTeams || [],
      });
    } catch (error: any) {
      console.error('Institution members error:', error);
      res.status(500).json({ message: 'Failed to load member insights' });
    }
  });

  app.get('/api/institution/analytics', authenticateInstitutionToken, async (req: InstitutionAuthRequest, res) => {
    try {
      const data = await getScopedInstitutionData(req);
      const clubHealth = data.clubs.map((club) => {
        const score = calculateClubPerformanceScore(club.id, data.events, data.tasks, data.users, data.financeEntries);
        const totalTasks = data.tasks.filter((task) => task.clubId === club.id).length || 1;
        const completedTasks = data.tasks.filter((task) => task.clubId === club.id && task.status === 'Done').length;
        const taskEfficiency = Math.round((completedTasks / totalTasks) * 100);
        const clubEvents = data.events.filter((event) => event.clubId === club.id);
        const completedEvents = clubEvents.filter((event) => event.status === 'Completed').length;
        const eventSuccessIndex = clubEvents.length ? Math.round((completedEvents / clubEvents.length) * 100) : 0;

        return {
          clubId: club.id,
          clubName: club.name,
          department: club.department,
          performanceScore: score,
          taskEfficiency,
          eventSuccessIndex,
        };
      });

      const totalTasks = data.tasks.length || 1;
      const completedTasks = data.tasks.filter((task) => task.status === 'Done').length;
      const taskEfficiency = Math.round((completedTasks / totalTasks) * 100);
      const assignedBudget = data.events.reduce((sum, event) => sum + toNumber(event.budget), 0) || 1;
      const spentBudget = data.financeEntries
        .filter((entry) => entry.type === 'expense')
        .reduce((sum, entry) => sum + toNumber(entry.amount), 0);
      const budgetEffectiveness = Math.min(100, Math.round((spentBudget / assignedBudget) * 100));
      const monthlyActivity = buildEventsPerMonth(data.events, 12);
      const completedEvents = data.events.filter((event) => event.status === 'Completed').length;
      const eventSuccessIndex = data.events.length ? Math.round((completedEvents / data.events.length) * 100) : 0;

      res.json({
        clubHealth: clubHealth.sort((a, b) => b.performanceScore - a.performanceScore),
        topClubs: clubHealth.sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 5),
        taskEfficiency,
        budgetEffectiveness,
        monthlyActivity,
        eventSuccessIndex,
      });
    } catch (error: any) {
      console.error('Institution analytics error:', error);
      res.status(500).json({ message: 'Failed to load analytics' });
    }
  });

  app.get('/api/institution/heatmap', authenticateInstitutionToken, async (req: InstitutionAuthRequest, res) => {
    try {
      const data = await getScopedInstitutionData(req);
      const heatmap = buildActivityHeatmap(data.events, data.tasks);
      res.json({ heatmap });
    } catch (error: any) {
      console.error('Institution heatmap error:', error);
      res.status(500).json({ message: 'Failed to load heatmap data' });
    }
  });

  app.get(
    '/api/institution/report/club/:id',
    authenticateInstitutionToken,
    requireInstitutionRole(['Institution Admin']),
    async (req: InstitutionAuthRequest, res) => {
      try {
        const data = await getScopedInstitutionData(req);
        const club = data.clubs.find((c) => c.id === req.params.id);
        if (!club) {
          return res.status(404).json({ message: 'Club not found' });
        }

        const doc = createPdfResponse(res, `club-report-${club.id}.pdf`);
        doc.fontSize(20).text('Club Performance Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Club: ${club.name}`);
        doc.text(`Department: ${club.department || 'N/A'}`);
        doc.text(`Institution: ${data.institution.name}`);
        doc.moveDown();
        const members = data.users.filter((user) => user.clubId === club.id);
        doc.text(`Total Members: ${members.length}`);
        doc.text(`Core Council Members: ${members.filter((member) => member.canLogin).length}`);
        const events = data.events.filter((event) => event.clubId === club.id);
        doc.text(`Events Hosted: ${events.length}`);
        doc.text(`Tasks Created: ${data.tasks.filter((task) => task.clubId === club.id).length}`);
        doc.end();
      } catch (error: any) {
        console.error('Club report error:', error);
        res.status(500).json({ message: 'Failed to generate club report' });
      }
    },
  );

  app.get(
    '/api/institution/report/finance',
    authenticateInstitutionToken,
    requireInstitutionRole(['Institution Admin']),
    async (req: InstitutionAuthRequest, res) => {
      try {
        const data = await getScopedInstitutionData(req);
        const doc = createPdfResponse(res, 'finance-summary.pdf');
        doc.fontSize(20).text('Finance Summary Report', { align: 'center' }).moveDown();
        const totalIncome = data.financeEntries
          .filter((entry) => entry.type === 'income')
          .reduce((sum, entry) => sum + toNumber(entry.amount), 0);
        const totalExpense = data.financeEntries
          .filter((entry) => entry.type === 'expense')
          .reduce((sum, entry) => sum + toNumber(entry.amount), 0);
        doc.fontSize(12).text(`Total Income: ₹${totalIncome.toFixed(2)}`);
        doc.text(`Total Expense: ₹${totalExpense.toFixed(2)}`);
        doc.moveDown().text('Pending Approvals:');
        data.financeEntries
          .filter((entry) => entry.status === 'Pending')
          .slice(0, 10)
          .forEach((entry) => {
            doc.text(`• ${entry.transactionName} - ₹${toNumber(entry.amount).toFixed(2)}`);
          });
        doc.end();
      } catch (error: any) {
        console.error('Finance report error:', error);
        res.status(500).json({ message: 'Failed to generate finance report' });
      }
    },
  );

  app.get(
    '/api/institution/report/events',
    authenticateInstitutionToken,
    requireInstitutionRole(['Institution Admin']),
    async (req: InstitutionAuthRequest, res) => {
      try {
        const data = await getScopedInstitutionData(req);
        const doc = createPdfResponse(res, 'institution-events-report.pdf');
        doc.fontSize(20).text('Institution Events Report', { align: 'center' }).moveDown();
        data.events
          .sort((a, b) => new Date(b.date as unknown as string).getTime() - new Date(a.date as unknown as string).getTime())
          .slice(0, 25)
          .forEach((event) => {
            const club = data.clubs.find((c) => c.id === event.clubId);
            doc.fontSize(12).text(`${event.title} (${event.status})`);
            doc.text(`Club: ${club?.name || 'N/A'} • Date: ${new Date(event.date as unknown as string).toDateString()}`);
            doc.moveDown(0.5);
          });
        doc.end();
      } catch (error: any) {
        console.error('Events report error:', error);
        res.status(500).json({ message: 'Failed to generate events report' });
      }
    },
  );

  app.get(
    '/api/institution/report/members',
    authenticateInstitutionToken,
    requireInstitutionRole(['Institution Admin']),
    async (req: InstitutionAuthRequest, res) => {
      try {
        const data = await getScopedInstitutionData(req);
        const header = ['Member Name', 'Email', 'Club', 'Role', 'Core Member'];
        const rows = data.users.map((user) => {
          const club = data.clubs.find((c) => c.id === user.clubId);
          return [
            `"${user.name}"`,
            user.email,
            `"${club?.name || ''}"`,
            user.role,
            user.canLogin ? 'Yes' : 'No',
          ].join(',');
        });
        const csv = [header.join(','), ...rows].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="member-summary.csv"');
        res.send(csv);
      } catch (error: any) {
        console.error('Member report error:', error);
        res.status(500).json({ message: 'Failed to generate member report' });
      }
    },
  );

  app.get(
    '/api/institution/report/monthly',
    authenticateInstitutionToken,
    requireInstitutionRole(['Institution Admin']),
    async (req: InstitutionAuthRequest, res) => {
      try {
        const data = await getScopedInstitutionData(req);
        const archive = archiver('zip');
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="institution-monthly-report.zip"');
        archive.pipe(res);

        const summary = [
          `Institution: ${data.institution.name}`,
          `Generated: ${new Date().toISOString()}`,
          `Total Clubs: ${data.clubs.length}`,
          `Total Members: ${data.users.length}`,
          `Total Events: ${data.events.length}`,
        ].join('\n');
        archive.append(summary, { name: 'summary.txt' });

        const membersCsv = [
          ['Member Name', 'Email', 'Club', 'Role'].join(','),
          ...data.users.map((user) => {
            const club = data.clubs.find((c) => c.id === user.clubId);
            return `"${user.name}",${user.email},"${club?.name || ''}",${user.role}`;
          }),
        ].join('\n');
        archive.append(membersCsv, { name: 'members.csv' });

        const financeCsv = [
          ['Transaction', 'Type', 'Amount', 'Status', 'Club'].join(','),
          ...data.financeEntries.map((entry) => {
            const club = data.clubs.find((c) => c.id === entry.clubId);
            return `"${entry.transactionName}",${entry.type},${toNumber(entry.amount)},${entry.status},"${club?.name || ''}"`;
          }),
        ].join('\n');
        archive.append(financeCsv, { name: 'finance.csv' });

        await archive.finalize();
      } catch (error: any) {
        console.error('Monthly report error:', error);
        res.status(500).json({ message: 'Failed to generate monthly report' });
      }
    },
  );

  // ============================================================
  // CLUB ROUTES
  // ============================================================

  // Verify club exists (for apply page)
  app.get('/api/clubs/verify/:clubCode', async (req, res) => {
    try {
      const { clubCode } = req.params;
      const club = await storage.getClubByCode(clubCode);

      if (!club) {
        return res.status(404).json({ message: 'Club not found' });
      }

      res.json({
        name: club.name,
        collegeName: club.collegeName,
        description: club.description,
      });
    } catch (error: any) {
      console.error('Verify club error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get club info (authenticated)
  app.get('/api/club', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const clubId = req.user!.clubId;
      console.log('[GET CLUB]', { clubId, userId: req.user!.id, email: req.user!.email });

      const club = await storage.getClub(clubId);
      if (!club) {
        console.error('[GET CLUB ERROR] Club not found:', { clubId, userId: req.user!.id });
        return res.status(404).json({ message: 'Club not found' });
      }

      console.log('[GET CLUB SUCCESS]', { clubId, clubName: club.name });
      res.json(club);
    } catch (error: any) {
      console.error('[GET CLUB ERROR]', {
        clubId: req.user!.clubId,
        userId: req.user!.id,
        error: error.message,
      });
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get current user permissions
  app.get('/api/user/permissions', authenticateToken, async (req: AuthRequest, res) => {
    try {
      res.json({ permissions: req.user!.permissions });
    } catch (error: any) {
      console.error('Get permissions error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Update club (requires manage_settings permission)
  app.patch('/api/club', authenticateToken, requirePermission('manage_settings'), async (req: AuthRequest, res) => {
    try {

      const { name, logoUrl, description } = req.body;
      const updated = await storage.updateClub(req.user!.clubId, {
        name,
        logoUrl,
        description,
      });

      res.json(updated);
    } catch (error: any) {
      console.error('Update club error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Regenerate club code (requires manage_settings permission)
  app.post('/api/club/regenerate-code', authenticateToken, requirePermission('manage_settings'), async (req: AuthRequest, res) => {
    try {

      let clubCode = generateClubCode();
      while (await storage.getClubByCode(clubCode)) {
        clubCode = generateClubCode();
      }

      const updated = await storage.updateClub(req.user!.clubId, { clubCode });
      res.json(updated);
    } catch (error: any) {
      console.error('Regenerate code error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Delete club (president only)
  app.delete('/api/club', authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user!.isPresident) {
        return res.status(403).json({ message: 'Only president can delete club' });
      }

      await storage.deleteClub(req.user!.clubId);
      res.json({ message: 'Club deleted successfully' });
    } catch (error: any) {
      console.error('Delete club error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // ============================================================
  // MEMBER ROUTES
  // ============================================================

  // Member application
  app.post('/api/members/apply', async (req, res) => {
    try {
      const { clubCode, name, email, password, phone, idNumber, linkedin, portfolio } = req.body;

      const club = await storage.getClubByCode(clubCode);
      if (!club) {
        return res.status(404).json({ message: 'Invalid club code' });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      await storage.createPendingMember({
        clubId: club.id,
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        idNumber: idNumber || null,
        linkedin: linkedin || null,
        portfolio: portfolio || null,
      });

      res.json({ message: 'Application submitted successfully' });
    } catch (error: any) {
      console.error('Apply error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get pending members (requires view_approvals permission)
  app.get('/api/members/pending', authenticateToken, requirePermission('view_approvals'), async (req: AuthRequest, res) => {
    try {
      const pending = await storage.getPendingMembersByClub(req.user!.clubId);
      res.json(pending);
    } catch (error: any) {
      console.error('Get pending members error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Approve member (requires view_approvals permission)
  app.post('/api/members/approve/:id', authenticateToken, requirePermission('view_approvals'), async (req: AuthRequest, res) => {
    try {

      const { role } = req.body;
      const pendingMember = await storage.getPendingMember(req.params.id);

      if (!pendingMember || pendingMember.clubId !== req.user!.clubId) {
        return res.status(404).json({ message: 'Applicant not found' });
      }

      // Create user
      const canLogin = role === 'Council Head';
      await storage.createUser({
        clubId: pendingMember.clubId,
        name: pendingMember.name,
        email: pendingMember.email,
        password: pendingMember.password,
        phone: pendingMember.phone,
        idNumber: pendingMember.idNumber,
        linkedin: pendingMember.linkedin,
        portfolio: pendingMember.portfolio,
        role: role,
        roleId: null,
        isPresident: false,
        isApproved: true,
        canLogin,
      });

      // Remove from pending
      await storage.deletePendingMember(pendingMember.id);

      res.json({ message: 'Member approved successfully' });
    } catch (error: any) {
      console.error('Approve member error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Reject member (admin only)
  app.delete('/api/members/reject/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const isAdmin = req.user!.isPresident || req.user!.role === 'Vice-President';
      if (!isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const pendingMember = await storage.getPendingMember(req.params.id);
      if (!pendingMember || pendingMember.clubId !== req.user!.clubId) {
        return res.status(404).json({ message: 'Applicant not found' });
      }

      await storage.deletePendingMember(pendingMember.id);
      res.json({ message: 'Application rejected' });
    } catch (error: any) {
      console.error('Reject member error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get all members
  app.get('/api/members', authenticateToken, requirePermission('view_members'), async (req: AuthRequest, res) => {
    try {
      const members = await storage.getUsersByClub(req.user!.clubId);
      res.json(members);
    } catch (error: any) {
      console.error('Get members error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/export/members', authenticateToken, requirePermission('view_members'), async (req: AuthRequest, res) => {
    try {
      const type = (req.query.type as string | undefined)?.toLowerCase();
      const members = await storage.getUsersByClub(req.user!.clubId);

      const filteredMembers =
        type === 'regular'
          ? members.filter((member) => !member.canLogin)
          : type === 'core'
            ? members.filter((member) => member.canLogin)
            : members;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Members');
      worksheet.columns = [
        { header: '#', key: 'index', width: 6 },
        { header: 'Name', key: 'name', width: 28 },
        { header: 'Email', key: 'email', width: 32 },
        { header: 'Role', key: 'role', width: 20 },
        { header: 'Phone', key: 'phone', width: 18 },
        { header: 'Can Login', key: 'canLogin', width: 12 },
        { header: 'Joined On', key: 'joinedOn', width: 18 },
      ];

      filteredMembers.forEach((member, index) => {
        worksheet.addRow({
          index: index + 1,
          name: member.name,
          email: member.email,
          role: member.role ?? '',
          phone: member.phone ?? '',
          canLogin: member.canLogin ? 'Yes' : 'No',
          joinedOn: formatDateDisplay(member.createdAt),
        });
      });

      worksheet.getRow(1).font = { bold: true };

      const filename = type === 'regular'
        ? `regular-members-${fileDateStamp()}.xlsx`
        : type === 'core'
          ? `core-members-${fileDateStamp()}.xlsx`
          : `club-members-${fileDateStamp()}.xlsx`;

      await sendWorkbook(res, workbook, filename);
    } catch (error: any) {
      console.error('Export members error:', error);
      res.status(500).json({ message: 'Failed to export members' });
    }
  });

  // ============================================================
  // ROLE ROUTES
  // ============================================================

  app.get('/api/roles', authenticateToken, requirePermission('manage_roles'), async (req: AuthRequest, res) => {
    try {
      const roles = await storage.getRolesByClub(req.user!.clubId);
      res.json(roles);
    } catch (error: any) {
      console.error('Get roles error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/roles', authenticateToken, requirePermission('manage_roles'), async (req: AuthRequest, res) => {
    try {
      const { name, permissions } = req.body as { name?: string; permissions?: Record<string, boolean> };

      if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Role name is required' });
      }

      // Ensure all permissions are included in the permissions object
      const formattedPermissions: PermissionSet = {} as PermissionSet;
      ALL_PERMISSIONS.forEach((perm) => {
        formattedPermissions[perm] = permissions?.[perm] === true;
      });

      const role = await storage.createRole({
        clubId: req.user!.clubId,
        name: name.trim(),
        permissions: formattedPermissions,
      });

      res.json(role);
    } catch (error: any) {
      console.error('Create role error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.patch('/api/roles/:id', authenticateToken, requirePermission('manage_roles'), async (req: AuthRequest, res) => {
    try {
      const role = await storage.getRole(req.params.id);
      if (!role || role.clubId !== req.user!.clubId) {
        return res.status(404).json({ message: 'Role not found' });
      }

      const { name, permissions } = req.body as { name?: string; permissions?: Record<string, boolean> };
      const updates: Partial<{ name: string; permissions: PermissionSet }> = {};

      if (name !== undefined) {
        if (!name.trim()) {
          return res.status(400).json({ message: 'Role name cannot be empty' });
        }
        updates.name = name.trim();
      }

      if (permissions !== undefined) {
        // Ensure all permissions are included in the permissions object
        const formattedPermissions: PermissionSet = {} as PermissionSet;
        ALL_PERMISSIONS.forEach((perm) => {
          formattedPermissions[perm] = permissions[perm] === true;
        });
        updates.permissions = formattedPermissions;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No updates provided' });
      }

      const updated = await storage.updateRole(req.params.id, updates);
      res.json(updated);
    } catch (error: any) {
      console.error('Update role error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete('/api/roles/:id', authenticateToken, requirePermission('manage_roles'), async (req: AuthRequest, res) => {
    try {
      const role = await storage.getRole(req.params.id);
      if (!role || role.clubId !== req.user!.clubId) {
        return res.status(404).json({ message: 'Role not found' });
      }

      await storage.deleteRole(req.params.id);
      res.json({ message: 'Role deleted successfully' });
    } catch (error: any) {
      console.error('Delete role error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // ============================================================
  // TEAM ROUTES
  // ============================================================

  app.get('/api/teams', authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Allow viewing teams if user has manage_teams or view_members permission
      const canView = hasPermission(req.user!.permissions, 'manage_teams') || hasPermission(req.user!.permissions, 'view_members');
      if (!canView) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      const teams = await storage.getTeamsByClub(req.user!.clubId);
      const availableMembers = sanitizeUsers(await storage.getUsersByClub(req.user!.clubId));

      const teamResponses = await Promise.all(teams.map((team) => buildTeamResponse(team)));

      res.json({ teams: teamResponses, availableMembers });
    } catch (error: any) {
      console.error('Fetch teams error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/export/teams', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const canView = hasPermission(req.user!.permissions, 'manage_teams') || hasPermission(req.user!.permissions, 'view_members');
      if (!canView) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      const teams = await storage.getTeamsByClub(req.user!.clubId);
      const teamResponses = await Promise.all(teams.map((team) => buildTeamResponse(team)));

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Teams & Members');
      worksheet.columns = [
        { header: 'Team Name', key: 'teamName', width: 26 },
        { header: 'Team Description', key: 'teamDescription', width: 32 },
        { header: 'Team Leader', key: 'teamLeader', width: 24 },
        { header: 'Member Name', key: 'memberName', width: 26 },
        { header: 'Member Email', key: 'memberEmail', width: 32 },
        { header: 'Member Phone', key: 'memberPhone', width: 18 },
        { header: 'Member Role', key: 'memberRole', width: 18 },
      ];

      teamResponses.forEach((team) => {
        if (team.members.length === 0) {
          worksheet.addRow({
            teamName: team.name,
            teamDescription: team.description ?? '',
            teamLeader: team.captain ? team.captain.name : '',
            memberName: '',
            memberEmail: '',
            memberPhone: '',
            memberRole: '',
          });
          return;
        }

        team.members.forEach((member) => {
          worksheet.addRow({
            teamName: team.name,
            teamDescription: team.description ?? '',
            teamLeader: team.captain ? team.captain.name : '',
            memberName: member.name,
            memberEmail: member.email,
            memberPhone: member.phone ?? '',
            memberRole: member.memberRole ?? '',
          });
        });
      });

      worksheet.getRow(1).font = { bold: true };

      const filename = `teams-with-members-${fileDateStamp()}.xlsx`;
      await sendWorkbook(res, workbook, filename);
    } catch (error: any) {
      console.error('Export teams error:', error);
      res.status(500).json({ message: 'Failed to export teams' });
    }
  });

  app.post('/api/teams', authenticateToken, requirePermission('manage_teams'), async (req: AuthRequest, res) => {
    try {

      const {
        name,
        description,
        memberIds,
        captainId,
      } = req.body as {
        name?: string;
        description?: string | null;
        memberIds?: string[] | null;
        captainId?: string | null;
      };

      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Team name is required' });
      }

      const normalizedCaptainId =
        typeof captainId === 'string' && captainId.trim() !== '' ? captainId.trim() : null;
      const memberIdSet = new Set<string>();

      if (Array.isArray(memberIds)) {
        memberIds.forEach((id) => {
          if (typeof id === 'string' && id.trim() !== '') {
            memberIdSet.add(id.trim());
          }
        });
      }

      if (normalizedCaptainId) {
        memberIdSet.add(normalizedCaptainId);
      }

      const validatedMemberIds: string[] = [];
      for (const memberId of memberIdSet) {
        const member = await storage.getUser(memberId);
        if (!member || member.clubId !== req.user!.clubId) {
          return res.status(400).json({ message: 'Member not found in this club' });
        }
        validatedMemberIds.push(member.id);
      }

      const team = await storage.createTeam({
        clubId: req.user!.clubId,
        name: name.trim(),
        description: description ?? null,
        captainId: null,
      } as InsertTeam);

      for (const memberId of validatedMemberIds) {
        await storage.addTeamMember({
          teamId: team.id,
          userId: memberId,
          memberRole: null,
        } as InsertTeamMember);
      }

      if (normalizedCaptainId) {
        await storage.updateTeam(team.id, { captainId: normalizedCaptainId });
      }

      const updatedTeam = await storage.getTeam(team.id);
      if (!updatedTeam) {
        return res.status(500).json({ message: 'Unable to load updated team' });
      }
      const payload = await buildTeamResponse(updatedTeam);
      res.status(201).json({ team: payload });
    } catch (error: any) {
      console.error('Create team error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.patch('/api/teams/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const isAdmin = req.user!.isPresident || req.user!.role === 'Vice-President';
      if (!isAdmin) {
        return res.status(403).json({ message: 'Only President/VP can manage teams' });
      }

      const team = await storage.getTeam(req.params.id);
      if (!team || team.clubId !== req.user!.clubId) {
        return res.status(404).json({ message: 'Team not found' });
      }

      const { name, description, captainId } = req.body as {
        name?: string;
        description?: string | null;
        captainId?: string | null;
      };

      const updates: Partial<InsertTeam> = {};

      if (name !== undefined) {
        if (name.trim() === '') {
          return res.status(400).json({ message: 'Team name cannot be empty' });
        }
        updates.name = name.trim();
      }

      if (description !== undefined) {
        updates.description = description ?? null;
      }

      if (captainId !== undefined) {
        if (!captainId) {
          updates.captainId = null;
        } else {
          const captain = await storage.getUser(captainId);
          if (!captain || captain.clubId !== req.user!.clubId) {
            return res.status(400).json({ message: 'Captain must be a member of this club' });
          }

          const existingMembership = await storage.getTeamMember(team.id, captainId);
          if (!existingMembership) {
            await storage.addTeamMember({ teamId: team.id, userId: captainId, memberRole: null } as InsertTeamMember);
          }

          updates.captainId = captainId;
        }
      }

      if (Object.keys(updates).length > 0) {
        await storage.updateTeam(team.id, updates);
      }

      const updatedTeam = await storage.getTeam(team.id);
      if (!updatedTeam) {
        return res.status(500).json({ message: 'Unable to load updated team' });
      }
      const payload = await buildTeamResponse(updatedTeam);
      res.json({ team: payload });
    } catch (error: any) {
      console.error('Update team error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete('/api/teams/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const isAdmin = req.user!.isPresident || req.user!.role === 'Vice-President';
      if (!isAdmin) {
        return res.status(403).json({ message: 'Only President/VP can manage teams' });
      }

      const team = await storage.getTeam(req.params.id);
      if (!team || team.clubId !== req.user!.clubId) {
        return res.status(404).json({ message: 'Team not found' });
      }

      await storage.deleteTeam(team.id);
      res.json({ message: 'Team deleted successfully' });
    } catch (error: any) {
      console.error('Delete team error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/teams/:id/members', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const isAdmin = req.user!.isPresident || req.user!.role === 'Vice-President';
      if (!isAdmin) {
        return res.status(403).json({ message: 'Only President/VP can manage teams' });
      }

      const team = await storage.getTeam(req.params.id);
      if (!team || team.clubId !== req.user!.clubId) {
        return res.status(404).json({ message: 'Team not found' });
      }

      const { userId, memberRole } = req.body as { userId?: string; memberRole?: string | null };
      if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
      }

      const member = await storage.getUser(userId);
      if (!member || member.clubId !== req.user!.clubId) {
        return res.status(400).json({ message: 'Member not found in this club' });
      }

      const existingMembership = await storage.getTeamMember(team.id, userId);
      if (existingMembership) {
        return res.status(400).json({ message: 'Member already in team' });
      }

      await storage.addTeamMember({ teamId: team.id, userId, memberRole: memberRole ?? null } as InsertTeamMember);

      const updatedTeam = await storage.getTeam(team.id);
      if (!updatedTeam) {
        return res.status(500).json({ message: 'Unable to load updated team' });
      }
      const payload = await buildTeamResponse(updatedTeam);
      res.status(201).json({ team: payload });
    } catch (error: any) {
      console.error('Add team member error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.patch('/api/teams/:id/members/:userId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const isAdmin = req.user!.isPresident || req.user!.role === 'Vice-President';
      if (!isAdmin) {
        return res.status(403).json({ message: 'Only President/VP can manage teams' });
      }

      const team = await storage.getTeam(req.params.id);
      if (!team || team.clubId !== req.user!.clubId) {
        return res.status(404).json({ message: 'Team not found' });
      }

      const membership = await storage.getTeamMember(team.id, req.params.userId);
      if (!membership) {
        return res.status(404).json({ message: 'Member not part of team' });
      }

      const { memberRole } = req.body as { memberRole?: string | null };
      await storage.updateTeamMember(membership.id, { memberRole: memberRole ?? null });

      const updatedTeam = await storage.getTeam(team.id);
      if (!updatedTeam) {
        return res.status(500).json({ message: 'Unable to load updated team' });
      }
      const payload = await buildTeamResponse(updatedTeam);
      res.json({ team: payload });
    } catch (error: any) {
      console.error('Update team member error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete('/api/teams/:id/members/:userId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const isAdmin = req.user!.isPresident || req.user!.role === 'Vice-President';
      if (!isAdmin) {
        return res.status(403).json({ message: 'Only President/VP can manage teams' });
      }

      const team = await storage.getTeam(req.params.id);
      if (!team || team.clubId !== req.user!.clubId) {
        return res.status(404).json({ message: 'Team not found' });
      }

      const membership = await storage.getTeamMember(team.id, req.params.userId);
      if (!membership) {
        return res.status(404).json({ message: 'Member not part of team' });
      }

      await storage.removeTeamMember(team.id, req.params.userId);

      if (team.captainId === req.params.userId) {
        await storage.updateTeam(team.id, { captainId: null } as Partial<InsertTeam>);
      }

      const updatedTeam = await storage.getTeam(team.id);
      if (!updatedTeam) {
        return res.status(500).json({ message: 'Unable to load updated team' });
      }
      const payload = await buildTeamResponse(updatedTeam);
      res.json({ team: payload });
    } catch (error: any) {
      console.error('Remove team member error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // ============================================================
  // EVENT ROUTES
  // ============================================================

  app.get('/api/events', authenticateToken, requirePermission('manage_events'), async (req: AuthRequest, res) => {
    try {
      const events = await storage.getEventsByClub(req.user!.clubId);
      res.json(events);
    } catch (error: any) {
      console.error('Get events error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  const validEventStatuses = new Set(['Planning', 'Ongoing', 'Completed']);

  app.post('/api/events', authenticateToken, requirePermission('manage_events'), async (req: AuthRequest, res) => {
    try {
      const { title, description, date, budget, status, assignedToId } = req.body as {
        title?: string;
        description?: string | null;
        date?: string;
        budget?: string | number | null;
        status?: string;
        assignedToId?: string | null;
      };

      if (!title || !date || !status) {
        return res.status(400).json({ message: 'Title, date, and status are required' });
      }

      if (!validEventStatuses.has(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }

      const eventDate = new Date(date);
      if (Number.isNaN(eventDate.getTime())) {
        return res.status(400).json({ message: 'Invalid event date' });
      }

      let assignedTo: string | null = null;
      if (assignedToId) {
        const member = await storage.getUser(assignedToId);
        if (!member || member.clubId !== req.user!.clubId) {
          return res.status(400).json({ message: 'Assigned member not found in this club' });
        }
        assignedTo = member.id;
      }

      const formattedBudget =
        typeof budget === 'number'
          ? budget.toString()
          : typeof budget === 'string' && budget.trim() !== ''
            ? budget
            : null;

      const event = await storage.createEvent({
        clubId: req.user!.clubId,
        title,
        description: description ?? null,
        date: eventDate,
        budget: formattedBudget,
        status,
        assignedToId: assignedTo,
        createdById: req.user!.id,
      });

      res.json(event);
    } catch (error: any) {
      console.error('Create event error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.patch('/api/events/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const existing = await storage.getEvent(req.params.id);
      if (!existing || existing.clubId !== req.user!.clubId) {
        return res.status(404).json({ message: 'Event not found' });
      }

      const { title, description, date, budget, status, assignedToId } = req.body as {
        title?: string;
        description?: string | null;
        date?: string;
        budget?: string | number | null;
        status?: string;
        assignedToId?: string | null;
      };

      const updates: Partial<InsertEvent> = {};

      if (title !== undefined) {
        updates.title = title;
      }

      if (description !== undefined) {
        updates.description = description ?? null;
      }

      if (status !== undefined) {
        if (!validEventStatuses.has(status)) {
          return res.status(400).json({ message: 'Invalid status value' });
        }
        updates.status = status;
      }

      if (date !== undefined) {
        const eventDate = new Date(date);
        if (Number.isNaN(eventDate.getTime())) {
          return res.status(400).json({ message: 'Invalid event date' });
        }
        updates.date = eventDate;
      }

      if (budget !== undefined) {
        updates.budget =
          typeof budget === 'number'
            ? budget.toString()
            : typeof budget === 'string' && budget.trim() !== ''
              ? budget
              : null;
      }

      if (assignedToId !== undefined) {
        if (!assignedToId) {
          updates.assignedToId = null;
        } else {
          const member = await storage.getUser(assignedToId);
          if (!member || member.clubId !== req.user!.clubId) {
            return res.status(400).json({ message: 'Assigned member not found in this club' });
          }
          updates.assignedToId = member.id;
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No valid updates provided' });
      }

      const updated = await storage.updateEvent(existing.id, updates);
      res.json(updated);
    } catch (error: any) {
      console.error('Update event error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete('/api/events/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const existing = await storage.getEvent(req.params.id);
      if (!existing || existing.clubId !== req.user!.clubId) {
        return res.status(404).json({ message: 'Event not found' });
      }

      await storage.deleteEvent(existing.id);
      res.json({ message: 'Event deleted' });
    } catch (error: any) {
      console.error('Delete event error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // ============================================================
  // TASK ROUTES
  // ============================================================

  app.get('/api/tasks', authenticateToken, requirePermission('manage_tasks'), async (req: AuthRequest, res) => {
    try {
      const tasks = await storage.getTasksByClub(req.user!.clubId);
      res.json(tasks);
    } catch (error: any) {
      console.error('Get tasks error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/tasks', authenticateToken, requirePermission('manage_tasks'), async (req: AuthRequest, res) => {
    try {
      const { title, description, eventId, assignedToId, teamId, dueDate, status } = req.body as {
        title: string;
        description?: string;
        eventId: string;
        assignedToId?: string | null;
        teamId?: string | null;
        dueDate?: string;
        status?: string;
      };

      const event = await storage.getEvent(eventId);
      if (!event || event.clubId !== req.user!.clubId) {
        return res.status(404).json({ message: 'Event not found' });
      }

      let assignee: User | undefined;
      if (assignedToId) {
        assignee = await storage.getUser(assignedToId);
        if (!assignee || assignee.clubId !== req.user!.clubId) {
          return res.status(400).json({ message: 'Assigned member not found in this club' });
        }
      }

      let team: Team | null = null;
      if (teamId) {
        const teamRecord = await storage.getTeam(teamId);
        if (!teamRecord || teamRecord.clubId !== req.user!.clubId) {
          return res.status(400).json({ message: 'Team not found in this club' });
        }
        team = teamRecord;
      }

      let due: Date | null = null;
      if (dueDate) {
        const parsedDue = new Date(dueDate);
        if (Number.isNaN(parsedDue.getTime())) {
          return res.status(400).json({ message: 'Invalid due date' });
        }
        due = parsedDue;
      }

      const task = await storage.createTask({
        eventId,
        clubId: req.user!.clubId,
        title,
        description,
        assignedToId: assignee ? assignee.id : null,
        teamId: team ? team.id : null,
        dueDate: due,
        status: status || 'Pending',
      } as InsertTask);

      res.json(task);
    } catch (error: any) {
      console.error('Create task error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.patch('/api/tasks/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task || task.clubId !== req.user!.clubId) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const { assignedToId, teamId, dueDate, eventId, ...rest } = req.body as {
        title?: string;
        description?: string;
        status?: string;
        assignedToId?: string | null;
        teamId?: string | null;
        eventId?: string;
        dueDate?: string | null;
      };

      const updates: Partial<InsertTask> = { ...rest };

      if (eventId !== undefined) {
        const event = await storage.getEvent(eventId);
        if (!event || event.clubId !== req.user!.clubId) {
          return res.status(400).json({ message: 'Event not found in this club' });
        }
        updates.eventId = event.id;
      }

      if (assignedToId !== undefined) {
        if (!assignedToId) {
          updates.assignedToId = null;
        } else {
          const assignee = await storage.getUser(assignedToId);
          if (!assignee || assignee.clubId !== req.user!.clubId) {
            return res.status(400).json({ message: 'Assigned member not found in this club' });
          }
          updates.assignedToId = assignee.id;
        }
      }

      if (teamId !== undefined) {
        if (!teamId) {
          updates.teamId = null;
        } else {
          const team = await storage.getTeam(teamId);
          if (!team || team.clubId !== req.user!.clubId) {
            return res.status(400).json({ message: 'Team not found in this club' });
          }
          updates.teamId = team.id;
        }
      }

      if (dueDate !== undefined) {
        if (!dueDate) {
          updates.dueDate = null;
        } else {
          const parsedDue = new Date(dueDate);
          if (Number.isNaN(parsedDue.getTime())) {
            return res.status(400).json({ message: 'Invalid due date' });
          }
          updates.dueDate = parsedDue;
        }
      }

      const updated = await storage.updateTask(task.id, updates);
      res.json(updated);
    } catch (error: any) {
      console.error('Update task error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete('/api/tasks/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task || task.clubId !== req.user!.clubId) {
        return res.status(404).json({ message: 'Task not found' });
      }

      await storage.deleteTask(task.id);
      res.json({ message: 'Task deleted successfully' });
    } catch (error: any) {
      console.error('Delete task error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // ============================================================
  // FINANCE ROUTES
  // ============================================================

  app.get('/api/finance', authenticateToken, async (req: AuthRequest, res) => {
    // Allow access if user has manage_finance or approve_finance permission
    const canManage = hasPermission(req.user!.permissions, 'manage_finance');
    const canApprove = hasPermission(req.user!.permissions, 'approve_finance');
    if (!canManage && !canApprove) {
      return res.status(403).json({ message: 'Insufficient permissions to view finance' });
    }
    try {
      const transactions = await storage.getFinanceByClub(req.user!.clubId);
      res.json(transactions);
    } catch (error: any) {
      console.error('Get finance error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/finance', authenticateToken, requirePermission('manage_finance'), async (req: AuthRequest, res) => {
    try {
      const { transactionName, type, amount, receiptUrl } = req.body;

      const entry = await storage.createFinanceEntry({
        clubId: req.user!.clubId,
        transactionName,
        type,
        amount,
        receiptUrl,
        status: 'Pending',
        approvedById: null,
        createdById: req.user!.id,
      });

      res.json(entry);
    } catch (error: any) {
      console.error('Create finance error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.patch('/api/finance/:id/approve', authenticateToken, requirePermission('approve_finance'), async (req: AuthRequest, res) => {
    try {
      const entry = await storage.getFinanceEntry(req.params.id);
      if (!entry || entry.clubId !== req.user!.clubId) {
        return res.status(404).json({ message: 'Entry not found' });
      }

      const updated = await storage.updateFinanceEntry(entry.id, {
        status: 'Approved',
        approvedById: req.user!.id,
      } as Partial<InsertFinance>);

      res.json(updated);
    } catch (error: any) {
      console.error('Approve finance error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.patch('/api/finance/:id', authenticateToken, requirePermission('manage_finance'), async (req: AuthRequest, res) => {
    try {
      const entry = await storage.getFinanceEntry(req.params.id);
      if (!entry || entry.clubId !== req.user!.clubId) {
        return res.status(404).json({ message: 'Entry not found' });
      }

      const { transactionName, type, amount, receiptUrl, status } = req.body as {
        transactionName?: string;
        type?: 'income' | 'expense';
        amount?: number | string;
        receiptUrl?: string | null;
        status?: string;
      };

      const updates: Partial<InsertFinance> = {};

      if (transactionName !== undefined) {
        updates.transactionName = transactionName;
      }

      if (type !== undefined) {
        updates.type = type;
      }

      if (amount !== undefined) {
        const formattedAmount = typeof amount === 'number' ? amount.toString() : amount;
        updates.amount = formattedAmount as unknown as string;
      }

      if (receiptUrl !== undefined) {
        updates.receiptUrl = receiptUrl ?? null;
      }

      if (status !== undefined) {
        updates.status = status;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No updates provided' });
      }

      const updated = await storage.updateFinanceEntry(entry.id, updates);
      res.json(updated);
    } catch (error: any) {
      console.error('Update finance error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete('/api/finance/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const entry = await storage.getFinanceEntry(req.params.id);
      if (!entry || entry.clubId !== req.user!.clubId) {
        return res.status(404).json({ message: 'Entry not found' });
      }

      await storage.deleteFinanceEntry(entry.id);
      res.json({ message: 'Finance entry deleted' });
    } catch (error: any) {
      console.error('Delete finance error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // ============================================================
  // SOCIAL POST ROUTES
  // ============================================================

  app.get('/api/social', authenticateToken, requirePermission('manage_social'), async (req: AuthRequest, res) => {
    try {
      const posts = await storage.getSocialPostsByClub(req.user!.clubId);
      res.json(posts);
    } catch (error: any) {
      console.error('Get social posts error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/social', authenticateToken, requirePermission('manage_social'), async (req: AuthRequest, res) => {
    try {
      const { caption, imageUrl, platform, scheduledDate, status } = req.body;

      const post = await storage.createSocialPost({
        clubId: req.user!.clubId,
        caption,
        imageUrl,
        platform,
        scheduledDate,
        status: status || 'Draft',
        createdById: req.user!.id,
      });

      res.json(post);
    } catch (error: any) {
      console.error('Create social post error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.patch('/api/social/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const post = await storage.getSocialPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      const { caption, imageUrl, platform, scheduledDate, status } = req.body as {
        caption?: string;
        imageUrl?: string | null;
        platform?: string;
        scheduledDate?: string | null;
        status?: string;
      };

      const updates: Partial<InsertSocialPost> = {};

      if (caption !== undefined) updates.caption = caption;
      if (imageUrl !== undefined) updates.imageUrl = imageUrl ?? null;
      if (platform !== undefined) updates.platform = platform;
      if (status !== undefined) updates.status = status;
      if (scheduledDate !== undefined) {
        if (!scheduledDate) {
          updates.scheduledDate = null;
        } else {
          const parsed = new Date(scheduledDate);
          if (Number.isNaN(parsed.getTime())) {
            return res.status(400).json({ message: 'Invalid scheduled date' });
          }
          updates.scheduledDate = parsed;
        }
      }

      const updated = await storage.updateSocialPost(req.params.id, updates);
      res.json(updated);
    } catch (error: any) {
      console.error('Update social post error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete('/api/social/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      await storage.deleteSocialPost(req.params.id);
      res.json({ message: 'Post deleted' });
    } catch (error: any) {
      console.error('Delete social post error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // ============================================================
  // AI TASK ASSISTANT ROUTES
  // ============================================================

  app.post('/api/ai/generate-tasks', authenticateToken, requirePermission('manage_tasks'), async (req: AuthRequest, res) => {
    try {
      const { eventTitle, eventDescription, goals, team, expectedDate, expectedBudget } = req.body as {
        eventTitle?: string;
        eventDescription?: string;
        goals?: string;
        team?: string;
        expectedDate?: string;
        expectedBudget?: string | number;
      };

      if (!eventTitle) {
        return res.status(400).json({ message: 'Event title is required' });
      }

      // Get API key from environment (Groq free tier)
      const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          message: 'AI service not configured. Please set GROQ_API_KEY or GEMINI_API_KEY in environment variables.'
        });
      }

      // Use Groq API (free LLaMA 3) by default, fallback to Gemini if only that key is set
      const useGroq = !!process.env.GROQ_API_KEY;
      const useGemini = !useGroq && !!process.env.GEMINI_API_KEY;

      let aiResponse: any;

      if (useGroq) {
        // Groq API (LLaMA 3 - Free tier)
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant', // Free tier model
            messages: [
              {
                role: 'system',
                content: `You are an expert event planning assistant for club management. Generate structured task plans, budget suggestions, timelines, and team assignments based on event details. Always respond with valid JSON only, no markdown formatting.`,
              },
              {
                role: 'user',
                content: `Generate a comprehensive event planning breakdown for the following event:

Event Title: ${eventTitle}
${eventDescription ? `Description: ${eventDescription}` : ''}
${goals ? `Goals: ${goals}` : ''}
${team ? `Team/Department: ${team}` : ''}
${expectedDate ? `Expected Date: ${expectedDate}` : ''}
${expectedBudget ? `Expected Budget: ${expectedBudget}` : ''}

Provide a JSON response with this exact structure:
{
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed task description",
      "assignedTo": "Suggested team or role (e.g., PR Team, Finance Team, Operations, Creatives)",
      "dueDate": "YYYY-MM-DD format, calculated based on event date",
      "priority": "High, Medium, or Low"
    }
  ],
  "budgetSuggestions": [
    {
      "item": "Budget item name",
      "estimatedAmount": "Amount as number or string"
    }
  ],
  "timeline": [
    {
      "day": "Day number or relative day (e.g., 'Day -30', 'Week 1')",
      "milestone": "Milestone description"
    }
  ],
  "teamSuggestions": [
    {
      "role": "Team or role name",
      "responsibility": "What this team should handle"
    }
  ]
}

Generate 5-8 relevant tasks, 3-5 budget items, 4-6 timeline milestones, and 2-4 team suggestions.`,
              },
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        if (!groqResponse.ok) {
          const errorText = await groqResponse.text();
          throw new Error(`Groq API error: ${groqResponse.status} - ${errorText}`);
        }

        const groqData = await groqResponse.json();
        const content = groqData.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error('No response from Groq API');
        }

        // Parse JSON from response (may be wrapped in markdown code blocks)
        let jsonText = content.trim();
        if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
        }
        aiResponse = JSON.parse(jsonText);
      } else if (useGemini) {
        // Google Gemini API (Free tier)
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an expert event planning assistant. Generate a comprehensive event planning breakdown for:

Event Title: ${eventTitle}
${eventDescription ? `Description: ${eventDescription}` : ''}
${goals ? `Goals: ${goals}` : ''}
${team ? `Team/Department: ${team}` : ''}
${expectedDate ? `Expected Date: ${expectedDate}` : ''}
${expectedBudget ? `Expected Budget: ${expectedBudget}` : ''}

Respond with ONLY valid JSON (no markdown, no code blocks) in this exact structure:
{
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed description",
      "assignedTo": "Suggested team (PR, Finance, Operations, Creatives)",
      "dueDate": "YYYY-MM-DD",
      "priority": "High, Medium, or Low"
    }
  ],
  "budgetSuggestions": [
    {
      "item": "Item name",
      "estimatedAmount": "Amount"
    }
  ],
  "timeline": [
    {
      "day": "Day description",
      "milestone": "Milestone"
    }
  ],
  "teamSuggestions": [
    {
      "role": "Team name",
      "responsibility": "Responsibility"
    }
  ]
}

Generate 5-8 tasks, 3-5 budget items, 4-6 timeline milestones, and 2-4 team suggestions.`
              }]
            }]
          }),
        });

        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
        }

        const geminiData = await geminiResponse.json();
        const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) {
          throw new Error('No response from Gemini API');
        }

        // Parse JSON from response
        let jsonText = content.trim();
        if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
        }
        aiResponse = JSON.parse(jsonText);
      } else {
        throw new Error('No AI API key configured');
      }

      // Validate and normalize the response structure
      const normalizedResponse = {
        tasks: Array.isArray(aiResponse.tasks) ? aiResponse.tasks.map((task: any) => ({
          title: String(task.title || 'Untitled Task'),
          description: String(task.description || ''),
          assignedTo: String(task.assignedTo || task.assigned_to || 'Unassigned'),
          dueDate: String(task.dueDate || task.due_date || ''),
          priority: String(task.priority || 'Medium'),
        })) : [],
        budgetSuggestions: Array.isArray(aiResponse.budgetSuggestions) ? aiResponse.budgetSuggestions.map((item: any) => ({
          item: String(item.item || ''),
          estimatedAmount: String(item.estimatedAmount || item.estimated_amount || '0'),
        })) : [],
        timeline: Array.isArray(aiResponse.timeline) ? aiResponse.timeline.map((item: any) => ({
          day: String(item.day || ''),
          milestone: String(item.milestone || ''),
        })) : [],
        teamSuggestions: Array.isArray(aiResponse.teamSuggestions) ? aiResponse.teamSuggestions.map((item: any) => ({
          role: String(item.role || ''),
          responsibility: String(item.responsibility || ''),
        })) : [],
      };

      res.json(normalizedResponse);
    } catch (error: any) {
      console.error('AI generate tasks error:', error);
      res.status(500).json({
        message: error.message || 'Failed to generate AI suggestions. Please try again.'
      });
    }
  });

  // ============================================================
  // DASHBOARD STATS
  // ============================================================

  app.get('/api/dashboard/stats', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const startTime = Date.now();
      const clubId = req.user!.clubId;
      const userId = req.user!.id;

      console.log('[DASHBOARD STATS]', { clubId, userId, email: req.user!.email });

      const userPerms = req.user!.permissions;
      const canViewStats = hasPermission(userPerms, 'view_dashboard_stats');
      const canViewApprovals = hasPermission(userPerms, 'view_approvals');
      const canViewMembers = hasPermission(userPerms, 'view_members');
      const canManageEvents = hasPermission(userPerms, 'manage_events');
      const canManageTasks = hasPermission(userPerms, 'manage_tasks');
      const canManageFinance = hasPermission(userPerms, 'manage_finance');
      const canManageSocial = hasPermission(userPerms, 'manage_social');

      // Only fetch data if user has permission to view stats
      if (!canViewStats) {
        return res.status(403).json({ message: 'Insufficient permissions to view dashboard stats' });
      }

      // Fetch all data in parallel for better performance
      const promises: Promise<any>[] = [];

      if (canViewApprovals) {
        promises.push(storage.getPendingMembersByClub(clubId));
      } else {
        promises.push(Promise.resolve([]));
      }

      if (canViewMembers) {
        promises.push(storage.getUsersByClub(clubId));
      } else {
        promises.push(Promise.resolve([]));
      }

      if (canManageEvents) {
        promises.push(storage.getEventsByClub(clubId));
      } else {
        promises.push(Promise.resolve([]));
      }

      if (canManageTasks) {
        promises.push(storage.getTasksByClub(clubId));
      } else {
        promises.push(Promise.resolve([]));
      }

      if (canManageFinance) {
        promises.push(storage.getFinanceByClub(clubId));
      } else {
        promises.push(Promise.resolve([]));
      }

      if (canManageSocial) {
        promises.push(storage.getSocialPostsByClub(clubId));
      } else {
        promises.push(Promise.resolve([]));
      }

      const [pendingMembers, members, events, tasks, finance, socialPosts] = await Promise.all(promises);

      const coreMembersCount = canViewMembers
        ? members.filter(
          (member: User) =>
            member.canLogin &&
            !member.isPresident &&
            member.role !== 'Vice-President',
        ).length
        : 0;

      const totalIncome = canManageFinance
        ? finance
          .filter((f: Finance) => f.type === 'income' && f.status === 'Approved')
          .reduce((sum: number, f: Finance) => sum + parseFloat(f.amount), 0)
        : 0;

      const totalExpense = canManageFinance
        ? finance
          .filter((f: Finance) => f.type === 'expense' && f.status === 'Approved')
          .reduce((sum: number, f: Finance) => sum + parseFloat(f.amount), 0)
        : 0;

      const response = {
        pendingMembers: canViewApprovals ? pendingMembers.length : null,
        totalMembers: canViewMembers ? members.length : null,
        coreMembers: canViewMembers ? coreMembersCount : null,
        activeEvents: canManageEvents ? events.filter((e: Event) => e.status !== 'Completed').length : null,
        upcomingEvents: canManageEvents ? events.filter((e: Event) => new Date(e.date) > new Date()).length : null,
        pendingTasks: canManageTasks ? tasks.filter((t: Task) => t.status === 'Pending').length : null,
        myTasks: canManageTasks ? tasks.filter((t: Task) => t.assignedToId === userId && t.status !== 'Done').length : null,
        balance: canManageFinance ? totalIncome - totalExpense : null,
        pendingTransactions: canManageFinance ? finance.filter((f: Finance) => f.status === 'Pending').length : null,
        scheduledPosts: canManageSocial ? socialPosts.filter((p: SocialPost) => p.status === 'Scheduled').length : null,
        draftPosts: canManageSocial ? socialPosts.filter((p: SocialPost) => p.status === 'Draft').length : null,
      };

      const duration = Date.now() - startTime;
      console.log('[DASHBOARD STATS SUCCESS]', { clubId, duration: `${duration}ms` });

      res.json(response);
    } catch (error: any) {
      console.error('[DASHBOARD STATS ERROR]', {
        clubId: req.user!.clubId,
        userId: req.user!.id,
        error: error.message,
        stack: error.stack,
      });
      res.status(500).json({ message: 'Server error loading dashboard stats' });
    }
  });

  // Committee routes
  app.get('/api/committee', authenticateToken, requirePermission('manage_committee'), async (req: AuthRequest, res: Response) => {
    try {
      const members = await storage.getUsersByClub(req.user!.clubId);
      const sanitizedMembers = sanitizeUsers(members);

      const president = sanitizedMembers.find((member) => member.isPresident) || null;
      const vicePresident = sanitizedMembers.find((member) => member.role === 'Vice-President') || null;
      const coreMembers = sanitizedMembers.filter(
        (member) =>
          member.canLogin &&
          !member.isPresident &&
          member.role !== 'Vice-President',
      );
      const availableMembers = sanitizedMembers.filter(
        (member) =>
          !member.canLogin &&
          !member.isPresident &&
          member.role !== 'Vice-President',
      );

      res.json({
        president,
        vicePresident,
        coreMembers,
        availableMembers,
      });
    } catch (error: any) {
      console.error('Committee fetch error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/committee/vice', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user!.isPresident) {
        return res.status(403).json({ message: 'Only the president can assign a vice-president' });
      }

      const { userId } = req.body as { userId?: string };
      if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
      }

      const target = await storage.getUser(userId);
      if (!target || target.clubId !== req.user!.clubId) {
        return res.status(404).json({ message: 'Member not found' });
      }

      if (target.isPresident) {
        return res.status(400).json({ message: 'President cannot be reassigned as vice-president' });
      }

      const clubMembers = await storage.getUsersByClub(req.user!.clubId);
      const currentVice = clubMembers.find((member) => member.role === 'Vice-President');

      if (currentVice && currentVice.id !== target.id) {
        await storage.updateUser(currentVice.id, { role: 'Member', canLogin: false });
      }

      const updated = await storage.updateUser(target.id, {
        role: 'Vice-President',
        canLogin: true,
        isApproved: true,
      });

      res.json({ vicePresident: sanitizeUser(updated) });
    } catch (error: any) {
      console.error('Assign vice-president error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/committee/core', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user!.isPresident || req.user!.role === 'Vice-President';
      if (!isAdmin) {
        return res.status(403).json({ message: 'Not authorized to modify committee members' });
      }

      const { userId, role, roleId } = req.body as { userId?: string; role?: string; roleId?: string };
      if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
      }

      const target = await storage.getUser(userId);
      if (!target || target.clubId !== req.user!.clubId) {
        return res.status(404).json({ message: 'Member not found' });
      }

      if (target.isPresident || target.role === 'Vice-President') {
        return res.status(400).json({ message: 'Cannot modify leadership with this action' });
      }

      const updates: Partial<InsertUser> = {
        role: role && role.trim() !== '' ? role : target.role || 'Council Head',
        canLogin: true,
        isApproved: true,
      };

      // If roleId is provided, link the user to that custom role
      if (roleId) {
        const customRole = await storage.getRole(roleId);
        if (customRole && customRole.clubId === req.user!.clubId) {
          updates.roleId = roleId;
        }
      } else if (role) {
        // If no roleId but role name is provided, try to find matching custom role
        const clubRoles = await storage.getRolesByClub(req.user!.clubId);
        const matchingRole = clubRoles.find((r) => r.name === role.trim());
        if (matchingRole) {
          updates.roleId = matchingRole.id;
        } else {
          // If it's a standard role (Council Head, Member), clear roleId
          if (role.trim() === 'Council Head' || role.trim() === 'Member') {
            updates.roleId = null;
          }
        }
      }

      const updated = await storage.updateUser(target.id, updates);

      res.json({ member: sanitizeUser(updated) });
    } catch (error: any) {
      console.error('Promote committee member error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.patch('/api/committee/core/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user!.isPresident || req.user!.role === 'Vice-President';
      if (!isAdmin) {
        return res.status(403).json({ message: 'Not authorized to modify committee members' });
      }

      const target = await storage.getUser(req.params.id);
      if (!target || target.clubId !== req.user!.clubId) {
        return res.status(404).json({ message: 'Member not found' });
      }

      if (target.isPresident || target.role === 'Vice-President') {
        return res.status(400).json({ message: 'Cannot edit leadership with this action' });
      }

      const { role, roleId, canLogin } = req.body as { role?: string; roleId?: string; canLogin?: boolean };
      const updates: Partial<InsertUser> = {};

      if (role !== undefined) {
        updates.role = role.trim() === '' ? target.role : role;
      }

      // Handle roleId linking
      if (roleId !== undefined) {
        if (roleId) {
          // Verify the role exists and belongs to the same club
          const customRole = await storage.getRole(roleId);
          if (customRole && customRole.clubId === req.user!.clubId) {
            updates.roleId = roleId;
          } else {
            return res.status(400).json({ message: 'Invalid role ID' });
          }
        } else {
          // Clear roleId if explicitly set to null/empty
          updates.roleId = null;
        }
      } else if (role !== undefined) {
        // If role is updated but no roleId provided, try to find matching custom role
        const clubRoles = await storage.getRolesByClub(req.user!.clubId);
        const matchingRole = clubRoles.find((r) => r.name === role.trim());
        if (matchingRole) {
          updates.roleId = matchingRole.id;
        } else {
          // If it's a standard role, clear roleId
          if (role.trim() === 'Council Head' || role.trim() === 'Member') {
            updates.roleId = null;
          }
        }
      }

      if (canLogin !== undefined) {
        updates.canLogin = canLogin;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No updates provided' });
      }

      const updated = await storage.updateUser(target.id, updates);
      res.json({ member: sanitizeUser(updated) });
    } catch (error: any) {
      console.error('Update committee member error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete('/api/committee/core/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user!.isPresident) {
        return res.status(403).json({ message: 'Only the president can remove committee members' });
      }

      const target = await storage.getUser(req.params.id);
      if (!target || target.clubId !== req.user!.clubId) {
        return res.status(404).json({ message: 'Member not found' });
      }

      if (target.isPresident || target.role === 'Vice-President') {
        return res.status(400).json({ message: 'Cannot remove leadership with this action' });
      }

      const updated = await storage.updateUser(target.id, {
        canLogin: false,
        role: 'Member',
      });

      res.json({ member: sanitizeUser(updated) });
    } catch (error: any) {
      console.error('Remove committee member error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  const httpServer = createServer(app);
  // ============================================================
  // ELECTION ROUTES
  // ============================================================

  // Create an election (Institution Admin only)
  app.post(
    '/api/institution/elections',
    authenticateInstitutionToken,
    requireInstitutionRole(['Institution Admin', 'Faculty Coordinator']),
    async (req: InstitutionAuthRequest, res) => {
      try {
        const { clubId, title, description, startTime, endTime, candidateIds, candidateNames } = req.body;
        const institutionId = req.institutionUser!.institutionId;

        console.log('[CREATE ELECTION] Request body:', { clubId, title, startTime, endTime, candidateIds, candidateNames });

        if (!clubId || !title || !startTime || !endTime) {
          const missing = [];
          if (!clubId) missing.push('clubId');
          if (!title) missing.push('title');
          if (!startTime) missing.push('startTime');
          if (!endTime) missing.push('endTime');
          console.log('[CREATE ELECTION] Missing fields:', missing, 'Received:', { clubId, title, startTime, endTime });
          return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
        }

        // Validate that at least one candidate source is provided
        const hasCandidateIds = candidateIds && Array.isArray(candidateIds) && candidateIds.length > 0;
        const hasCandidateNames = candidateNames && Array.isArray(candidateNames) && candidateNames.length > 0;

        if (!hasCandidateIds && !hasCandidateNames) {
          console.log('[CREATE ELECTION] No candidates. IDs:', candidateIds, 'Names:', candidateNames);
          return res.status(400).json({ message: 'At least one candidate must be provided' });
        }

        // Verify club belongs to institution
        const club = await storage.getClub(clubId);
        if (!club || club.institutionId !== institutionId) {
          return res.status(403).json({ message: 'Invalid club selected' });
        }

        // Generate unique access code (slug)
        let accessCode = randomBytes(4).toString('hex');
        while (await storage.getElectionByAccessCode(accessCode)) {
          accessCode = randomBytes(4).toString('hex');
        }

        const election = await storage.createElection({
          clubId,
          institutionId,
          title,
          description,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          status: 'scheduled',
          accessCode,
        } as any);

        // Add candidates from existing users
        if (candidateIds && Array.isArray(candidateIds) && candidateIds.length > 0) {
          for (const userId of candidateIds) {
            await storage.createElectionCandidate({
              electionId: election.id,
              userId,
              voteCount: 0,
            } as any);
          }
        }

        // Add manually entered candidates
        if (candidateNames && Array.isArray(candidateNames) && candidateNames.length > 0) {
          for (const name of candidateNames) {
            if (name && typeof name === 'string' && name.trim() !== '') {
              await storage.createElectionCandidate({
                electionId: election.id,
                candidateName: name.trim(),
                voteCount: 0,
              } as any);
            }
          }
        }

        res.status(201).json(election);
      } catch (error: any) {
        console.error('Create election error:', error);
        res.status(500).json({ message: 'Failed to create election' });
      }
    }
  );

  // Get all elections for an institution
  app.get(
    '/api/institution/elections',
    authenticateInstitutionToken,
    async (req: InstitutionAuthRequest, res) => {
      try {
        const institutionId = req.institutionUser!.institutionId;
        const elections = await storage.getElectionsByInstitution(institutionId);

        // Enrich with club names
        const enrichedElections = await Promise.all(elections.map(async (election) => {
          const club = await storage.getClub(election.clubId);
          return { ...election, clubName: club?.name };
        }));

        res.json(enrichedElections);
      } catch (error: any) {
        console.error('Get elections error:', error);
        res.status(500).json({ message: 'Failed to fetch elections' });
      }
    }
  );

  // Delete an election (Institution Admin only)
  app.delete(
    '/api/institution/elections/:id',
    authenticateInstitutionToken,
    requireInstitutionRole(['Institution Admin', 'Faculty Coordinator']),
    async (req: InstitutionAuthRequest, res) => {
      try {
        const { id } = req.params;
        const institutionId = req.institutionUser!.institutionId;

        const election = await storage.getElection(id);
        if (!election || election.institutionId !== institutionId) {
          return res.status(404).json({ message: 'Election not found' });
        }

        await storage.deleteElection(id);

        res.status(204).end();
      } catch (error: any) {
        console.error('Delete election error:', error);
        res.status(500).json({ message: 'Failed to delete election' });
      }
    }
  );

  // Get public election details by access code
  app.get('/api/elections/:accessCode', async (req, res) => {
    try {
      const { accessCode } = req.params;
      const election = await storage.getElectionByAccessCode(accessCode);

      if (!election) {
        return res.status(404).json({ message: 'Election not found' });
      }

      const club = await storage.getClub(election.clubId);
      const institution = await storage.getInstitution(election.institutionId);
      const candidates = await storage.getElectionCandidates(election.id);

      // Enrich candidates with user details (name, photo, etc.)
      const enrichedCandidates = await Promise.all(candidates.map(async (candidate) => {
        if (candidate.userId) {
          // User-linked candidate
          const user = await storage.getUser(candidate.userId);
          return {
            id: candidate.id,
            name: user?.name || 'Unknown',
            role: user?.role,
            // Add other public fields as needed
          };
        } else {
          // Manually entered candidate
          return {
            id: candidate.id,
            name: candidate.candidateName || 'Unknown',
            role: null,
          };
        }
      }));

      res.json({
        ...election,
        clubName: club?.name,
        institutionName: institution?.name,
        candidates: enrichedCandidates,
      });
    } catch (error: any) {
      console.error('Get public election error:', error);
      res.status(500).json({ message: 'Failed to fetch election details' });
    }
  });

  // Cast a vote
  app.post('/api/elections/:accessCode/vote', async (req, res) => {
    try {
      const { accessCode } = req.params;
      const { candidateId } = req.body;

      // Cookie-based tracking
      const cookieName = `vote_token_${accessCode}`;
      const existingToken = req.cookies?.[cookieName];

      if (!candidateId || typeof candidateId !== 'string') {
        return res.status(400).json({ message: 'A valid candidate must be selected' });
      }

      const election = await storage.getElectionByAccessCode(accessCode);
      if (!election) {
        return res.status(404).json({ message: 'Election not found' });
      }

      const now = new Date();
      if (now < new Date(election.startTime)) {
        return res.status(400).json({ message: 'Voting has not started yet' });
      }
      if (now > new Date(election.endTime)) {
        return res.status(400).json({ message: 'Voting has ended' });
      }

      // Check for double voting via cookie or DB check if token exists
      if (existingToken) {
        const existingVote = await storage.getElectionVoteByToken(election.id, existingToken);
        if (existingVote) {
          return res.status(403).json({ message: 'You have already voted in this election' });
        }
      }

      const candidate = await storage.getElectionCandidate(candidateId);
      if (!candidate || candidate.electionId !== election.id) {
        return res.status(400).json({ message: 'Invalid candidate selection' });
      }

      // Generate new token if not exists
      const voterToken = existingToken || randomBytes(16).toString('hex');

      // Record vote
      await storage.createElectionVote({
        electionId: election.id,
        voterToken,
      } as any);

      // Increment candidate count
      await storage.incrementCandidateVote(candidateId);

      // Set long-lived cookie (1 year)
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie(cookieName, voterToken, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
      });

      res.json({ message: 'Vote cast successfully' });
    } catch (error: any) {
      console.error('Voting error:', error);
      res.status(500).json({ message: `Failed to cast vote: ${error.message || error}` });
    }
  });

  // Get election results (Institution Admin only)
  app.get(
    '/api/institution/elections/:id/results',
    authenticateInstitutionToken,
    async (req: InstitutionAuthRequest, res) => {
      try {
        const { id } = req.params;
        const election = await storage.getElection(id);

        if (!election || election.institutionId !== req.institutionUser!.institutionId) {
          return res.status(404).json({ message: 'Election not found' });
        }

        const candidates = await storage.getElectionCandidates(id);

        const results = await Promise.all(candidates.map(async (candidate) => {
          let name = 'Unknown';
          if (candidate.userId) {
            const user = await storage.getUser(candidate.userId);
            name = user?.name || 'Unknown';
          } else if (candidate.candidateName) {
            name = candidate.candidateName;
          }
          return {
            candidateId: candidate.id,
            name,
            voteCount: candidate.voteCount,
          };
        }));

        res.json({
          election,
          results,
        });
      } catch (error: any) {
        console.error('Get election results error:', error);
        res.status(500).json({ message: 'Failed to fetch results' });
      }
    }
  );

  return httpServer;
}
