import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { corsHeaders, corsOptionsResponse } from "@/lib/cors";
import { readJsonBody, parseQueryId } from "@/lib/http";
import { requirePermission } from "@/lib/requireAuth";
import { canAssignRole, isUserRole, type UserRole } from "@/lib/roles";
import { deleteUser, getUserById, listUsers, updateUser } from "@/lib/users";

function validateUpdateBody(
  body: unknown
):
  | { ok: true; data: { id: number; username: string; password?: string; role?: UserRole } }
  | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Se esperaba un objeto JSON." };
  }

  const candidate = body as { id?: unknown; username?: unknown; password?: unknown; role?: unknown };
  if (!Number.isInteger(candidate.id) || Number(candidate.id) <= 0) {
    return { ok: false, error: "El id es obligatorio y debe ser entero positivo." };
  }
  if (typeof candidate.username !== "string" || candidate.username.trim() === "") {
    return { ok: false, error: "El username es obligatorio." };
  }
  if (candidate.password !== undefined && (typeof candidate.password !== "string" || candidate.password.trim() === "")) {
    return { ok: false, error: "Si se envía password, no puede estar vacío." };
  }

  let role: UserRole | undefined;
  if (candidate.role !== undefined) {
    if (!isUserRole(candidate.role)) {
      return { ok: false, error: "Rol inválido. Usa: client, editor, admin o super_admin." };
    }
    role = candidate.role;
  }

  return {
    ok: true,
    data: {
      id: Number(candidate.id),
      username: candidate.username.trim(),
      password: typeof candidate.password === "string" ? candidate.password : undefined,
      role,
    },
  };
}

export function OPTIONS(request: Request) {
  return corsOptionsResponse(request);
}

export async function GET(request: Request) {
  const auth = await requirePermission(request, "users:manage");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id !== null && id !== "") {
      const parsed = parseQueryId(id);
      if (!parsed.ok) {
        return NextResponse.json({ error: parsed.error }, { status: 400, headers: corsHeaders });
      }
      const user = await getUserById(parsed.id);
      if (!user) {
        return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404, headers: corsHeaders });
      }
      return NextResponse.json(user, { status: 200, headers: corsHeaders });
    }

    const users = await listUsers();
    return NextResponse.json(users, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Error al obtener usuarios.", details: message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requirePermission(request, "users:manage");
  if (!auth.ok) return auth.response;

  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const v = validateUpdateBody(raw.body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400, headers: corsHeaders });
    }

    if (v.data.role) {
      if (!canAssignRole(auth.user.role, v.data.role)) {
        return NextResponse.json(
          { error: "No tienes permiso para asignar roles." },
          { status: 403, headers: corsHeaders }
        );
      }
      if (v.data.id === auth.user.id && v.data.role !== "super_admin") {
        return NextResponse.json(
          { error: "No puedes quitarte el rol de super administrador." },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    const updated = await updateUser({
      id: v.data.id,
      username: v.data.username,
      passwordHash: v.data.password ? await hashPassword(v.data.password) : undefined,
      role: v.data.role,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Usuario no encontrado. No se pudo actualizar." },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({ message: "Usuario actualizado correctamente." }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar el usuario." }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request: Request) {
  const auth = await requirePermission(request, "users:manage");
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const parsed = parseQueryId(id);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400, headers: corsHeaders });
    }

    if (parsed.id === auth.user.id) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propia cuenta." },
        { status: 400, headers: corsHeaders }
      );
    }

    const deleted = await deleteUser(parsed.id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Usuario no encontrado. No se pudo eliminar." },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({ message: "Usuario eliminado correctamente." }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al eliminar el usuario." }, { status: 500, headers: corsHeaders });
  }
}
