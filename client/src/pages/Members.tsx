import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { User, Club } from '@shared/schema';
import { Label } from '@/components/ui/label';

export default function Members() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportingRegularMembers, setIsExportingRegularMembers] = useState(false);
  const { toast } = useToast();

  const { data: members = [], isLoading: isMembersLoading } = useQuery<User[]>({
    queryKey: ['/api/members'],
  });

  const { data: club, isLoading: isClubLoading } = useQuery<Club>({
    queryKey: ['/api/club'],
  });

  const regenerateCodeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest<Club>('POST', '/api/club/regenerate-code', {});
    },
    onSuccess: (updatedClub) => {
      queryClient.setQueryData(['/api/club'], updatedClub);
      toast({
        title: 'Invite code regenerated',
        description: 'Share the new link with your members.',
      });
    },
  });

  const inviteLink = useMemo(() => {
    if (!club) return '';
    return `${window.location.origin}/apply/${club.clubCode}`;
  }, [club]);

  const handleCopyInvite = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: 'Invite link copied',
      description: 'Share it with prospective members.',
    });
  };

  const coreMembers = members.filter((m) => m.canLogin);
  const regularMembers = members.filter((m) => !m.canLogin);

  const filterMembers = (membersList: User[]) => {
    return membersList.filter((m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportRegularMembers = async () => {
    try {
      setIsExportingRegularMembers(true);
      const response = await fetch('/api/export/members?type=regular', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Unable to export members right now.');
      }

      const blob = await response.blob();
      downloadBlob(blob, `regular-members-${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: 'Export ready',
        description: 'Regular members list downloaded successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsExportingRegularMembers(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const MemberTable = ({ membersList }: { membersList: User[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {membersList.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
              No members found
            </TableCell>
          </TableRow>
        ) : (
          membersList.map((member) => (
            <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={member.isPresident ? 'default' : 'secondary'}>
                  {member.role}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {member.phone && <p>{member.phone}</p>}
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                      LinkedIn
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(member.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  if (isMembersLoading || isClubLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold">Members</h1>
          {club && (
            <p className="text-muted-foreground mt-1">{club.name}</p>
          )}
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
          <div className="flex-1">
            <Label className="text-sm text-muted-foreground">Invite Link</Label>
            <div className="flex gap-2 mt-1">
              <Input value={inviteLink} readOnly className="font-mono" />
              <Button variant="outline" onClick={handleCopyInvite} disabled={!inviteLink}>
                <Copy className="h-4 w-4 mr-2" /> Copy
              </Button>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => regenerateCodeMutation.mutate()}
            disabled={regenerateCodeMutation.isPending}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {regenerateCodeMutation.isPending ? 'Regenerating…' : 'New Link'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="core" className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="core" data-testid="tab-core-members">
              Core Members ({coreMembers.length})
            </TabsTrigger>
            <TabsTrigger value="regular" data-testid="tab-regular-members">
              Regular Members ({regularMembers.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleExportRegularMembers}
              disabled={isExportingRegularMembers}
              data-testid="button-export-regular-members"
            >
              <Download className="h-4 w-4" />
              {isExportingRegularMembers ? 'Exporting…' : 'Export Regular Members'}
            </Button>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-members"
              />
            </div>
          </div>
        </div>

        <TabsContent value="core">
          <Card>
            <CardHeader>
              <CardTitle>Core Council Members</CardTitle>
              <p className="text-sm text-muted-foreground">Members with login access and management permissions</p>
            </CardHeader>
            <CardContent>
              <MemberTable membersList={filterMembers(coreMembers)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regular">
          <Card>
            <CardHeader>
              <CardTitle>Regular Members</CardTitle>
              <p className="text-sm text-muted-foreground">Record-only members without login access</p>
            </CardHeader>
            <CardContent>
              <MemberTable membersList={filterMembers(regularMembers)} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
