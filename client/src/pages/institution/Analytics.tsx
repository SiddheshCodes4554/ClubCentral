import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { InstitutionAnalyticsResponse } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function InstitutionAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['institution-analytics'],
    queryFn: () => apiRequest<InstitutionAnalyticsResponse>('GET', '/api/institution/analytics'),
  });

  if (isLoading || !data) {
    return (
      <div className="p-6">
        <Card className="animate-pulse h-40" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Institution Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Advanced KPIs across clubs, tasks, budget usage, and event success.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Task Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{data.taskEfficiency}%</p>
            <p className="text-xs text-muted-foreground">Institution-wide completion rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Budget Effectiveness</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{data.budgetEffectiveness}%</p>
            <p className="text-xs text-muted-foreground">Spend vs allocated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Event Success Index</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{data.eventSuccessIndex}%</p>
            <p className="text-xs text-muted-foreground">Completed vs scheduled events</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Active Clubs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.topClubs.map((club) => (
            <div
              key={club.clubId}
              className="flex flex-col gap-1 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold">{club.clubName}</p>
                <p className="text-xs text-muted-foreground">
                  {club.department || 'General'} • Task efficiency {club.taskEfficiency}%
                </p>
              </div>
              <Badge variant="outline">{club.performanceScore.toFixed(0)} pts</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

