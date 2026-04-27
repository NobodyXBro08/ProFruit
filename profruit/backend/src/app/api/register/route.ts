import { NextResponse } from "next/server";
import { createUser, findUserByUsername, hashPassword } from "@/lib/auth";
import { parseValidatedCredentials } from "@/lib/parseValidatedCredentials";

/**
 * Servicio web: registro de usuario (GA7-220501096-AA5-EV01).
 * POST — recibe JSON { username, password }, valida, evita duplicados y responde en JSON.
 */
export async function POST(request: Request) {
  try {
    const parsed = await parseValidatedCredentials(request);
    if (!parsed.ok) return parsed.response;

    const user = parsed.username;
    const pass = parsed.password;

    // Validación: usuario ya existente → conflicto
    const existing = await findUserByUsername(user);
    if (existing) {
      return NextResponse.json({ error: "El nombre de usuario ya está registrado." }, { status: 409 });
    }

    // Registro: almacenar hash de la contraseña
    const passwordHash = hashPassword(pass);
    try {
      await createUser(user, passwordHash);
    } catch (e) {
      const code = (e as { code?: string })?.code;
      // Usuario duplicado (índice UNIQUE) aunque hubiera condición de carrera
      if (code === "ER_DUP_ENTRY") {
        return NextResponse.json({ error: "El nombre de usuario ya está registrado." }, { status: 409 });
      }
      throw e;
    }

    // Respuesta JSON exitosa (201 según evidencia)
    return NextResponse.json({ message: "Usuario registrado correctamente" }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
