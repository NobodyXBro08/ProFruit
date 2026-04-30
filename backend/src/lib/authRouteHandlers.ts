import { NextResponse } from "next/server";
import { createUser, findUserByUsername, hashPassword, verifyPassword } from "./auth";
import { parseValidatedCredentials } from "./parseValidatedCredentials";

/**
 * Servicio web: registro de usuario (GA7-220501096-AA5-EV03).
 * POST — JSON { username, password }; valida campos, evita duplicados; 201 / 400 / 409 / 500.
 */
export async function handleRegisterPost(request: Request): Promise<NextResponse> {
  try {
    const parsed = await parseValidatedCredentials(request);
    if (!parsed.ok) return parsed.response;

    const user = parsed.username;
    const pass = parsed.password;

    const existing = await findUserByUsername(user);
    if (existing) {
      return NextResponse.json({ error: "El nombre de usuario ya está registrado." }, { status: 409 });
    }

    const passwordHash = hashPassword(pass);
    try {
      await createUser(user, passwordHash);
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === "ER_DUP_ENTRY") {
        return NextResponse.json({ error: "El nombre de usuario ya está registrado." }, { status: 409 });
      }
      throw e;
    }

    return NextResponse.json({ message: "Usuario registrado correctamente" }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

/**
 * Servicio web: inicio de sesión (GA7-220501096-AA5-EV03).
 * POST — valida credenciales; 200 éxito, 401 credenciales incorrectas, 400 / 500.
 */
export async function handleLoginPost(request: Request): Promise<NextResponse> {
  try {
    const parsed = await parseValidatedCredentials(request);
    if (!parsed.ok) return parsed.response;

    const user = parsed.username;
    const pass = parsed.password;

    const row = await findUserByUsername(user);
    if (!row || !verifyPassword(pass, row.password_hash)) {
      return NextResponse.json({ error: "Error en la autenticación" }, { status: 401 });
    }

    return NextResponse.json({ message: "Autenticación satisfactoria" }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
