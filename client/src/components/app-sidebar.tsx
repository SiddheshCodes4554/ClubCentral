import { useAuth } from '@/lib/auth';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Calendar,
  CheckSquare,
  DollarSign,
  Share2,
  Settings,
  UserCheck,
  LogOut,
  UserSquare2,
  Users2,
  Shield,
  BarChart3,
  FileText,
  Vote,
} from 'lucide-react';
import { hasPermission } from '@/lib/permissions';
import { Link, useLocation } from 'wouter';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  if (user.kind === 'institution') {
    const institutionMenu = [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/institution/dashboard' },
      { label: 'Club Directory', icon: Users2, path: '/institution/clubs' },
      { label: 'Elections', icon: Vote, path: '/institution/elections' },
      { label: 'Finance Oversight', icon: DollarSign, path: '/institution/finance' },
      { label: 'Member Insights', icon: Users, path: '/institution/members' },
      { label: 'Analytics', icon: BarChart3, path: '/institution/analytics' },
      { label: 'Reports & Exports', icon: FileText, path: '/institution/reports' },
    ];

    const getInitials = (name: string) =>
      name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
      <Sidebar>
        <SidebarHeader className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img src="/Logo.png" alt="Club Central" className="h-10 w-auto object-contain" />
            <div className="flex-1 min-w-0">
              <Badge variant="secondary" className="text-xs mt-1 rounded-full capitalize">
                {user.role}
              </Badge>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Institution Mode
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {institutionMenu.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={location === item.path}>
                      <Link href={item.path}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={logout} className="w-full justify-start gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </SidebarFooter>
      </Sidebar>
    );
  }

  const permissions = user.permissions || {};

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      show: hasPermission(permissions, 'view_dashboard_stats'),
    },
    {
      label: 'Pending Approvals',
      icon: UserCheck,
      path: '/approvals',
      show: hasPermission(permissions, 'view_approvals'),
    },
    {
      label: 'Members',
      icon: Users,
      path: '/members',
      show: hasPermission(permissions, 'view_members'),
    },
    {
      label: 'Teams',
      icon: Users2,
      path: '/teams',
      show: hasPermission(permissions, 'manage_teams') || hasPermission(permissions, 'view_members'),
    },
    {
      label: 'Committee',
      icon: UserSquare2,
      path: '/committee',
      show: hasPermission(permissions, 'manage_committee'),
    },
    {
      label: 'Roles',
      icon: UserCog,
      path: '/roles',
      show: hasPermission(permissions, 'manage_roles'),
    },
    {
      label: 'Events',
      icon: Calendar,
      path: '/events',
      show: hasPermission(permissions, 'manage_events'),
    },
    {
      label: 'Tasks',
      icon: CheckSquare,
      path: '/tasks',
      show: hasPermission(permissions, 'manage_tasks'),
    },
    {
      label: 'Finance',
      icon: DollarSign,
      path: '/finance',
      show: hasPermission(permissions, 'manage_finance') || hasPermission(permissions, 'approve_finance'),
    },
    {
      label: 'Social Media',
      icon: Share2,
      path: '/social',
      show: hasPermission(permissions, 'manage_social'),
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      show: hasPermission(permissions, 'manage_settings'),
    },
    {
      label: 'My Permissions',
      icon: Shield,
      path: '/permissions',
      show: true, // All users can view their own permissions
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img
            src="/Logo.png"
            alt="Club Central"
            className="h-10 w-auto object-contain"
          />
          <div className="flex-1 min-w-0">
            <Badge variant="secondary" className="text-xs mt-1 rounded-full">
              {user.role}
            </Badge>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.filter(item => item.show).map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={location === item.path} data-testid={`link-${item.label.toLowerCase().replace(/\s/g, '-')}`}>
                    <Link href={item.path}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="w-full justify-start gap-2"
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
