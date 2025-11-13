import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";

const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-in-production";

// JWT middleware
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    clubId: string;
    role: string;
    isPresident: boolean;
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
    const user = await storage.getUser(decoded.userId);
    
    if (!user || !user.canLogin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      clubId: user.clubId,
      role: user.role,
      isPresident: user.isPresident,
    };
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Generate unique club code
function generateClubCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================================
  // AUTH ROUTES
  // ============================================================
  
  // President signup - creates club and president user
  app.post('/api/auth/register-president', async (req, res) => {
    try {
      const { name, email, password, clubName, collegeName, logoUrl, description } = req.body;

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate unique club code
      let clubCode = generateClubCode();
      while (await storage.getClubByCode(clubCode)) {
        clubCode = generateClubCode();
      }

      // Create club
      const club = await storage.createClub({
        name: clubName,
        collegeName,
        logoUrl: logoUrl || null,
        description: description || null,
        clubCode,
      });

      // Create president user
      const user = await storage.createUser({
        clubId: club.id,
        name,
        email,
        password: hashedPassword,
        phone: null,
        idNumber: null,
        linkedin: null,
        portfolio: null,
        role: 'President',
        roleId: null,
        isPresident: true,
        isApproved: true,
        canLogin: true,
      });

      // Generate JWT
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isPresident: user.isPresident,
          clubId: user.clubId,
        },
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Server error during signup' });
    }
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

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isPresident: user.isPresident,
          clubId: user.clubId,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  });

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
      const club = await storage.getClub(req.user!.clubId);
      if (!club) {
        return res.status(404).json({ message: 'Club not found' });
      }
      res.json(club);
    } catch (error: any) {
      console.error('Get club error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Update club (president only)
  app.patch('/api/club', authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user!.isPresident) {
        return res.status(403).json({ message: 'Only president can update club settings' });
      }

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

  // Regenerate club code (president only)
  app.post('/api/club/regenerate-code', authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user!.isPresident) {
        return res.status(403).json({ message: 'Only president can regenerate club code' });
      }

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

  // Get pending members (admin only)
  app.get('/api/members/pending', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const isAdmin = req.user!.isPresident || req.user!.role === 'Vice-President';
      if (!isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const pending = await storage.getPendingMembersByClub(req.user!.clubId);
      res.json(pending);
    } catch (error: any) {
      console.error('Get pending members error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Approve member (admin only)
  app.post('/api/members/approve/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const isAdmin = req.user!.isPresident || req.user!.role === 'Vice-President';
      if (!isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

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
  app.get('/api/members', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const members = await storage.getUsersByClub(req.user!.clubId);
      res.json(members);
    } catch (error: any) {
      console.error('Get members error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // ============================================================
  // ROLE ROUTES
  // ============================================================

  app.get('/api/roles', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const roles = await storage.getRolesByClub(req.user!.clubId);
      res.json(roles);
    } catch (error: any) {
      console.error('Get roles error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/roles', authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user!.isPresident) {
        return res.status(403).json({ message: 'Only president can create roles' });
      }

      const { name, permissions } = req.body;
      const role = await storage.createRole({
        clubId: req.user!.clubId,
        name,
        permissions,
      });

      res.json(role);
    } catch (error: any) {
      console.error('Create role error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.patch('/api/roles/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user!.isPresident) {
        return res.status(403).json({ message: 'Only president can update roles' });
      }

      const { name, permissions } = req.body;
      const updated = await storage.updateRole(req.params.id, { name, permissions });
      res.json(updated);
    } catch (error: any) {
      console.error('Update role error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // ============================================================
  // EVENT ROUTES
  // ============================================================

  app.get('/api/events', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const events = await storage.getEventsByClub(req.user!.clubId);
      res.json(events);
    } catch (error: any) {
      console.error('Get events error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/events', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { title, description, date, budget, status, assignedToId } = req.body;
      
      const event = await storage.createEvent({
        clubId: req.user!.clubId,
        title,
        description,
        date,
        budget,
        status,
        assignedToId,
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
      const updated = await storage.updateEvent(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error('Update event error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete('/api/events/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      await storage.deleteEvent(req.params.id);
      res.json({ message: 'Event deleted' });
    } catch (error: any) {
      console.error('Delete event error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // ============================================================
  // TASK ROUTES
  // ============================================================

  app.get('/api/tasks', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const tasks = await storage.getTasksByClub(req.user!.clubId);
      res.json(tasks);
    } catch (error: any) {
      console.error('Get tasks error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/tasks', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { title, description, eventId, assignedToId, dueDate, status } = req.body;
      
      const task = await storage.createTask({
        eventId,
        clubId: req.user!.clubId,
        title,
        description,
        assignedToId,
        dueDate,
        status: status || 'Pending',
      });

      res.json(task);
    } catch (error: any) {
      console.error('Create task error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.patch('/api/tasks/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const updated = await storage.updateTask(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error('Update task error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // ============================================================
  // FINANCE ROUTES
  // ============================================================

  app.get('/api/finance', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const transactions = await storage.getFinanceByClub(req.user!.clubId);
      res.json(transactions);
    } catch (error: any) {
      console.error('Get finance error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/finance', authenticateToken, async (req: AuthRequest, res) => {
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

  app.patch('/api/finance/:id/approve', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const isAdmin = req.user!.isPresident || req.user!.role === 'Vice-President';
      if (!isAdmin) {
        return res.status(403).json({ message: 'Only President/VP can approve transactions' });
      }

      const updated = await storage.updateFinanceEntry(req.params.id, {
        status: 'Approved',
        approvedById: req.user!.id,
      });

      res.json(updated);
    } catch (error: any) {
      console.error('Approve finance error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // ============================================================
  // SOCIAL POST ROUTES
  // ============================================================

  app.get('/api/social', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const posts = await storage.getSocialPostsByClub(req.user!.clubId);
      res.json(posts);
    } catch (error: any) {
      console.error('Get social posts error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/social', authenticateToken, async (req: AuthRequest, res) => {
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
      const updated = await storage.updateSocialPost(req.params.id, req.body);
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
  // DASHBOARD STATS
  // ============================================================

  app.get('/api/dashboard/stats', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const [members, pendingMembers, events, tasks, finance, socialPosts] = await Promise.all([
        storage.getUsersByClub(req.user!.clubId),
        storage.getPendingMembersByClub(req.user!.clubId),
        storage.getEventsByClub(req.user!.clubId),
        storage.getTasksByClub(req.user!.clubId),
        storage.getFinanceByClub(req.user!.clubId),
        storage.getSocialPostsByClub(req.user!.clubId),
      ]);

      const totalIncome = finance
        .filter(f => f.type === 'income' && f.status === 'Approved')
        .reduce((sum, f) => sum + parseFloat(f.amount), 0);
      
      const totalExpense = finance
        .filter(f => f.type === 'expense' && f.status === 'Approved')
        .reduce((sum, f) => sum + parseFloat(f.amount), 0);

      res.json({
        pendingMembers: pendingMembers.length,
        totalMembers: members.length,
        coreMembers: members.filter(m => m.canLogin).length,
        activeEvents: events.filter(e => e.status !== 'Completed').length,
        upcomingEvents: events.filter(e => new Date(e.date) > new Date()).length,
        pendingTasks: tasks.filter(t => t.status === 'Pending').length,
        myTasks: tasks.filter(t => t.assignedToId === req.user!.id && t.status !== 'Done').length,
        balance: totalIncome - totalExpense,
        pendingTransactions: finance.filter(f => f.status === 'Pending').length,
        scheduledPosts: socialPosts.filter(p => p.status === 'Scheduled').length,
        draftPosts: socialPosts.filter(p => p.status === 'Draft').length,
      });
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
