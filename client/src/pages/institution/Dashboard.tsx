import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { InstitutionDashboardResponse } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Building2, Activity, Users, Calendar } from 'lucide-react';

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

import { useAuth } from '@/lib/auth';

function DashboardContent() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['institution-dashboard', (user as any)?.institutionId],
    queryFn: () => apiRequest<InstitutionDashboardResponse>('GET', '/api/institution/dashboard'),
  });

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={idx} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const { metrics, budget, tasks, charts, clubPerformance } = data;

  return (
    <div className="p-6 space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Clubs"
          value={metrics.totalClubs}
          description={`${metrics.eventsThisMonth} events this month`}
          icon={Building2}
        />
        <MetricCard
          title="Registered Members"
          value={metrics.totalMembers}
          description={`${metrics.totalCoreMembers} core members`}
          icon={Users}
        />
        <MetricCard
          title="Upcoming Events"
          value={metrics.upcomingEvents}
          description={`${metrics.totalEvents} total events`}
          icon={Calendar}
        />
        <MetricCard
          title="Task Completion"
          value={`${metrics.taskCompletionRate}%`}
          description={`${tasks.completed}/${tasks.total} tasks done`}
          icon={Activity}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Events Per Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {charts.eventsPerMonth.map((entry) => (
              <div key={entry.month} className="flex items-center justify-between text-sm">
                <span>{entry.month}</span>
                <Badge variant="secondary">{entry.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Assigned</span>
              <span className="font-semibold">₹{budget.assigned.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Spent</span>
              <span className="font-semibold text-green-600">₹{budget.spent.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Pending Approval</span>
              <span className="font-semibold text-yellow-600">
                ₹{budget.pendingApproval.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Performing Clubs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {clubPerformance.slice(0, 5).map((club) => (
            <div
              key={club.clubId}
              className="flex flex-col gap-1 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold">{club.clubName}</p>
                <p className="text-xs text-muted-foreground">
                  {club.department || 'General'} · {club.members} members · {club.events} events
                </p>
              </div>
              <Badge variant="outline" className="text-sm">
                Performance {club.performanceIndex.toFixed(0)}%
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function InstitutionDashboard() {
  return <DashboardContent />;
}

