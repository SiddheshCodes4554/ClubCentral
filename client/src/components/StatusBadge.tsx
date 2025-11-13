import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const normalized = status.toLowerCase();
    
    if (normalized === 'pending' || normalized === 'draft') {
      return 'secondary';
    }
    if (normalized === 'approved' || normalized === 'completed' || normalized === 'done' || normalized === 'posted') {
      return 'default';
    }
    if (normalized === 'rejected' || normalized === 'cancelled') {
      return 'destructive';
    }
    if (normalized === 'in progress' || normalized === 'ongoing' || normalized === 'scheduled') {
      return 'outline';
    }
    return 'secondary';
  };

  return (
    <Badge variant={getVariant(status)} className="rounded-full" data-testid={`badge-${status.toLowerCase()}`}>
      {status}
    </Badge>
  );
}
