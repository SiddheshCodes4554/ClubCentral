import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Check, X } from 'lucide-react';
import { PERMISSION_METADATA, ALL_PERMISSIONS, type Permission } from '@shared/permissions';
import { hasPermission } from '@/lib/permissions';

export default function Permissions() {
  const { user } = useAuth();

  if (!user || user.kind !== 'club') {
    return null;
  }

  if (!user) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const permissions = user.permissions || {};
  const grantedPermissions = ALL_PERMISSIONS.filter((perm) => hasPermission(permissions, perm));
  const deniedPermissions = ALL_PERMISSIONS.filter((perm) => !hasPermission(permissions, perm));

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">My Permissions</h1>
        <p className="text-sm text-muted-foreground">
          View the permissions assigned to your role. Only the president can modify permissions.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Your Role
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <p className="text-lg font-semibold">{user.role}</p>
            </div>
            {user.isPresident && (
              <Badge variant="default" className="w-fit">
                President
              </Badge>
            )}
            {user.role === 'Vice-President' && (
              <Badge variant="secondary" className="w-fit">
                Vice-President
              </Badge>
            )}
            <p className="text-sm text-muted-foreground">
              {grantedPermissions.length} of {ALL_PERMISSIONS.length} permissions granted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permission Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">{grantedPermissions.length} Granted</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="text-sm font-medium">{deniedPermissions.length} Not Granted</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ALL_PERMISSIONS.map((permission) => {
              const metadata = PERMISSION_METADATA[permission];
              const isGranted = hasPermission(permissions, permission);

              return (
                <div
                  key={permission}
                  className={`flex items-start gap-3 p-4 rounded-lg border ${
                    isGranted ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-gray-50/50'
                  }`}
                >
                  <div className="mt-0.5">
                    {isGranted ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{metadata.label}</p>
                      {isGranted && (
                        <Badge variant="secondary" className="text-xs">
                          Granted
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{metadata.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

