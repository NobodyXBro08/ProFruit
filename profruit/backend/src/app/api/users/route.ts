import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { deleteUser, getUserById, listUsers, updateUser } from "@/lib/users";

function parseIdParam(id: string | null): { ok: true; id: number } | { ok: false; error: string } {
  if (id === null || id === "") {
    return { ok: false, error: "El parámetro id es obligatorio." };
  }
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { ok: false, error: "El id debe ser un entero positivo." };
  }
  return { ok: true, id: parsed };
}

async function readJsonBody(request: Request): Promise<{ ok: true; body: unknown } | { ok: false; response: NextResponse }> {
  try {
    const body = await request.json();
    return { ok: true, body };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 }),
    };
  }
}

function validateUpdateBody(body: unknown): { ok: true; data: { id: number; username: string; password?: string } } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Se esperaba un objeto JSON." };
  }

  const candidate = body as { id?: unknown; username?: unknown; password?: unknown };
  if (!Number.isInteger(candidate.id) || Number(candidate.id) <= 0) {
    return { ok: false, error: "El id es obligatorio y debe ser entero positivo." };
  }
  if (typeof candidate.username !== "string" || candidate.username.trim() === "") {
    return { ok: false, error: "El username es obligatorio." };
  }
  if (candidate.password !== undefined && (typeof candidate.password !== "string" || candidate.password.trim() === "")) {
    return { ok: false, error: "Si se envía password, no puede estar vacío." };
  }

  return {
    ok: true,
    data: {
      id: Number(candidate.id),
      username: candidate.username.trim(),
      password: typeof candidate.password === "string" ? candidate.password : undefined,
    },
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id !== null && id !== "") {
      const parsed = parseIdParam(id);
      if (!parsed.ok) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      const user = await getUserById(parsed.id);
      if (!user) {
        return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
      }
      return NextResponse.json(user, { status: 200 });
    }

    const users = await listUsers();
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Error al obtener usuarios.", details: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const v = validateUpdateBody(raw.body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const updated = await updateUser({
      id: v.data.id,
      username: v.data.username,
      passwordHash: v.data.password ? hashPassword(v.data.password) : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: "Usuario no encontrado. No se pudo actualizar." }, { status: 404 });
    }

    return NextResponse.json({ message: "Usuario actualizado correctamente." }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar el usuario." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const parsed = parseIdParam(id);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const deleted = await deleteUser(parsed.id);
    if (!deleted) {
      return NextResponse.json({ error: "Usuario no encontrado. No se pudo eliminar." }, { status: 404 });
    }

    return NextResponse.json({ message: "Usuario eliminado correctamente." }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al eliminar el usuario." }, { status: 500 });
  }
}
