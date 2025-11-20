import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { ArrowLeft, Shield, Building2, Sparkles, Home } from 'lucide-react';

export default function Signup() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-3xl shadow-xl border-border/80">
        <CardHeader className="space-y-3 text-center">
          <div className="flex items-center justify-between">
            <img src="/Logo.png" alt="Club Central" className="h-12 w-auto object-contain" />
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setLocation('/')}>
                <Home className="h-4 w-4 mr-2" />
                Back to main page
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setLocation('/login')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to login
              </Button>
            </div>
          </div>
          <CardTitle className="text-3xl font-semibold">Institution Mode Required</CardTitle>
          <CardDescription className="text-base">
            Club creation is now part of the enterprise Institution Mode. Students can no longer create
            clubs directly—your institution administrator will onboard you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border bg-muted/40 p-4">
              <Shield className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold mb-1">Verified Institutions Only</h3>
              <p className="text-sm text-muted-foreground">
                Clubs are provisioned by Institution Admins to maintain official oversight.
              </p>
            </div>
            <div className="rounded-xl border bg-muted/40 p-4">
              <Building2 className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold mb-1">Multi-Club Command Center</h3>
              <p className="text-sm text-muted-foreground">
                Manage presidents, finance, and events across every club from a single dashboard.
              </p>
            </div>
            <div className="rounded-xl border bg-muted/40 p-4">
              <Sparkles className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold mb-1">Premium Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Institution dashboards deliver performance scoring, heatmaps, finance insights, and more.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border bg-gradient-to-r from-background via-background to-muted p-6 space-y-4">
            <h4 className="text-lg font-semibold">How to get started</h4>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li>1. Share this page with your Institution Admin or Student Affairs office.</li>
              <li>2. They’ll complete the Institution Onboarding and receive the admin console.</li>
              <li>3. Presidents are invited directly by the Institution Admin with a secure login link.</li>
              <li>4. Students can then apply using the official club invite code shared by leadership.</li>
            </ol>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium">
                Institution ready to launch?
              </p>
              <Button onClick={() => setLocation('/institution/onboarding')} className="gap-2">
                Begin Institution Onboarding
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
