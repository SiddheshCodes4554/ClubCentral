import { useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LinkIcon, ArrowRight, ArrowUpRight, Home } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { AuthResponse, AuthUser } from '@/types/api';
import type { Club } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institutionEmail, setInstitutionEmail] = useState('');
  const [institutionPassword, setInstitutionPassword] = useState('');
  const [mode, setMode] = useState<'club' | 'institution'>('club');
  const [joinCode, setJoinCode] = useState('');
  const [verifiedClub, setVerifiedClub] = useState<{ club: Club; code: string } | null>(null);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const normalizeUser = (user: AuthUser) => {
    if (user.accountType === 'institution') {
      return {
        kind: 'institution' as const,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institutionId: user.institutionId,
        department: user.department ?? null,
        permissions: user.permissions || {},
      };
    }
    return {
      kind: 'club' as const,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isPresident: user.isPresident,
      clubId: user.clubId,
      permissions: user.permissions,
    };
  };

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return await apiRequest<AuthResponse>('POST', '/api/auth/login', data);
    },
    onSuccess: async (data) => {
      const normalizedUser = normalizeUser(data.user);
      // Verify the user data matches what we expect
      if (normalizedUser.kind === 'club' && !normalizedUser.clubId) {
        console.error('[LOGIN ERROR] User missing clubId:', data.user);
        toast({
          title: 'Login error',
          description: 'User data is incomplete. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      login(data.token, normalizedUser);
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${data.user.name}`,
      });
      setLocation('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
    },
  });

  const institutionLoginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      return await apiRequest<AuthResponse>('POST', '/api/auth/institution/login', credentials);
    },
    onSuccess: (data) => {
      login(data.token, normalizeUser(data.user));
      toast({
        title: 'Institution access granted',
        description: data.user.name,
      });
      setLocation('/institution/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: 'Institution login failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const normalized = code.trim().toUpperCase();
      const club = await apiRequest<Club>('GET', `/api/clubs/verify/${normalized}`);
      return { club, code: normalized };
    },
    onSuccess: (result) => {
      setVerifiedClub(result);
      toast({
        title: 'Club found',
        description: `${result.club.name} · ${result.club.collegeName}`,
      });
    },
    onError: (error: any) => {
      setVerifiedClub(null);
      toast({
        title: 'Invalid club code',
        description: error.message || 'Please check the invite code and try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'institution') {
      institutionLoginMutation.mutate({ email: institutionEmail, password: institutionPassword });
    } else {
      loginMutation.mutate({ email, password });
    }
  };

  const handleVerifyCode = () => {
    if (!joinCode.trim()) {
      toast({
        title: 'Enter a club code',
        description: 'Paste or type the code you received before verifying.',
      });
      return;
    }
    verifyCodeMutation.mutate(joinCode);
  };

  const handleCopyInvite = () => {
    if (!verifiedClub) return;
    if (typeof window === 'undefined') return;
    const link = `${window.location.origin}/apply/${verifiedClub.code}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Invite link copied',
      description: link,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-5xl grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="p-6 lg:p-8 space-y-6">
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setLocation('/')}>
              <Home className="h-4 w-4 mr-2" />
              Back to main page
            </Button>
          </div>
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <img src="/Logo.png" alt="Club Central" className="h-16 w-auto object-contain" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold">Welcome to Club Central</CardTitle>
              <CardDescription>Choose how you would like to access the workspace</CardDescription>
            </div>
          </div>

          <Tabs value={mode} onValueChange={(value) => setMode(value as 'club' | 'institution')}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="club">Club Leadership Login</TabsTrigger>
              <TabsTrigger value="institution">Institution Admin Login</TabsTrigger>
            </TabsList>

            <TabsContent value="club">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="club-email">Email</Label>
                  <Input
                    id="club-email"
                    type="email"
                    placeholder="your.email@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="club-password">Password</Label>
                  <Input
                    id="club-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    data-testid="input-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-4">
                Presidents or Vice-Presidents can invite teammates from the Members page. Students must apply
                using an invite code.
              </p>
            </TabsContent>

            <TabsContent value="institution">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="institution-email">Institution Admin Email</Label>
                  <Input
                    id="institution-email"
                    type="email"
                    placeholder="admin@university.edu"
                    value={institutionEmail}
                    onChange={(e) => setInstitutionEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution-password">Password</Label>
                  <Input
                    id="institution-password"
                    type="password"
                    placeholder="Secure password"
                    value={institutionPassword}
                    onChange={(e) => setInstitutionPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={institutionLoginMutation.isPending}
                >
                  {institutionLoginMutation.isPending ? 'Signing in...' : 'Sign In as Institution'}
                </Button>
              </form>
              <div className="mt-6 p-4 rounded-lg border bg-muted/40">
                <p className="text-sm text-muted-foreground mb-3">
                  New to Institution Mode?
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setLocation('/institution/onboarding')}
                >
                  Start Institution Onboarding <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t lg:border-t-0 lg:border-l p-6 lg:p-8 space-y-6 bg-muted/40">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <LinkIcon className="h-5 w-5" /> Join an existing club
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter the invite code you received to preview the club before applying.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="joinCode">Club invite code</Label>
            <div className="flex gap-2">
              <Input
                id="joinCode"
                placeholder="e.g. ABCD1234"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  setVerifiedClub(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleVerifyCode();
                  }
                }}
              />
              <Button type="button" onClick={handleVerifyCode} disabled={verifyCodeMutation.isPending}>
                {verifyCodeMutation.isPending ? 'Checking…' : 'Check'}
              </Button>
            </div>
          </div>

          {verifiedClub && (
            <div className="rounded-lg border bg-background p-4 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Club</p>
                <h3 className="text-xl font-semibold">{verifiedClub.club.name}</h3>
                <p className="text-sm text-muted-foreground">{verifiedClub.club.collegeName}</p>
                {verifiedClub.club.description && (
                  <p className="text-sm mt-2 text-muted-foreground">
                    {verifiedClub.club.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Invite link</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/apply/${verifiedClub.code}`}
                  />
                  <Button type="button" variant="outline" onClick={handleCopyInvite}>
                    Copy
                  </Button>
                </div>
              </div>

              <Button
                type="button"
                className="w-full gap-2"
                onClick={() => setLocation(`/apply/${verifiedClub.code}`)}
              >
                Apply to join <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {!verifiedClub && (
            <p className="text-xs text-muted-foreground">
              When you verify a code you'll see the club details and can jump straight to the application page.
            </p>
          )}

          <div className="pt-4 border-t text-sm text-muted-foreground space-y-2">
            <p className="font-medium">Need to share your club?</p>
            <p>
              Presidents can copy the invite link from the Members or Settings page and send it directly –
              anyone with the link can apply without entering the code manually.
            </p>
          </div>

          <div className="pt-4 border-t space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Enterprise Institution Mode
            </h3>
            <p className="text-sm text-muted-foreground">
              Only verified Institution Admins can create clubs and assign leadership. Students should request
              access from their institution.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
