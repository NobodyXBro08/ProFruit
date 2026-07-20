import { NextResponse } from "next/server";
import { corsHeaders } from "./cors";
import type { Permission, UserRole } from "./roles";
import { isStaffRole, roleHasPermission } from "./roles";
import { parseBearerToken, verifyToken } from "./tokens";

export type AuthUser = {
  id: number;
  username: string;
  role: UserRole;
};

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; response: NextResponse };

function unauthorized(message = "No autorizado."): AuthResult {
  return {
    ok: false,
    response: NextResponse.json({ error: message }, { status: 401, headers: corsHeaders }),
  };
}

function forbidden(message = "Acceso denegado."): AuthResult {
  return {
    ok: false,
    response: NextResponse.json({ error: message }, { status: 403, headers: corsHeaders }),
  };
}

export function requireAuth(request: Request): AuthResult {
  const token = parseBearerToken(request);
  if (!token) return unauthorized("Token de sesión requerido.");

  const payload = verifyToken(token);
  if (!payload) return unauthorized("Sesión inválida o expirada.");

  return {
    ok: true,
    user: {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
    },
  };
}

/** Acceso al panel: editor, admin o super_admin. */
export function requireStaff(request: Request): AuthResult {
  const auth = requireAuth(request);
  if (!auth.ok) return auth;
  if (!isStaffRole(auth.user.role)) {
    return forbidden("Solo el personal autorizado puede realizar esta acción.");
  }
  return auth;
}

export function requirePermission(request: Request, permission: Permission): AuthResult {
  const auth = requireAuth(request);
  if (!auth.ok) return auth;
  if (!roleHasPermission(auth.user.role, permission)) {
    return forbidden("No tienes permiso para realizar esta acción.");
  }
  return auth;
}

/** @deprecated Preferir requirePermission / requireStaff. Mantiene compatibilidad. */
export function requireAdmin(request: Request): AuthResult {
  return requireStaff(request);
}
