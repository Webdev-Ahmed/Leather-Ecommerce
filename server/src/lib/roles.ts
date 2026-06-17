export const ROLES = ["customer", "manager", "admin", "owner"] as const;

export type Role = (typeof ROLES)[number];

export const ADMIN_ROLES = ["manager", "admin", "owner"] as const;

export function hasRole(
  userRole: Role,
  allowedRoles: readonly Role[],
): boolean {
  return allowedRoles.includes(userRole);
}
