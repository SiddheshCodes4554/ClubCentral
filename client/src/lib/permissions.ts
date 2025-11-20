// Frontend permission utilities
import type { Permission, PermissionSet } from '@shared/permissions';

export function hasPermission(
  permissions: PermissionSet | null | undefined,
  permission: Permission,
): boolean {
  if (!permissions) return false;
  return permissions[permission] === true;
}

export function hasAnyPermission(
  permissions: PermissionSet | null | undefined,
  ...permissionList: Permission[]
): boolean {
  if (!permissions) return false;
  return permissionList.some((perm) => hasPermission(permissions, perm));
}

export function hasAllPermissions(
  permissions: PermissionSet | null | undefined,
  ...permissionList: Permission[]
): boolean {
  if (!permissions) return false;
  return permissionList.every((perm) => hasPermission(permissions, perm));
}

