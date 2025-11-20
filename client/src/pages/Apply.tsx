import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { MessageResponse } from '@/types/api';
import type { Club } from '@shared/schema';

export default function Apply() {
  const [, params] = useRoute('/apply/:clubCode');
  const clubCode = params?.clubCode || '';
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [portfolio, setPortfolio] = useState('');

  const { data: club, isLoading } = useQuery<Club | null>({
    queryKey: ['/api/clubs/verify', clubCode],
    enabled: !!clubCode,
    queryFn: async () => {
      if (!clubCode) return null;
      return await apiRequest<Club>('GET', `/api/clubs/verify/${clubCode}`);
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest<MessageResponse>('POST', '/api/members/apply', data);
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: 'Application submitted!',
        description: 'Please wait for approval from the club president.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Application failed',
        description: error.message || 'Could not submit application',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyMutation.mutate({
      clubCode,
      name,
      email,
      password,
      phone: phone || undefined,
      idNumber: idNumber || undefined,
      linkedin: linkedin || undefined,
      portfolio: portfolio || undefined,
    });
  };

  if (!clubCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Invalid club invitation link</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Loading club information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 pb-12 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2">Application Submitted!</h2>
              <p className="text-muted-foreground">
                Your application to join {club?.name} has been submitted successfully.
                You'll be notified once the president reviews your application.
              </p>
            </div>
            <Button onClick={() => setLocation('/login')} data-testid="button-go-to-login">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4 mb-4">
              <img 
                src="/Logo.png" 
                alt="Club Central" 
                className="h-16 w-auto object-contain"
              />
              <div>
                <CardTitle className="text-2xl">Join {club?.name}</CardTitle>
                <CardDescription>{club?.collegeName}</CardDescription>
              </div>
            </div>
            {club?.description && (
              <p className="text-sm text-muted-foreground">{club.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    data-testid="input-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    data-testid="input-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    data-testid="input-phone"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idNumber">Student/Employee ID Number</Label>
                <Input
                  id="idNumber"
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  data-testid="input-id-number"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn Profile</Label>
                  <Input
                    id="linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    data-testid="input-linkedin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio">Portfolio/GitHub</Label>
                  <Input
                    id="portfolio"
                    type="url"
                    placeholder="https://github.com/..."
                    value={portfolio}
                    onChange={(e) => setPortfolio(e.target.value)}
                    data-testid="input-portfolio"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={applyMutation.isPending}
                data-testid="button-submit-application"
              >
                {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
