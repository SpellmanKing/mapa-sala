export const PERMISSIONS = {
  view: 'VIEW',
  allocate: 'ALLOCATE',
  manage: 'MANAGE',
  admin: 'ADMIN'
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Readonly<Record<string, readonly Permission[]>> = {
  ADMIN: Object.values(PERMISSIONS)
};

export function getPermissions(role: string): readonly Permission[] {
  return ROLE_PERMISSIONS[role.trim().toUpperCase()] ?? [];
}

export function hasPermission(role: string, permission: Permission): boolean {
  return getPermissions(role).includes(permission);
}
