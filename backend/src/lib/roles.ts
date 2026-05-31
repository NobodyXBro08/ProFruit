export const USER_ROLES = ["client", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

export function normalizeRole(value: unknown): UserRole {
  return isUserRole(value) ? value : "client";
}
