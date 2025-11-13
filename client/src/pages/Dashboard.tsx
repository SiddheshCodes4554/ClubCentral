import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, DollarSign, Share2, UserCheck, CheckSquare } from 'lucide-react';
import { useLocation } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  if (isLoading) {
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground">Here's what's happening with your club today.</p>
      </div>

      {isAdmin && (
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {quickActions.filter(a => a.show).map((action) => (
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isAdmin && (
          <Card className="hover-elevate cursor-pointer" onClick={() => setLocation('/approvals')} data-testid="card-pending-approvals">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-pending-count">{stats?.pendingMembers || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">Applications awaiting review</p>
            </CardContent>
          </Card>
        )}

        <Card className="hover-elevate cursor-pointer" onClick={() => setLocation('/members')} data-testid="card-members">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-members-count">{stats?.totalMembers || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats?.coreMembers || 0} core members
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer" onClick={() => setLocation('/events')} data-testid="card-events">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-events-count">{stats?.activeEvents || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats?.upcomingEvents || 0} upcoming
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer" onClick={() => setLocation('/tasks')} data-testid="card-tasks">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-tasks-count">{stats?.pendingTasks || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats?.myTasks || 0} assigned to you
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer" onClick={() => setLocation('/finance')} data-testid="card-finance">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-budget">${stats?.balance || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats?.pendingTransactions || 0} pending approvals
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer" onClick={() => setLocation('/social')} data-testid="card-social">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Posts</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-scheduled-posts">{stats?.scheduledPosts || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats?.draftPosts || 0} drafts
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
