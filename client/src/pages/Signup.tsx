import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Building2, ArrowLeft, ArrowRight } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Progress } from '@/components/ui/progress';

export default function Signup() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clubName, setClubName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState('');
  
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const signupMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/auth/register-president', data);
    },
    onSuccess: (data) => {
      login(data.token, data.user);
      toast({
        title: 'Club created successfully!',
        description: `Welcome to ClubCentral, ${data.user.name}!`,
      });
      setLocation('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: 'Signup failed',
        description: error.message || 'Could not create club',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signupMutation.mutate({
      name,
      email,
      password,
      clubName,
      collegeName,
      logoUrl: logoUrl || undefined,
      description: description || undefined,
    });
  };

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-7 w-7 text-primary-foreground" />
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation('/login')}
              data-testid="button-back-to-login"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </div>
          <CardTitle className="text-2xl font-semibold">Create Your Club</CardTitle>
          <CardDescription>
            Step {step} of 3: {step === 1 ? 'Your Information' : step === 2 ? 'Club Details' : 'Review & Confirm'}
          </CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    data-testid="input-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Your Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="president@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    data-testid="input-password"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clubName">Club Name *</Label>
                  <Input
                    id="clubName"
                    type="text"
                    placeholder="Tech Club"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    required
                    data-testid="input-club-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collegeName">College/University Name *</Label>
                  <Input
                    id="collegeName"
                    type="text"
                    placeholder="State University"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    required
                    data-testid="input-college-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL (optional)</Label>
                  <Input
                    id="logoUrl"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    data-testid="input-logo-url"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Club Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell us about your club..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    data-testid="input-description"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-muted p-6 rounded-lg space-y-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">President</h3>
                    <p className="font-medium">{name}</p>
                    <p className="text-sm text-muted-foreground">{email}</p>
                  </div>
                  <div className="h-px bg-border" />
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Club</h3>
                    <p className="font-medium">{clubName}</p>
                    <p className="text-sm text-muted-foreground">{collegeName}</p>
                    {description && (
                      <p className="text-sm text-muted-foreground mt-2">{description}</p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  By creating this club, you'll become the President with full administrative access.
                  You'll receive a unique club code to invite members.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  data-testid="button-previous"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="ml-auto"
                  data-testid="button-next"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={signupMutation.isPending}
                  className="ml-auto"
                  data-testid="button-create-club"
                >
                  {signupMutation.isPending ? 'Creating Club...' : 'Create Club'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
