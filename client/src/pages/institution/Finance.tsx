import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { InstitutionFinanceResponse } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function InstitutionFinancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['institution-finance'],
    queryFn: () => apiRequest<InstitutionFinanceResponse>('GET', '/api/institution/finance'),
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
        <h1 className="text-2xl font-semibold">Finance Oversight</h1>
        <p className="text-sm text-muted-foreground">
          View spend by club, track pending approvals, and export data.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Finance Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 text-sm text-muted-foreground">
          <div>
            <p>Total Spend</p>
            <p className="text-xl font-semibold text-foreground">₹{data.metrics.totalSpent.toLocaleString()}</p>
          </div>
          <div>
            <p>Pending Approvals</p>
            <p className="text-xl font-semibold text-yellow-600">{data.metrics.pendingApprovals}</p>
          </div>
          <div>
            <p>Top Category</p>
            <p className="text-xl font-semibold text-foreground">
              {Object.entries(data.categories).sort((a, b) => b[1] - a[1])[0]?.[0]}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spend by Club</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.clubSpend.map((club) => (
            <div key={club.clubId} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{club.clubName}</p>
                <p className="text-xs text-muted-foreground">{club.department || 'General'}</p>
              </div>
              <Badge variant="outline">₹{club.totalSpend.toLocaleString()}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

