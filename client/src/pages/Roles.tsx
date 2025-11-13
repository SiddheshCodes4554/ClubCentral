import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const PERMISSIONS = [
  { id: 'manage_events', label: 'Manage Events', description: 'Create, edit, and delete events' },
  { id: 'manage_tasks', label: 'Manage Tasks', description: 'Create and assign tasks' },
  { id: 'manage_finance', label: 'Manage Finance', description: 'Add and view financial transactions' },
  { id: 'approve_finance', label: 'Approve Finance', description: 'Approve financial transactions' },
  { id: 'manage_social', label: 'Manage Social Media', description: 'Create and schedule social posts' },
  { id: 'view_members', label: 'View Members', description: 'View member information' },
];

export default function Roles() {
  const [open, setOpen] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const { data: roles, isLoading } = useQuery({
    queryKey: ['/api/roles'],
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; permissions: Record<string, boolean> }) => {
      return await apiRequest('POST', '/api/roles', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      setOpen(false);
      setRoleName('');
      setPermissions({});
      toast({
        title: 'Role created',
        description: 'The custom role has been created successfully.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRoleMutation.mutate({ name: roleName, permissions });
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-role">
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Custom Role</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="roleName">Role Name</Label>
                <Input
                  id="roleName"
                  placeholder="e.g., Content Head, Finance Head"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  required
                  data-testid="input-role-name"
                />
              </div>

              <div className="space-y-4">
                <Label>Permissions</Label>
                <div className="grid gap-4">
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
              </div>

              <Button type="submit" className="w-full" disabled={createRoleMutation.isPending} data-testid="button-submit-role">
                {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
              </Button>
            </form>
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
          roles.map((role: any) => (
            <Card key={role.id} data-testid={`card-role-${role.id}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Permissions</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(role.permissions || {})
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
                  {Object.values(role.permissions || {}).filter(Boolean).length === 0 && (
                    <p className="text-sm text-muted-foreground">No permissions assigned</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
