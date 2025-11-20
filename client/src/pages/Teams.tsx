import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Users, Trash2, Pencil, Shield, Crown, Download } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TeamsResponse, TeamResponse, TeamMemberResponse, CommitteeMember } from '@/types/api';

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const filterAvailableMembers = (available: CommitteeMember[], team: TeamResponse) => {
  const teamMemberIds = new Set(team.members.map((member) => member.id));
  return available.filter((member) => !teamMemberIds.has(member.id));
};

export default function Teams() {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!user || user.kind !== 'club') {
    return null;
  }

  const isAdmin = !!user && (user.isPresident || user.role === 'Vice-President');
  const canManageTeams = isAdmin;
  const canViewTeams = !!user;

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createSelectedMemberIds, setCreateSelectedMemberIds] = useState<string[]>([]);
  const [createCaptainId, setCreateCaptainId] = useState('none');

  const [editTeam, setEditTeam] = useState<TeamResponse | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [addMemberTeam, setAddMemberTeam] = useState<TeamResponse | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberRole, setMemberRole] = useState('');

  const [memberRoleEdits, setMemberRoleEdits] = useState<Record<string, string>>({});
  const [isExportingTeams, setIsExportingTeams] = useState(false);

  const { data, isLoading, isError, error } = useQuery<TeamsResponse>({
    queryKey: ['/api/teams'],
    enabled: canViewTeams,
  });

  const teams = data?.teams ?? [];
  const availableMembers = data?.availableMembers ?? [];
  const selectedCreateMembers = availableMembers.filter((member) =>
    createSelectedMemberIds.includes(member.id),
  );

  useEffect(() => {
    setMemberRoleEdits((prev) => {
      const next: Record<string, string> = {};
      teams.forEach((team) => {
        team.members.forEach((member) => {
          const key = `${team.id}:${member.id}`;
          next[key] = prev[key] ?? member.memberRole ?? '';
        });
      });
      return next;
    });
  }, [teams]);

  useEffect(() => {
    if (createCaptainId !== 'none' && !createSelectedMemberIds.includes(createCaptainId)) {
      setCreateCaptainId('none');
    }
  }, [createSelectedMemberIds, createCaptainId]);

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest<{ team: TeamResponse }>('POST', '/api/teams', {
        name: createName.trim(),
        description: createDescription || undefined,
        memberIds: createSelectedMemberIds,
        captainId: createCaptainId === 'none' ? null : createCaptainId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      setCreateOpen(false);
      setCreateName('');
      setCreateDescription('');
      setCreateSelectedMemberIds([]);
      setCreateCaptainId('none');
      toast({ title: 'Team created' });
    },
    onError: (error: any) => {
      toast({ title: 'Unable to create team', description: error.message, variant: 'destructive' });
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      return await apiRequest<{ team: TeamResponse }>('PATCH', `/api/teams/${teamId}`, {
        name: editName.trim(),
        description: editDescription || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      setEditTeam(null);
      toast({ title: 'Team updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Unable to update team', description: error.message, variant: 'destructive' });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      return await apiRequest<{ message: string }>('DELETE', `/api/teams/${teamId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      toast({ title: 'Team deleted' });
    },
    onError: (error: any) => {
      toast({ title: 'Unable to delete team', description: error.message, variant: 'destructive' });
    },
  });

  const assignCaptainMutation = useMutation({
    mutationFn: async ({ teamId, captainId }: { teamId: string; captainId: string | null }) => {
      return await apiRequest<{ team: TeamResponse }>('PATCH', `/api/teams/${teamId}`, {
        captainId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      toast({ title: 'Captain updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Unable to assign captain', description: error.message, variant: 'destructive' });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (teamId: string) => {
      return await apiRequest<{ team: TeamResponse }>('POST', `/api/teams/${teamId}/members`, {
        userId: selectedMemberId,
        memberRole: memberRole || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      setAddMemberTeam(null);
      setSelectedMemberId('');
      setMemberRole('');
      toast({ title: 'Member added to team' });
    },
    onError: (error: any) => {
      toast({ title: 'Unable to add member', description: error.message, variant: 'destructive' });
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ teamId, userId, memberRole }: { teamId: string; userId: string; memberRole: string }) => {
      return await apiRequest<{ team: TeamResponse }>('PATCH', `/api/teams/${teamId}/members/${userId}`, {
        memberRole: memberRole || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      toast({ title: 'Member updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Unable to update member', description: error.message, variant: 'destructive' });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      return await apiRequest<{ team: TeamResponse }>('DELETE', `/api/teams/${teamId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      toast({ title: 'Member removed from team' });
    },
    onError: (error: any) => {
      toast({ title: 'Unable to remove member', description: error.message, variant: 'destructive' });
    },
  });

  const handleOpenEdit = (team: TeamResponse) => {
    setEditTeam(team);
    setEditName(team.name);
    setEditDescription(team.description ?? '');
  };

  const handleOpenAddMember = (team: TeamResponse) => {
    setAddMemberTeam(team);
    setSelectedMemberId('');
    setMemberRole('');
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

  const handleExportTeams = async () => {
    try {
      setIsExportingTeams(true);
      const response = await fetch('/api/export/teams', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Unable to export teams right now.');
      }

      const blob = await response.blob();
      downloadBlob(blob, `teams-with-members-${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: 'Export ready',
        description: 'Teams list downloaded successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsExportingTeams(false);
    }
  };

  if (!canViewTeams) {
    return null;
  }

  if (isLoading && !data) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Unable to load teams right now.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Teams</h1>
          <p className="text-sm text-muted-foreground">Organize members into teams to collaborate on tasks and projects.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportTeams}
            disabled={isExportingTeams}
            data-testid="button-export-teams"
          >
            <Download className="h-4 w-4" />
            {isExportingTeams ? 'Exporting…' : 'Export Teams'}
          </Button>
          {canManageTeams && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Create Team
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new team</DialogTitle>
                <DialogDescription>Teams allow you to group members and assign responsibilities together.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team Name *</Label>
                  <Input
                    id="team-name"
                    value={createName}
                    onChange={(event) => setCreateName(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-description">Description</Label>
                  <Textarea
                    id="team-description"
                    value={createDescription}
                    onChange={(event) => setCreateDescription(event.target.value)}
                    placeholder="Describe the team's responsibilities"
                    rows={3}
                  />
                </div>
              <div className="space-y-2">
                <Label>Assign Members</Label>
                {availableMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No members available to add right now.</p>
                ) : (
                  <ScrollArea className="h-48 rounded-md border p-3">
                    <div className="space-y-2">
                      {availableMembers.map((member) => {
                        const isChecked = createSelectedMemberIds.includes(member.id);
                        return (
                          <label key={member.id} className="flex items-center gap-3 text-sm">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                setCreateSelectedMemberIds((prev) => {
                                  if (checked === true) {
                                    if (prev.includes(member.id)) return prev;
                                    return [...prev, member.id];
                                  }
                                  return prev.filter((id) => id !== member.id);
                                });
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{member.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                            </div>
                            <Badge variant="outline">{member.role}</Badge>
                          </label>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
                <p className="text-xs text-muted-foreground">
                  Selected: {createSelectedMemberIds.length}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-head">Team Head</Label>
                <Select
                  value={createCaptainId}
                  onValueChange={setCreateCaptainId}
                  disabled={createSelectedMemberIds.length === 0}
                >
                  <SelectTrigger id="team-head">
                    <SelectValue placeholder="Select team head" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No head yet</SelectItem>
                    {selectedCreateMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {createSelectedMemberIds.length === 0
                    ? 'Select members above before assigning a head.'
                    : 'Optional: Pick a member to lead this team.'}
                </p>
              </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => createTeamMutation.mutate()}
                disabled={
                  createTeamMutation.isPending ||
                  createName.trim() === '' ||
                  (createCaptainId !== 'none' && !createSelectedMemberIds.includes(createCaptainId))
                }
                >
                  {createTeamMutation.isPending ? 'Creating…' : 'Create Team'}
                </Button>
              </DialogFooter>
            </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {!canManageTeams && (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              You can view teams and their members. Contact a president or vice-president for changes.
            </p>
          </CardContent>
        </Card>
      )}

      {teams.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground text-sm">
            {canManageTeams
              ? 'No teams yet. Create your first team to start organizing members.'
              : 'No teams have been set up yet. Please contact a president or vice-president to create one.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {teams.map((team) => {
            const availableForTeam = filterAvailableMembers(availableMembers, team);

            return (
              <Card key={team.id} className="flex flex-col">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" /> {team.name}
                      </CardTitle>
                      {team.description && (
                        <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
                      )}
                    </div>
                    {canManageTeams && (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(team)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this team?</AlertDialogTitle>
                              <AlertDialogDescription>This will remove the team and unlink any tasks assigned to it.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteTeamMutation.mutate(team.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Captain
                    </Label>
                    <Select
                      value={team.captainId ?? 'none'}
                      onValueChange={(value) =>
                        assignCaptainMutation.mutate({
                          teamId: team.id,
                          captainId: value === 'none' ? null : value,
                        })
                      }
                      disabled={!canManageTeams}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No captain" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No captain</SelectItem>
                        {team.members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {team.captain && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>{getInitials(team.captain.name)}</AvatarFallback>
                        </Avatar>
                        <span>{team.captain.name}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Members ({team.members.length})</p>
                    {canManageTeams && (
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => handleOpenAddMember(team)} disabled={availableForTeam.length === 0}>
                        <Plus className="h-4 w-4" /> Add member
                      </Button>
                    )}
                  </div>

                  {team.members.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No members yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {team.members.map((member) => (
                        <div key={member.id} className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{member.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                            </div>
                            <Badge variant="secondary">{member.role}</Badge>
                          </div>
                          <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                            {(() => {
                              const key = `${team.id}:${member.id}`;
                              const pendingRole = memberRoleEdits[key] ?? member.memberRole ?? '';
                              return (
                                <>
                                  <Input
                                    value={pendingRole}
                                    onChange={(event) =>
                                      setMemberRoleEdits((prev) => ({ ...prev, [key]: event.target.value }))
                                    }
                                    placeholder="Member role (optional)"
                                    readOnly={!canManageTeams}
                                  />
                                  {canManageTeams && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-2"
                                      disabled={
                                        updateMemberRoleMutation.isPending ||
                                      pendingRole === (member.memberRole ?? '') ||
                                      pendingRole.trim() === ''
                                      }
                                      onClick={() =>
                                        updateMemberRoleMutation.mutate({
                                          teamId: team.id,
                                          userId: member.id,
                                          memberRole: pendingRole,
                                        })
                                      }
                                    >
                                      Save
                                    </Button>
                                  )}
                                </>
                              );
                            })()}
                            {canManageTeams && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive"
                                onClick={() => removeMemberMutation.mutate({ teamId: team.id, userId: member.id })}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {canManageTeams && (
        <>
          <Dialog open={!!editTeam} onOpenChange={(value) => !value && setEditTeam(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit team</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-team-name">Team Name *</Label>
                  <Input
                    id="edit-team-name"
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-team-description">Description</Label>
                  <Textarea
                    id="edit-team-description"
                    value={editDescription}
                    onChange={(event) => setEditDescription(event.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditTeam(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => editTeam && updateTeamMutation.mutate(editTeam.id)}
                  disabled={!editTeam || editName.trim() === '' || updateTeamMutation.isPending}
                >
                  {updateTeamMutation.isPending ? 'Saving…' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={!!addMemberTeam} onOpenChange={(value) => !value && setAddMemberTeam(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add team member</DialogTitle>
                <DialogDescription>Select a member from the club to add to this team.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team-member-select">Member</Label>
                  <Select
                    value={selectedMemberId}
                    onValueChange={setSelectedMemberId}
                  >
                    <SelectTrigger id="team-member-select">
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {addMemberTeam && filterAvailableMembers(availableMembers, addMemberTeam).map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-member-role">Member Role</Label>
                  <Input
                    id="team-member-role"
                    value={memberRole}
                    onChange={(event) => setMemberRole(event.target.value)}
                    placeholder="Optional role in this team"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddMemberTeam(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => addMemberTeam && addMemberMutation.mutate(addMemberTeam.id)}
                  disabled={!addMemberTeam || selectedMemberId === '' || addMemberMutation.isPending}
                >
                  {addMemberMutation.isPending ? 'Adding…' : 'Add Member'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
