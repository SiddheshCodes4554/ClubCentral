import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Plus, Shield, ArrowLeft, ArrowRight, Pencil, Trash2, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { Role } from '@shared/schema';

import { PERMISSION_METADATA, ALL_PERMISSIONS, type Permission } from '@shared/permissions';

const PERMISSIONS = ALL_PERMISSIONS.map((id) => ({
  id,
  ...PERMISSION_METADATA[id],
}));

export default function Roles() {
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [step, setStep] = useState<'name' | 'permissions'>('name');
  const [roleName, setRoleName] = useState('');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [viewingRole, setViewingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const { toast } = useToast();

  const { data: roles = [], isLoading } = useQuery<Role[]>({
    queryKey: ['/api/roles'],
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; permissions: Record<string, boolean> }) => {
      return await apiRequest<Role>('POST', '/api/roles', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      setOpen(false);
      setStep('name');
      setRoleName('');
      setPermissions({});
      toast({
        title: 'Role created',
        description: 'The custom role has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to create role',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; permissions: Record<string, boolean> } }) => {
      return await apiRequest<Role>('PATCH', `/api/roles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      setEditOpen(false);
      setEditingRole(null);
      setStep('name');
      setRoleName('');
      setPermissions({});
      toast({
        title: 'Role updated',
        description: 'The custom role has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to update role',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest<{ message: string }>('DELETE', `/api/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      setDeleteOpen(false);
      setDeletingRole(null);
      toast({
        title: 'Role deleted',
        description: 'The custom role has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to delete role',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roleName.trim()) {
      setStep('permissions');
    }
  };

  const handlePermissionsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure all permissions are properly formatted
    const formattedPermissions: Record<string, boolean> = {};
    ALL_PERMISSIONS.forEach((perm) => {
      formattedPermissions[perm] = permissions[perm] === true;
    });
    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data: { name: roleName.trim(), permissions: formattedPermissions } });
    } else {
      createRoleMutation.mutate({ name: roleName.trim(), permissions: formattedPermissions });
    }
  };

  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    const rolePerms = (role.permissions as Record<string, boolean> | null) ?? {};
    setPermissions(rolePerms);
    setStep('name');
    setEditOpen(true);
  };

  const openViewDialog = (role: Role) => {
    setViewingRole(role);
    setViewOpen(true);
  };

  const openDeleteDialog = (role: Role) => {
    setDeletingRole(role);
    setDeleteOpen(true);
  };

  const handleEditDialogOpenChange = (isOpen: boolean) => {
    setEditOpen(isOpen);
    if (!isOpen) {
      setEditingRole(null);
      setStep('name');
      setRoleName('');
      setPermissions({});
    }
  };

  const handleDialogOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset form when dialog closes
      setStep('name');
      setRoleName('');
      setPermissions({});
    }
  };

  const togglePermission = (permissionId: string) => {
    setPermissions(prev => ({
      ...prev,
      [permissionId]: !prev[permissionId],
    }));
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">Custom Roles</h1>
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-role">
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {step === 'name' ? 'Create Custom Role' : `Assign Permissions to "${roleName}"`}
              </DialogTitle>
            </DialogHeader>
            
            {step === 'name' ? (
              <form onSubmit={handleNameSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="space-y-4 flex-1">
                  <div className="space-y-2">
                    <Label htmlFor="roleName">Role Name</Label>
                    <Input
                      id="roleName"
                      placeholder="e.g., Content Head, Finance Head"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      required
                      data-testid="input-role-name"
                      autoFocus
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter a descriptive name for this role. You'll assign permissions in the next step.
                    </p>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!roleName.trim()}>
                    Next: Assign Permissions
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <form onSubmit={handlePermissionsSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="space-y-4 flex-1 min-h-0">
                  <div className="space-y-2">
                    <Label>Select Permissions</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose which permissions members with this role will have.
                    </p>
                  </div>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="grid gap-3 pb-4">
                      {PERMISSIONS.map((permission) => (
                        <div key={permission.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                          <Checkbox
                            id={permission.id}
                            checked={!!permissions[permission.id]}
                            onCheckedChange={() => togglePermission(permission.id)}
                            data-testid={`checkbox-${permission.id}`}
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={permission.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {permission.label}
                            </label>
                            <p className="text-xs text-muted-foreground mt-1">{permission.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('name')}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createRoleMutation.isPending} data-testid="button-submit-role">
                    {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={editOpen} onOpenChange={handleEditDialogOpenChange}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {step === 'name' ? `Edit Role: ${editingRole?.name}` : `Update Permissions for "${roleName}"`}
              </DialogTitle>
            </DialogHeader>
            
            {step === 'name' ? (
              <form onSubmit={handleNameSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="space-y-4 flex-1">
                  <div className="space-y-2">
                    <Label htmlFor="edit-roleName">Role Name</Label>
                    <Input
                      id="edit-roleName"
                      placeholder="e.g., Content Head, Finance Head"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      required
                      autoFocus
                    />
                    <p className="text-sm text-muted-foreground">
                      Update the role name. You'll review permissions in the next step.
                    </p>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleEditDialogOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!roleName.trim()}>
                    Next: Review Permissions
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <form onSubmit={handlePermissionsSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="space-y-4 flex-1 min-h-0">
                  <div className="space-y-2">
                    <Label>Select Permissions</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose which permissions members with this role will have.
                    </p>
                  </div>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="grid gap-3 pb-4">
                      {PERMISSIONS.map((permission) => (
                        <div key={permission.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                          <Checkbox
                            id={`edit-${permission.id}`}
                            checked={!!permissions[permission.id]}
                            onCheckedChange={() => togglePermission(permission.id)}
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`edit-${permission.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {permission.label}
                            </label>
                            <p className="text-xs text-muted-foreground mt-1">{permission.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('name')}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleEditDialogOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateRoleMutation.isPending}>
                    {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* View Role Dialog */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>View Role: {viewingRole?.name}</DialogTitle>
            </DialogHeader>
            {viewingRole && (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="space-y-4 flex-1 min-h-0">
                  <div className="space-y-2">
                    <Label>Role Name</Label>
                    <p className="text-sm font-medium">{viewingRole.name}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="grid gap-3 pb-4">
                        {PERMISSIONS.map((permission) => {
                          const rolePerms = (viewingRole.permissions as Record<string, boolean> | null) ?? {};
                          const hasPermission = rolePerms[permission.id] === true;
                          return (
                            <div key={permission.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                              <div className={`h-5 w-5 rounded-full flex items-center justify-center mt-0.5 ${hasPermission ? 'bg-green-500' : 'bg-gray-300'}`}>
                                {hasPermission ? '✓' : ''}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{permission.label}</p>
                                <p className="text-xs text-muted-foreground mt-1">{permission.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button variant="outline" onClick={() => setViewOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!roles || roles.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No custom roles created yet</p>
            </CardContent>
          </Card>
        ) : (
          roles.map((role) => {
            const rolePermissions = (role.permissions as Record<string, boolean> | null) ?? {};

            return (
              <Card key={role.id} data-testid={`card-role-${role.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewDialog(role)}
                        data-testid={`button-view-role-${role.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(role)}
                        data-testid={`button-edit-role-${role.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog open={deleteOpen && deletingRole?.id === role.id} onOpenChange={(open) => {
                        if (!open) {
                          setDeleteOpen(false);
                          setDeletingRole(null);
                        }
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(role)}
                            data-testid={`button-delete-role-${role.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Role</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{role.name}"? This action cannot be undone. Members assigned to this role will lose their custom permissions.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => deleteRoleMutation.mutate(role.id)}
                              disabled={deleteRoleMutation.isPending}
                            >
                              {deleteRoleMutation.isPending ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Permissions</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(rolePermissions)
                        .filter(([, value]) => value)
                        .map(([key]) => {
                          const perm = PERMISSIONS.find(p => p.id === key);
                          return perm ? (
                            <Badge key={key} variant="secondary" className="text-xs">
                              {perm.label}
                            </Badge>
                          ) : null;
                        })}
                    </div>
                    {Object.values(rolePermissions).filter(Boolean).length === 0 && (
                      <p className="text-sm text-muted-foreground">No permissions assigned</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
