import { NextResponse } from "next/server";
import { findUserByUsername, verifyPassword } from "@/lib/auth";
import { parseValidatedCredentials } from "@/lib/parseValidatedCredentials";

/**
 * Servicio web: inicio de sesión (GA7-220501096-AA5-EV01).
 * POST — verifica existencia de usuario y contraseña; respuestas JSON según resultado.
 */
export async function POST(request: Request) {
  try {
    const parsed = await parseValidatedCredentials(request);
    if (!parsed.ok) return parsed.response;

    const user = parsed.username;
    const pass = parsed.password;

    // Login: verificar si el usuario existe y la contraseña es correcta
    const row = await findUserByUsername(user);
    if (!row || !verifyPassword(pass, row.password_hash)) {
      return NextResponse.json({ error: "Error en la autenticación" }, { status: 401 });
    }

    // Autenticación satisfactoria (200)
    return NextResponse.json({ message: "Autenticación satisfactoria" }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
