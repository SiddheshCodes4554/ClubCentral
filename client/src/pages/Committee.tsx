import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import type { CommitteeResponse, CommitteeMember } from '@/types/api';
import type { Role } from '@shared/schema';
import { Crown, Shield, UserPlus, ArrowRight, RefreshCw, Trash2 } from 'lucide-react';

const formatName = (user: CommitteeMember | null) => user?.name ?? 'Unassigned';

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export default function Committee() {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!user || user.kind !== 'club') {
    return null;
  }

  const isPresident = !!user?.isPresident;
  const isAdmin = isPresident || user?.role === 'Vice-President';

  const [assignViceOpen, setAssignViceOpen] = useState(false);
  const [selectedViceId, setSelectedViceId] = useState('');

  const [promoteOpen, setPromoteOpen] = useState(false);
  const [selectedPromotionId, setSelectedPromotionId] = useState('');
  const [promotionRole, setPromotionRole] = useState('Council Head');

  const [roleEdits, setRoleEdits] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery<CommitteeResponse>({
    queryKey: ['/api/committee'],
    enabled: isAdmin,
  });

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['/api/roles'],
    enabled: isAdmin,
  });

  // Standard roles that are always available
  const standardRoles = ['Council Head', 'Member'];
  
  // Get role names from custom roles
  const customRoleNames = roles.map((role) => role.name);
  
  // Combine standard and custom roles, removing duplicates
  // Also include any roles currently assigned to members that might not be in the list
  // Create a map of role name to role ID for custom roles
  const roleNameToIdMap = useMemo(() => {
    const map = new Map<string, string>();
    roles.forEach((role) => {
      map.set(role.name, role.id);
    });
    return map;
  }, [roles]);

  const availableRoles = useMemo(() => {
    const memberRoles = data?.coreMembers?.map((m) => m.role).filter(Boolean) || [];
    const allRoles = [...standardRoles, ...customRoleNames, ...memberRoles];
    return Array.from(new Set(allRoles)).sort();
  }, [customRoleNames, data?.coreMembers]);

  useEffect(() => {
    if (data) {
      const next: Record<string, string> = {};
      data.coreMembers.forEach((member) => {
        next[member.id] = member.role;
      });
      setRoleEdits(next);
    }
  }, [data]);

  const viceCandidates = useMemo(() => {
    if (!data) return [] as CommitteeMember[];
    const all = [...data.coreMembers, ...data.availableMembers];
    const unique = new Map<string, CommitteeMember>();
    all.forEach((member) => {
      if (!member.isPresident) {
        unique.set(member.id, member);
      }
    });
    return Array.from(unique.values());
  }, [data]);

  const assignViceMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return await apiRequest<{ vicePresident: CommitteeMember }>('POST', '/api/committee/vice', {
        userId: memberId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/committee'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setAssignViceOpen(false);
      setSelectedViceId('');
      toast({ title: 'Vice-President updated' });
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to assign vice-president',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const promoteMemberMutation = useMutation({
    mutationFn: async ({ userId, role, roleId }: { userId: string; role: string; roleId?: string }) => {
      return await apiRequest<{ member: CommitteeMember }>('POST', '/api/committee/core', {
        userId,
        role,
        roleId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/committee'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setPromoteOpen(false);
      setSelectedPromotionId('');
      setPromotionRole('Council Head');
      toast({ title: 'Core member added' });
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to promote member',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, role, roleId }: { id: string; role: string; roleId?: string }) => {
      return await apiRequest<{ member: CommitteeMember }>('PATCH', `/api/committee/core/${id}`, {
        role,
        roleId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/committee'] });
      toast({ title: 'Core member updated' });
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to update member',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest<{ member: CommitteeMember }>('DELETE', `/api/committee/core/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/committee'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({ title: 'Core member removed' });
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to remove member',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (!isAdmin) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Committee</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Only presidents and vice-presidents can view and manage the committee.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const { president, vicePresident, coreMembers, availableMembers } = data;
  const hasVice = !!vicePresident;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Committee</h1>
          <p className="text-sm text-muted-foreground">
            Manage leadership roles and core members with dashboard access.
          </p>
        </div>
        {isPresident && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setPromoteOpen(true)}
            disabled={availableMembers.length === 0 || promoteMemberMutation.isPending}
          >
            <UserPlus className="h-4 w-4" /> Promote Member
          </Button>
        )}
      </div>

      <section className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" /> President
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {president ? (
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{getInitials(president.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{president.name}</p>
                  <p className="text-sm text-muted-foreground">{president.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">President not assigned.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Vice-President
            </CardTitle>
            {isPresident && (
              <Dialog open={assignViceOpen} onOpenChange={setAssignViceOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    {hasVice ? 'Change Vice-President' : 'Assign Vice-President'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Vice-President</DialogTitle>
                    <DialogDescription>
                      Select a core member to serve as vice-president. The previous vice-president will be demoted automatically.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="vice-select">Club member</Label>
                    <select
                      id="vice-select"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedViceId}
                      onChange={(event) => setSelectedViceId(event.target.value)}
                    >
                      <option value="" disabled>
                        Select member
                      </option>
                      {viceCandidates.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} — {member.role || 'Member'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAssignViceOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => assignViceMutation.mutate(selectedViceId)}
                      disabled={!selectedViceId || assignViceMutation.isPending}
                      className="gap-2"
                    >
                      {assignViceMutation.isPending ? 'Assigning…' : 'Assign'}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {vicePresident ? (
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{getInitials(vicePresident.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{vicePresident.name}</p>
                  <p className="text-sm text-muted-foreground">{vicePresident.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No vice-president assigned yet.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Core Members</h2>
            <p className="text-sm text-muted-foreground">
              Core members have control panel access. Promote members or update their roles.
            </p>
          </div>
          <Badge variant="secondary">{coreMembers.length} active</Badge>
        </div>

        {coreMembers.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              No core members yet. Promote a member to grant dashboard access.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {coreMembers.map((member) => {
              const pendingRole = roleEdits[member.id] ?? member.role;
              const roleChanged = pendingRole !== member.role;
              return (
                <Card key={member.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base leading-tight">{member.name}</CardTitle>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="mt-auto space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`role-${member.id}`}>Role</Label>
                      <Select
                        value={pendingRole}
                        onValueChange={(value) =>
                          setRoleEdits((prev) => ({ ...prev, [member.id]: value }))
                        }
                      >
                        <SelectTrigger id={`role-${member.id}`}>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map((roleName) => (
                            <SelectItem key={roleName} value={roleName}>
                              {roleName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="gap-2"
                        disabled={!roleChanged || updateMemberMutation.isPending}
                        onClick={() => {
                          const selectedRoleName = pendingRole || member.role;
                          const selectedRoleId = roleNameToIdMap.get(selectedRoleName);
                          updateMemberMutation.mutate({ 
                            id: member.id, 
                            role: selectedRoleName,
                            roleId: selectedRoleId,
                          });
                        }}
                      >
                        {updateMemberMutation.isPending ? 'Saving…' : 'Save Changes'}
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            className="gap-2"
                            disabled={removeMemberMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" /> Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove core access?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This member will lose dashboard access but remain in the club roster.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeMemberMutation.mutate(member.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Confirm
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Eligible Members</h2>
        <p className="text-sm text-muted-foreground">
          These members can be promoted to core roles with dashboard access.
        </p>
        {availableMembers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              All approved members already have dashboard access.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {availableMembers.map((member) => (
                  <div key={member.id} className="rounded-lg border p-4">
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    <p className="text-xs text-muted-foreground mt-2">Current role: {member.role || 'Member'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote member to core team</DialogTitle>
            <DialogDescription>
              Promoted members receive dashboard access and can take on leadership roles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="promote-member">Member</Label>
              <select
                id="promote-member"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedPromotionId}
                onChange={(event) => setSelectedPromotionId(event.target.value)}
              >
                <option value="" disabled>
                  Select member
                </option>
                {availableMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} — {member.role || 'Member'}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="promote-role">Role</Label>
              <Select
                value={promotionRole}
                onValueChange={setPromotionRole}
              >
                <SelectTrigger id="promote-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((roleName) => (
                    <SelectItem key={roleName} value={roleName}>
                      {roleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const selectedRoleId = roleNameToIdMap.get(promotionRole);
                promoteMemberMutation.mutate({
                  userId: selectedPromotionId,
                  role: promotionRole,
                  roleId: selectedRoleId,
                });
              }}
              disabled={
                !selectedPromotionId || promotionRole.trim() === '' || promoteMemberMutation.isPending
              }
              className="gap-2"
            >
              {promoteMemberMutation.isPending ? 'Promoting…' : 'Promote'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
