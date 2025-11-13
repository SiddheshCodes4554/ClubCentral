import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Copy, RefreshCw, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function Settings() {
  const { toast } = useToast();

  const { data: club, isLoading } = useQuery({
    queryKey: ['/api/club'],
  });

  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState('');

  const updateClubMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PATCH', '/api/club', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/club'] });
      toast({
        title: 'Settings updated',
        description: 'Club settings have been updated successfully.',
      });
    },
  });

  const regenerateCodeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/club/regenerate-code', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/club'] });
      toast({
        title: 'Code regenerated',
        description: 'A new club code has been generated.',
      });
    },
  });

  const deleteClubMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', '/api/club', {});
    },
    onSuccess: () => {
      localStorage.clear();
      window.location.href = '/login';
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateClubMutation.mutate({
      name: name || undefined,
      logoUrl: logoUrl || undefined,
      description: description || undefined,
    });
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/apply/${club?.clubCode}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link copied!',
      description: 'Invite link has been copied to clipboard.',
    });
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-semibold mb-6">Club Settings</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Club Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Club Name</Label>
                <Input
                  id="name"
                  defaultValue={club?.name}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={club?.name}
                  data-testid="input-club-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  type="url"
                  defaultValue={club?.logoUrl}
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder={club?.logoUrl || 'https://...'}
                  data-testid="input-logo-url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  defaultValue={club?.description}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={club?.description || 'Tell us about your club...'}
                  rows={4}
                  data-testid="input-description"
                />
              </div>

              <Button type="submit" disabled={updateClubMutation.isPending} data-testid="button-update-club">
                {updateClubMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Club Code</Label>
              <div className="flex gap-3 mt-2">
                <Input
                  value={club?.clubCode}
                  readOnly
                  className="font-mono"
                  data-testid="text-club-code"
                />
                <Button
                  variant="outline"
                  onClick={copyInviteLink}
                  data-testid="button-copy-invite-link"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => regenerateCodeMutation.mutate()}
              disabled={regenerateCodeMutation.isPending}
              data-testid="button-regenerate-code"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate Code
            </Button>

            <p className="text-sm text-muted-foreground">
              Share the invite link with potential members. They'll need to apply and wait for your approval.
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" data-testid="button-delete-club">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Club
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your club,
                    all members, events, tasks, finance records, and social posts.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteClubMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    data-testid="button-confirm-delete"
                  >
                    Delete Club
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-sm text-muted-foreground mt-3">
              Once you delete a club, there is no going back. Please be certain.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
