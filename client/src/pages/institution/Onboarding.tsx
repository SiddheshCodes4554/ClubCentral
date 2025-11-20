import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { AuthResponse, AuthUser } from '@/types/api';
import { Building2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function InstitutionOnboarding() {
  const [institutionName, setInstitutionName] = useState('');
  const [institutionType, setInstitutionType] = useState('College');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const normalizeUser = (user: AuthUser) => ({
    kind: 'institution' as const,
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    institutionId: (user as any).institutionId,
    department: (user as any).department ?? null,
    permissions: (user as any).permissions || {},
  });

  const mutation = useMutation({
    mutationFn: async () => {
      return await apiRequest<AuthResponse>('POST', '/api/institution/create', {
        institutionName,
        institutionType,
        adminName,
        adminEmail,
        password,
        phoneNumber,
        notes: notes || undefined,
      });
    },
    onSuccess: (response) => {
      login(response.token, normalizeUser(response.user));
      toast({
        title: 'Institution workspace created',
        description: `${institutionName} is now live.`,
      });
      setLocation('/institution/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: 'Onboarding failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-4xl shadow-xl border-border/70">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-2xl">Institution Onboarding</CardTitle>
              <CardDescription>
                Provision Institution Mode access for multi-club management.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="institutionName">Institution Name *</Label>
                <Input
                  id="institutionName"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="institutionType">Institution Type *</Label>
                <Input
                  id="institutionType"
                  value={institutionType}
                  onChange={(e) => setInstitutionType(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="adminName">Admin Name *</Label>
                <Input
                  id="adminName"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  type="tel"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes for ClubCentral Team (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share context about your institution, timelines, or specific requirements."
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating workspace...' : 'Provision Institution Workspace'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

