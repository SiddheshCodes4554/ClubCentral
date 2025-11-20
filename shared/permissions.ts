// Permission system for ClubCentral
// Defines all available permissions and helper functions

export type Permission =
  | 'manage_events'
  | 'manage_tasks'
  | 'manage_finance'
  | 'approve_finance'
  | 'manage_social'
  | 'view_members'
  | 'manage_teams'
  | 'manage_committee'
  | 'manage_roles'
  | 'manage_settings'
  | 'view_approvals'
  | 'view_dashboard_stats';

export interface PermissionSet {
  manage_events?: boolean;
  manage_tasks?: boolean;
  manage_finance?: boolean;
  approve_finance?: boolean;
  manage_social?: boolean;
  view_members?: boolean;
  manage_teams?: boolean;
  manage_committee?: boolean;
  manage_roles?: boolean;
  manage_settings?: boolean;
  view_approvals?: boolean;
  view_dashboard_stats?: boolean;
}

// All permissions that exist in the system
export const ALL_PERMISSIONS: Permission[] = [
  'manage_events',
  'manage_tasks',
  'manage_finance',
  'approve_finance',
  'manage_social',
  'view_members',
  'manage_teams',
  'manage_committee',
  'manage_roles',
  'manage_settings',
  'view_approvals',
  'view_dashboard_stats',
];

// Permission metadata for UI
export const PERMISSION_METADATA: Record<Permission, { label: string; description: string }> = {
  manage_events: {
    label: 'Manage Events',
    description: 'Create, edit, and delete events',
  },
  manage_tasks: {
    label: 'Manage Tasks',
    description: 'Create and assign tasks',
  },
  manage_finance: {
    label: 'Manage Finance',
    description: 'Add and view financial transactions',
  },
  approve_finance: {
    label: 'Approve Finance',
    description: 'Approve financial transactions',
  },
  manage_social: {
    label: 'Manage Social Media',
    description: 'Create and schedule social posts',
  },
  view_members: {
    label: 'View Members',
    description: 'View member information',
  },
  manage_teams: {
    label: 'Manage Teams',
    description: 'Create and manage teams',
  },
  manage_committee: {
    label: 'Manage Committee',
    description: 'Assign vice-president and manage core members',
  },
  manage_roles: {
    label: 'Manage Roles',
    description: 'Create and edit custom roles',
  },
  manage_settings: {
    label: 'Manage Settings',
    description: 'Change club settings and regenerate codes',
  },
  view_approvals: {
    label: 'View Approvals',
    description: 'View and approve pending member applications',
  },
  view_dashboard_stats: {
    label: 'View Dashboard Stats',
    description: 'View dashboard statistics and metrics',
  },
};

// President has all permissions
export function getPresidentPermissions(): PermissionSet {
  const permissions: PermissionSet = {};
  ALL_PERMISSIONS.forEach((perm) => {
    permissions[perm] = true;
  });
  return permissions;
}

// Vice-President has all permissions except manage_settings and manage_committee (for changing VP)
export function getVicePresidentPermissions(): PermissionSet {
  const permissions: PermissionSet = {};
  ALL_PERMISSIONS.forEach((perm) => {
    if (perm !== 'manage_settings' && perm !== 'manage_committee') {
      permissions[perm] = true;
    }
  });
  return permissions;
}

// Check if a permission set has a specific permission
export function hasPermission(permissions: PermissionSet | null | undefined, permission: Permission): boolean {
  if (!permissions) return false;
  return permissions[permission] === true;
}

// Get effective permissions for a user
// If user is president, return all permissions
// If user is vice-president, return VP permissions
// Otherwise, get permissions from their custom role
export function getUserPermissions(
  isPresident: boolean,
  role: string,
  customRolePermissions: PermissionSet | null | undefined,
): PermissionSet {
  if (isPresident) {
    return getPresidentPermissions();
  }
  if (role === 'Vice-President') {
    return getVicePresidentPermissions();
  }
  return customRolePermissions || {};
}

