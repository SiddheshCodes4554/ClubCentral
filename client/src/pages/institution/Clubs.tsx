import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { InstitutionClubsResponse } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Users, Crown, Calendar, Plus, MoreVertical, UserPlus, Eye, Edit, Trash2, Copy, Check } from 'lucide-react';

export default function InstitutionClubsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignPresidentDialogOpen, setAssignPresidentDialogOpen] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [clubForm, setClubForm] = useState({
    name: '',
    department: '',
    logoUrl: '',
    description: '',
  });

  const [editClubForm, setEditClubForm] = useState({
    name: '',
    department: '',
    logoUrl: '',
    description: '',
  });

  const [presidentForm, setPresidentForm] = useState({
    name: '',
    email: '',
    phone: '',
    enrollmentNumber: '',
    password: '',
  });
  const [assignPresidentNow, setAssignPresidentNow] = useState(true);
  const [useCustomPassword, setUseCustomPassword] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['institution-clubs'],
    queryFn: () => apiRequest<InstitutionClubsResponse>('GET', '/api/institution/clubs'),
  });

  const canCreateClubs = user?.kind === 'institution' && user.role === 'Institution Admin';

  // Fetch club details for view
  const { data: viewClubDetails } = useQuery({
    queryKey: ['institution-club', viewDialogOpen],
    queryFn: () => apiRequest<any>('GET', `/api/institution/club/${viewDialogOpen}`),
    enabled: !!viewDialogOpen,
  });

  // Fetch club details for edit
  const { data: editClubDetails } = useQuery({
    queryKey: ['institution-club', editDialogOpen],
    queryFn: () => apiRequest<any>('GET', `/api/institution/club/${editDialogOpen}`),
    enabled: !!editDialogOpen,
  });

  // Update edit form when club details are loaded
  useEffect(() => {
    if (editClubDetails && editDialogOpen) {
      setEditClubForm({
        name: editClubDetails.club.name || '',
        department: editClubDetails.club.department || '',
        logoUrl: editClubDetails.club.logoUrl || '',
        description: editClubDetails.club.description || '',
      });
    }
  }, [editClubDetails, editDialogOpen]);

  const updateClubMutation = useMutation({
    mutationFn: async ({ clubId, data }: { clubId: string; data: typeof editClubForm }) => {
      return await apiRequest('PATCH', `/api/institution/club/${clubId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-clubs'] });
      queryClient.invalidateQueries({ queryKey: ['institution-dashboard'] });
      setEditDialogOpen(null);
      toast({
        title: 'Club updated',
        description: 'Club information has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update club',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const deleteClubMutation = useMutation({
    mutationFn: async (clubId: string) => {
      return await apiRequest('DELETE', `/api/institution/club/${clubId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-clubs'] });
      queryClient.invalidateQueries({ queryKey: ['institution-dashboard'] });
      setDeleteDialogOpen(null);
      toast({
        title: 'Club deleted',
        description: 'Club has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete club',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const handleEditClub = (clubId: string) => (e: React.FormEvent) => {
    e.preventDefault();
    updateClubMutation.mutate({ clubId, data: editClubForm });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: 'Copied to clipboard',
      description: `${field} copied successfully.`,
    });
  };

  const createClubMutation = useMutation({
    mutationFn: async (data: { clubForm: typeof clubForm; presidentForm: typeof presidentForm }) => {
      return await apiRequest<{ club: any; president: any; invite: { link: string; temporaryPassword: string } }>(
        'POST',
        '/api/institution/club/create',
        {
          clubName: data.clubForm.name,
          department: data.clubForm.department || null,
          logo: data.clubForm.logoUrl || null,
          description: data.clubForm.description || null,
          presidentName: assignPresidentNow ? data.presidentForm.name : undefined,
          presidentEmail: assignPresidentNow ? data.presidentForm.email : undefined,
          presidentPhone: assignPresidentNow ? (data.presidentForm.phone || null) : undefined,
          enrollmentNumber: assignPresidentNow ? (data.presidentForm.enrollmentNumber || null) : undefined,
          presidentPassword: assignPresidentNow && data.presidentForm.password && data.presidentForm.password.trim() !== '' ? data.presidentForm.password : null,
        },
      );
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['institution-clubs'] });
      queryClient.invalidateQueries({ queryKey: ['institution-dashboard'] });
      setCreateDialogOpen(false);
      setClubForm({ name: '', department: '', logoUrl: '', description: '' });
      setPresidentForm({ name: '', email: '', phone: '', enrollmentNumber: '', password: '' });
      setUseCustomPassword(false);
      toast({
        title: 'Club created successfully',
        description: `Club "${response.club.name}" has been created.${response.president ? ` President invite sent to ${response.president.email}` : ''}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create club',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const assignPresidentMutation = useMutation({
    mutationFn: async ({ clubId, presidentData }: { clubId: string; presidentData: typeof presidentForm }) => {
      return await apiRequest<{ president: any; invite: { link: string; temporaryPassword: string } }>(
        'POST',
        '/api/institution/club/assign-president',
        {
          clubId,
          presidentName: presidentData.name,
          presidentEmail: presidentData.email,
          presidentPhone: presidentData.phone || null,
          enrollmentNumber: presidentData.enrollmentNumber || null,
          presidentPassword: presidentData.password && presidentData.password.trim() !== '' ? presidentData.password : null,
        },
      );
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['institution-clubs'] });
      queryClient.invalidateQueries({ queryKey: ['institution-dashboard'] });
      setAssignPresidentDialogOpen(null);
      setPresidentForm({ name: '', email: '', phone: '', enrollmentNumber: '', password: '' });
      setUseCustomPassword(false);
      toast({
        title: 'President assigned',
        description: `Invite sent to ${response.president.email}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to assign president',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const handleCreateClub = (e: React.FormEvent) => {
    e.preventDefault();
    createClubMutation.mutate({ clubForm, presidentForm });
  };

  const handleAssignPresident = (clubId: string) => (e: React.FormEvent) => {
    e.preventDefault();
    assignPresidentMutation.mutate({ clubId, presidentData: presidentForm });
  };

  if (isLoading || !data) {
    return (
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Club Directory</h1>
          <p className="text-sm text-muted-foreground">
            All clubs created by your institution with leadership visibility.
          </p>
        </div>
        {canCreateClubs && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Club
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Club</DialogTitle>
                <DialogDescription>
                  Create a new club. You can assign a president now or later.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateClub} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="club-name">Club Name *</Label>
                    <Input
                      id="club-name"
                      value={clubForm.name}
                      onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="club-department">Department (optional)</Label>
                    <Input
                      id="club-department"
                      value={clubForm.department}
                      onChange={(e) => setClubForm({ ...clubForm, department: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="club-logo">Logo URL (optional)</Label>
                  <Input
                    id="club-logo"
                    type="url"
                    value={clubForm.logoUrl}
                    onChange={(e) => setClubForm({ ...clubForm, logoUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="club-description">Description (optional)</Label>
                  <Textarea
                    id="club-description"
                    value={clubForm.description}
                    onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="assign-president-now"
                      checked={assignPresidentNow}
                      onCheckedChange={(checked) => setAssignPresidentNow(checked as boolean)}
                    />
                    <Label htmlFor="assign-president-now" className="font-semibold text-sm cursor-pointer">
                      Assign President Now
                    </Label>
                  </div>

                  {assignPresidentNow && (
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="president-name">President Name *</Label>
                          <Input
                            id="president-name"
                            value={presidentForm.name}
                            onChange={(e) => setPresidentForm({ ...presidentForm, name: e.target.value })}
                            required={assignPresidentNow}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="president-email">President Email *</Label>
                          <Input
                            id="president-email"
                            type="email"
                            value={presidentForm.email}
                            onChange={(e) => setPresidentForm({ ...presidentForm, email: e.target.value })}
                            required={assignPresidentNow}
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="president-phone">Phone (optional)</Label>
                          <Input
                            id="president-phone"
                            type="tel"
                            value={presidentForm.phone}
                            onChange={(e) => setPresidentForm({ ...presidentForm, phone: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="president-enrollment">Enrollment Number (optional)</Label>
                          <Input
                            id="president-enrollment"
                            value={presidentForm.enrollmentNumber}
                            onChange={(e) => setPresidentForm({ ...presidentForm, enrollmentNumber: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="use-custom-password"
                            checked={useCustomPassword}
                            onCheckedChange={(checked) => {
                              setUseCustomPassword(checked as boolean);
                              if (!checked) {
                                setPresidentForm({ ...presidentForm, password: '' });
                              }
                            }}
                          />
                          <Label htmlFor="use-custom-password" className="text-sm font-normal cursor-pointer">
                            Set custom password (otherwise auto-generated)
                          </Label>
                        </div>
                        {useCustomPassword && (
                          <div className="space-y-2">
                            <Label htmlFor="president-password">Password *</Label>
                            <Input
                              id="president-password"
                              type="password"
                              value={presidentForm.password}
                              onChange={(e) => setPresidentForm({ ...presidentForm, password: e.target.value })}
                              required={useCustomPassword}
                              minLength={6}
                              placeholder="Minimum 6 characters"
                            />
                            <p className="text-xs text-muted-foreground">
                              The president will use this password to login. If not set, a temporary password will be generated and sent via email.
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createClubMutation.isPending}>
                    {createClubMutation.isPending ? 'Creating...' : (assignPresidentNow ? 'Create Club & Assign President' : 'Create Club')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {data.clubs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No clubs yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first club to get started with Institution Mode.
            </p>
            {canCreateClubs && (
              <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create First Club
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.clubs.map((club) => (
            <Card key={club.id} className="border-border/70 hover:border-border transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{club.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{club.department || 'General'}</Badge>
                    {canCreateClubs && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewDialogOpen(club.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditDialogOpen(club.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Club
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setAssignPresidentDialogOpen(club.id)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            {club.president ? 'Reassign President' : 'Assign President'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteDialogOpen(club.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Club
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Performance Index: {club.performanceIndex.toFixed(0)}%
                </p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  <span>
                    President:{' '}
                    {club.president ? (
                      <span className="font-medium text-foreground">{club.president.name}</span>
                    ) : (
                      <span className="text-yellow-600">Not assigned</span>
                    )}
                  </span>
                </div>
                {club.presidentPassword && (
                  <div className="rounded-md bg-muted p-2 text-xs">
                    <div className="font-medium text-foreground mb-1">President Password:</div>
                    <code className="text-primary font-mono">{club.presidentPassword}</code>
                  </div>
                )}
                {club.vicePresident && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>VP: {club.vicePresident.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{club.totalMembers} members</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{club.totalEvents} events</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
      }

      {
        assignPresidentDialogOpen && (
          <Dialog open={!!assignPresidentDialogOpen} onOpenChange={(open) => !open && setAssignPresidentDialogOpen(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign President</DialogTitle>
                <DialogDescription>
                  Assign or reassign the president for this club. They will receive an invite email.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAssignPresident(assignPresidentDialogOpen)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="assign-president-name">President Name *</Label>
                  <Input
                    id="assign-president-name"
                    value={presidentForm.name}
                    onChange={(e) => setPresidentForm({ ...presidentForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assign-president-email">President Email *</Label>
                  <Input
                    id="assign-president-email"
                    type="email"
                    value={presidentForm.email}
                    onChange={(e) => setPresidentForm({ ...presidentForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="assign-president-phone">Phone (optional)</Label>
                    <Input
                      id="assign-president-phone"
                      type="tel"
                      value={presidentForm.phone}
                      onChange={(e) => setPresidentForm({ ...presidentForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assign-president-enrollment">Enrollment Number (optional)</Label>
                    <Input
                      id="assign-president-enrollment"
                      value={presidentForm.enrollmentNumber}
                      onChange={(e) => setPresidentForm({ ...presidentForm, enrollmentNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="assign-use-custom-password"
                      checked={useCustomPassword}
                      onCheckedChange={(checked) => {
                        setUseCustomPassword(checked as boolean);
                        if (!checked) {
                          setPresidentForm({ ...presidentForm, password: '' });
                        }
                      }}
                    />
                    <Label htmlFor="assign-use-custom-password" className="text-sm font-normal cursor-pointer">
                      Set custom password (otherwise auto-generated)
                    </Label>
                  </div>
                  {useCustomPassword && (
                    <div className="space-y-2">
                      <Label htmlFor="assign-president-password">Password *</Label>
                      <Input
                        id="assign-president-password"
                        type="password"
                        value={presidentForm.password}
                        onChange={(e) => setPresidentForm({ ...presidentForm, password: e.target.value })}
                        required={useCustomPassword}
                        minLength={6}
                        placeholder="Minimum 6 characters"
                      />
                      <p className="text-xs text-muted-foreground">
                        The president will use this password to login. If not set, a temporary password will be generated and sent via email.
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setAssignPresidentDialogOpen(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={assignPresidentMutation.isPending}>
                    {assignPresidentMutation.isPending ? 'Assigning...' : 'Assign President'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )
      }

      {/* View Club Details Dialog */}
      {
        viewDialogOpen && viewClubDetails && (
          <Dialog open={!!viewDialogOpen} onOpenChange={(open) => !open && setViewDialogOpen(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Club Details</DialogTitle>
                <DialogDescription>View complete information about the club and president.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Club Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Club Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Club Name</Label>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{viewClubDetails.club.name}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(viewClubDetails.club.name, 'Club Name')}
                        >
                          {copiedField === 'Club Name' ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Department</Label>
                      <p className="text-sm">{viewClubDetails.club.department || 'General'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Club Code</Label>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{viewClubDetails.club.clubCode}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(viewClubDetails.club.clubCode, 'Club Code')}
                        >
                          {copiedField === 'Club Code' ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Club ID</Label>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded break-all">
                          {viewClubDetails.club.id}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(viewClubDetails.club.id, 'Club ID')}
                        >
                          {copiedField === 'Club ID' ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {viewClubDetails.club.logoUrl && (
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-xs text-muted-foreground">Logo URL</Label>
                        <p className="text-sm break-all">{viewClubDetails.club.logoUrl}</p>
                      </div>
                    )}
                    {viewClubDetails.club.description && (
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-xs text-muted-foreground">Description</Label>
                        <p className="text-sm">{viewClubDetails.club.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* President Information */}
                {viewClubDetails.president && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-sm">President Information</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">President Name</Label>
                        <p className="text-sm font-medium">{viewClubDetails.president.name}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Email</Label>
                        <div className="flex items-center gap-2">
                          <p className="text-sm">{viewClubDetails.president.email}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(viewClubDetails.president.email, 'Email')}
                          >
                            {copiedField === 'Email' ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">President ID</Label>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-muted px-2 py-1 rounded break-all">
                            {viewClubDetails.president.id}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(viewClubDetails.president.id, 'President ID')}
                          >
                            {copiedField === 'President ID' ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {viewClubDetails.president.phone && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Phone</Label>
                          <p className="text-sm">{viewClubDetails.president.phone}</p>
                        </div>
                      )}
                      {viewClubDetails.club.presidentPassword && (
                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-xs text-muted-foreground">Password</Label>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono bg-muted px-3 py-2 rounded flex-1">
                              {viewClubDetails.club.presidentPassword}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => copyToClipboard(viewClubDetails.club.presidentPassword, 'Password')}
                            >
                              {copiedField === 'Password' ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Statistics */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-sm">Statistics</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Total Members</Label>
                      <p className="text-2xl font-bold">{viewClubDetails.members.length}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Total Events</Label>
                      <p className="text-2xl font-bold">{viewClubDetails.events.length}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Performance Index</Label>
                      <p className="text-2xl font-bold">
                        {parseFloat(String(viewClubDetails.club.performanceIndex ?? 0)).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewDialogOpen(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      }

      {/* Edit Club Dialog */}
      {
        editDialogOpen && (
          <Dialog open={!!editDialogOpen} onOpenChange={(open) => !open && setEditDialogOpen(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Club</DialogTitle>
                <DialogDescription>Update club information.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditClub(editDialogOpen)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-club-name">Club Name *</Label>
                    <Input
                      id="edit-club-name"
                      value={editClubForm.name}
                      onChange={(e) => setEditClubForm({ ...editClubForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-club-department">Department (optional)</Label>
                    <Input
                      id="edit-club-department"
                      value={editClubForm.department}
                      onChange={(e) => setEditClubForm({ ...editClubForm, department: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-club-logo">Logo URL (optional)</Label>
                  <Input
                    id="edit-club-logo"
                    type="url"
                    value={editClubForm.logoUrl}
                    onChange={(e) => setEditClubForm({ ...editClubForm, logoUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-club-description">Description (optional)</Label>
                  <Textarea
                    id="edit-club-description"
                    value={editClubForm.description}
                    onChange={(e) => setEditClubForm({ ...editClubForm, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateClubMutation.isPending}>
                    {updateClubMutation.isPending ? 'Updating...' : 'Update Club'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )
      }

      {/* Delete Club Dialog */}
      {
        deleteDialogOpen && (
          <AlertDialog open={!!deleteDialogOpen} onOpenChange={(open) => !open && setDeleteDialogOpen(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the club, all members, events, tasks,
                  finance records, and social posts associated with it.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteClubMutation.mutate(deleteDialogOpen)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteClubMutation.isPending}
                >
                  {deleteClubMutation.isPending ? 'Deleting...' : 'Delete Club'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      }
    </div >
  );
}

