import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, DollarSign, Share2, UserCheck, CheckSquare, AlertTriangle } from 'lucide-react';
import { useLocation } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardStats } from '@/types/api';
import type { Club } from '@shared/schema';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user || user.kind !== 'club') {
    return null;
  }

  const {
    data: stats,
    isLoading: isStatsLoading,
    isError: isStatsError,
    error: statsError,
  } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', user?.clubId, user?.id],
    queryFn: () => apiRequest<DashboardStats>('GET', '/api/dashboard/stats'),
    enabled: !!user?.clubId && !!user?.id,
    staleTime: 30000, // Cache for 30 seconds instead of 0
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds instead of 15
  });

  const { data: club, isError: isClubError, error: clubError, isLoading: isClubLoading } = useQuery<Club>({
    queryKey: ['club', user?.clubId, user?.id],
    queryFn: () => apiRequest<Club>('GET', '/api/club'),
    enabled: !!user?.clubId && !!user?.id,
    staleTime: 60000, // Cache club data for 1 minute
  });

  if (isStatsLoading || isClubLoading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const isAdmin = user?.isPresident || user?.role === 'Vice-President';

  const quickActions = [
    {
      title: 'Create Event',
      icon: Calendar,
      action: () => setLocation('/events'),
      show: true,
    },
    {
      title: 'Add Finance Entry',
      icon: DollarSign,
      action: () => setLocation('/finance'),
      show: true,
    },
    {
      title: 'Schedule Social Post',
      icon: Share2,
      action: () => setLocation('/social'),
      show: true,
    },
  ];

  const statsLoadFailed = isStatsError || !stats;
  const clubLoadFailed = isClubError || !club;

  return (
    <div className="p-8 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">
          Welcome back, {user?.name}!
        </h1>
        {clubLoadFailed ? (
          <Alert variant="destructive" className="max-w-xl">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Unable to load club details</AlertTitle>
            <AlertDescription>
              {clubError instanceof Error ? clubError.message : 'Please refresh the page or try again later.'}
            </AlertDescription>
          </Alert>
        ) : club ? (
          <p className="text-muted-foreground">
            Managing <span className="font-bold">{club.name}</span>
          </p>
        ) : (
          <Skeleton className="h-4 w-48" />
        )}
        <p className="text-muted-foreground">Here's what's happening with your club today.</p>
      </div>

      {statsLoadFailed && (
        <Alert variant="destructive" className="max-w-2xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Dashboard stats are unavailable</AlertTitle>
          <AlertDescription>
            {statsError instanceof Error
              ? statsError.message
              : 'We could not load the latest stats. Please refresh or try again later.'}
          </AlertDescription>
        </Alert>
      )}

      {isAdmin && (
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {quickActions.filter((a) => a.show).map((action) => (
                <Button
                  key={action.title}
                  onClick={action.action}
                  variant="outline"
                  className="gap-2"
                  data-testid={`button-${action.title.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <action.icon className="h-4 w-4" />
                  {action.title}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!statsLoadFailed && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.pendingMembers !== null && (
            <Card
              className="hover-elevate cursor-pointer"
              onClick={() => setLocation('/approvals')}
              data-testid="card-pending-approvals"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-pending-count">
                  {stats.pendingMembers}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Applications awaiting review</p>
              </CardContent>
            </Card>
          )}

          {stats.totalMembers !== null && (
            <Card
              className="hover-elevate cursor-pointer"
              onClick={() => setLocation('/members')}
              data-testid="card-members"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-members-count">
                  {stats.totalMembers}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.coreMembers ?? 0} core members
                </p>
              </CardContent>
            </Card>
          )}

          {stats.activeEvents !== null && (
            <Card
              className="hover-elevate cursor-pointer"
              onClick={() => setLocation('/events')}
              data-testid="card-events"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-events-count">
                  {stats.activeEvents}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.upcomingEvents ?? 0} upcoming
                </p>
              </CardContent>
            </Card>
          )}

          {stats.pendingTasks !== null && (
            <Card
              className="hover-elevate cursor-pointer"
              onClick={() => setLocation('/tasks')}
              data-testid="card-tasks"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-tasks-count">
                  {stats.pendingTasks}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.myTasks ?? 0} assigned to you
                </p>
              </CardContent>
            </Card>
          )}

          {stats.balance !== null && (
            <Card
              className="hover-elevate cursor-pointer"
              onClick={() => setLocation('/finance')}
              data-testid="card-finance"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-budget">
                  ₹{stats.balance}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.pendingTransactions ?? 0} pending approvals
                </p>
              </CardContent>
            </Card>
          )}

          {stats.scheduledPosts !== null && (
            <Card
              className="hover-elevate cursor-pointer"
              onClick={() => setLocation('/social')}
              data-testid="card-social"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled Posts</CardTitle>
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-scheduled-posts">
                  {stats.scheduledPosts}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.draftPosts ?? 0} drafts
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
