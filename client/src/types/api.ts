export interface DashboardStats {
  pendingMembers: number | null;
  totalMembers: number | null;
  coreMembers: number | null;
  activeEvents: number | null;
  upcomingEvents: number | null;
  pendingTasks: number | null;
  myTasks: number | null;
  balance: number | null;
  pendingTransactions: number | null;
  scheduledPosts: number | null;
  draftPosts: number | null;
}

export type InstitutionPermissionSet = {
  canManageInstitution?: boolean;
  canCreateClubs?: boolean;
  canAssignPresident?: boolean;
  canManageAdmins?: boolean;
  canCommentOnEvents?: boolean;
  scope?: 'all' | 'department';
};

export interface ClubAuthUser {
  accountType: 'club';
  id: string;
  name: string;
  email: string;
  role: string;
  isPresident: boolean;
  clubId: string;
  permissions?: Record<string, boolean>;
}

export interface InstitutionAuthUser {
  accountType: 'institution';
  id: string;
  name: string;
  email: string;
  role: string;
  institutionId: string;
  department: string | null;
  permissions: InstitutionPermissionSet;
}

export type AuthUser = ClubAuthUser | InstitutionAuthUser;

export interface AuthResponse<UserType = AuthUser> {
  token: string;
  user: UserType;
}

export interface MessageResponse {
  message: string;
}

export interface InviteLink {
  url: string;
  code: string;
}

export interface CommitteeMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isPresident: boolean;
  isApproved: boolean;
  canLogin: boolean;
  createdAt: string;
}

export interface CommitteeResponse {
  president: CommitteeMember | null;
  vicePresident: CommitteeMember | null;
  coreMembers: CommitteeMember[];
  availableMembers: CommitteeMember[];
}

export interface TeamMemberResponse extends CommitteeMember {
  memberRole: string | null;
}

export interface TeamResponse {
  id: string;
  clubId: string;
  name: string;
  description: string | null;
  captainId: string | null;
  captain: TeamMemberResponse | null;
  members: TeamMemberResponse[];
  createdAt: string;
}

export interface TeamsResponse {
  teams: TeamResponse[];
  availableMembers: CommitteeMember[];
}

export interface InstitutionDashboardResponse {
  metrics: {
    totalClubs: number;
    totalMembers: number;
    totalCoreMembers: number;
    totalEvents: number;
    eventsThisMonth: number;
    upcomingEvents: number;
    taskCompletionRate: number;
    approvals: {
      pending: number;
      approved: number;
    };
  };
  budget: {
    assigned: number;
    spent: number;
    pendingApproval: number;
    categories: Record<'Operations' | 'PR' | 'Logistics' | 'Marketing', number>;
  };
  tasks: {
    breakdown: Record<'Pending' | 'In Progress' | 'Done', number>;
    completed: number;
    total: number;
  };
  charts: {
    eventsPerMonth: { month: string; count: number }[];
    budgetUsage: Array<{ clubId: string; clubName: string; department: string | null; assignedBudget: number; spentBudget: number }>;
    heatmap: Array<{ date: string; intensity: number }>;
  };
  clubPerformance: Array<{
    clubId: string;
    clubName: string;
    department: string | null;
    performanceIndex: number;
    president: CommitteeMember | null;
    vicePresident: CommitteeMember | null;
    members: number;
    events: number;
  }>;
}

export interface InstitutionClubsResponse {
  clubs: Array<{
    id: string;
    name: string;
    department: string | null;
    logoUrl: string | null;
    president: CommitteeMember | null;
    vicePresident: CommitteeMember | null;
    totalMembers: number;
    totalEvents: number;
    performanceIndex: number;
    presidentPassword: string | null;
    quickActions: Record<string, string>;
  }>;
}

export interface InstitutionEventsResponse {
  events: Array<{
    id: string;
    title: string;
    status: string;
    date: string;
    clubId: string;
    clubName?: string;
    department?: string | null;
    assignedTo?: CommitteeMember | null;
  }>;
}

export interface InstitutionFinanceResponse {
  metrics: {
    totalSpent: number;
    pendingApprovals: number;
  };
  clubSpend: Array<{ clubId: string; clubName: string; department: string | null; totalSpend: number }>;
  monthlySpend: Record<string, number>;
  categories: Record<'Operations' | 'PR' | 'Logistics' | 'Marketing', number>;
  recentTransactions: Array<{
    id: string;
    transactionName: string;
    type: string;
    amount: string;
    status: string;
    clubId: string;
    createdAt: string;
  }>;
}

export interface InstitutionMembersResponse {
  totals: {
    members: number;
    coreMembers: number;
    generalMembers: number;
  };
  clubMembers: Array<{
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
  }>;
  clubTeams: Array<{
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
  }>;
}

export interface InstitutionAnalyticsResponse {
  clubHealth: Array<{
    clubId: string;
    clubName: string;
    department: string | null;
    performanceScore: number;
    taskEfficiency: number;
    eventSuccessIndex: number;
  }>;
  topClubs: Array<{
    clubId: string;
    clubName: string;
    department: string | null;
    performanceScore: number;
    taskEfficiency: number;
    eventSuccessIndex: number;
  }>;
  taskEfficiency: number;
  budgetEffectiveness: number;
  monthlyActivity: { month: string; count: number }[];
  eventSuccessIndex: number;
}

export interface InstitutionHeatmapResponse {
  heatmap: Array<{ date: string; intensity: number }>;
}
