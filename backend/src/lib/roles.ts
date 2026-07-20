export const USER_ROLES = ["client", "editor", "admin", "super_admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Roles con acceso al panel administrativo. */
export const STAFF_ROLES = ["editor", "admin", "super_admin"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const PERMISSIONS = [
  "panel:access",
  "products:manage",
  "inventory:manage",
  "orders:manage",
  "promotions:manage",
  "users:manage",
  "stats:view",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  client: [],
  editor: ["panel:access", "products:manage", "inventory:manage", "stats:view"],
  admin: [
    "panel:access",
    "products:manage",
    "inventory:manage",
    "orders:manage",
    "promotions:manage",
    "stats:view",
  ],
  super_admin: [
    "panel:access",
    "products:manage",
    "inventory:manage",
    "orders:manage",
    "promotions:manage",
    "users:manage",
    "stats:view",
  ],
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

export function normalizeRole(value: unknown): UserRole {
  return isUserRole(value) ? value : "client";
}

export function isStaffRole(role: UserRole): role is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(role);
}

export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** Solo el super administrador puede asignar roles. */
export function canAssignRole(actor: UserRole, _target: UserRole): boolean {
  return actor === "super_admin";
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "super_admin":
      return "Super administrador";
    case "admin":
      return "Administrador";
    case "editor":
      return "Editor";
    default:
      return "Cliente";
  }
}
