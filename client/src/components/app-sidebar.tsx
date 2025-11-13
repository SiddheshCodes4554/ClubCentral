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
  Building2,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const isPresident = user.isPresident;
  const isVP = user.role === 'Vice-President';
  const isAdmin = isPresident || isVP;

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      show: true,
    },
    {
      label: 'Pending Approvals',
      icon: UserCheck,
      path: '/approvals',
      show: isAdmin,
    },
    {
      label: 'Members',
      icon: Users,
      path: '/members',
      show: true,
    },
    {
      label: 'Roles',
      icon: UserCog,
      path: '/roles',
      show: isPresident,
    },
    {
      label: 'Events',
      icon: Calendar,
      path: '/events',
      show: true,
    },
    {
      label: 'Tasks',
      icon: CheckSquare,
      path: '/tasks',
      show: true,
    },
    {
      label: 'Finance',
      icon: DollarSign,
      path: '/finance',
      show: true,
    },
    {
      label: 'Social Media',
      icon: Share2,
      path: '/social',
      show: true,
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      show: isPresident,
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
          <div className="h-10 w-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Building2 className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm text-sidebar-foreground truncate">ClubCentral</h2>
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
