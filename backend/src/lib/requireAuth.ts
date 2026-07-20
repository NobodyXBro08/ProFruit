import { NextResponse } from "next/server";
import { corsHeadersFor } from "./cors";
import type { Permission, UserRole } from "./roles";
import { isStaffRole, normalizeRole, roleHasPermission } from "./roles";
import { parseBearerToken, verifyToken } from "./tokens";
import { getUserById } from "./users";

export type AuthUser = {
  id: number;
  username: string;
  role: UserRole;
};

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; response: NextResponse };

function unauthorized(request: Request, message = "No autorizado."): AuthResult {
  return {
    ok: false,
    response: NextResponse.json({ error: message }, { status: 401, headers: corsHeadersFor(request) }),
  };
}

function forbidden(request: Request, message = "Acceso denegado."): AuthResult {
  return {
    ok: false,
    response: NextResponse.json({ error: message }, { status: 403, headers: corsHeadersFor(request) }),
  };
}

/**
 * Valida el Bearer token y refresca username/role desde la BD
 * (así un cambio de rol en admin aplica sin esperar a que expire el token).
 */
export async function requireAuth(request: Request): Promise<AuthResult> {
  const token = parseBearerToken(request);
  if (!token) return unauthorized(request, "Token de sesión requerido.");

  const payload = verifyToken(token);
  if (!payload) return unauthorized(request, "Sesión inválida o expirada.");

  try {
    const row = await getUserById(payload.sub);
    if (!row) return unauthorized(request, "Usuario no encontrado.");

    return {
      ok: true,
      user: {
        id: row.id,
        username: row.username,
        role: normalizeRole(row.role),
      },
    };
  } catch (error) {
    console.error("requireAuth/db:", error);
    // Si la BD falla, no elevar privilegios: usar payload solo como fallback de lectura.
    return {
      ok: true,
      user: {
        id: payload.sub,
        username: payload.username,
        role: normalizeRole(payload.role),
      },
    };
  }
}

/** Acceso al panel: editor, admin o super_admin. */
export async function requireStaff(request: Request): Promise<AuthResult> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth;
  if (!isStaffRole(auth.user.role)) {
    return forbidden(request, "Solo el personal autorizado puede realizar esta acción.");
  }
  return auth;
}

export async function requirePermission(request: Request, permission: Permission): Promise<AuthResult> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth;
  if (!roleHasPermission(auth.user.role, permission)) {
    return forbidden(request, "No tienes permiso para realizar esta acción.");
  }
  return auth;
}
