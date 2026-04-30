import { NextResponse } from "next/server";
import { validateCredentials } from "./auth";

export type ParsedCredentials =
  | { ok: true; username: string; password: string }
  | { ok: false; response: NextResponse };

/**
 * Lee JSON del body y valida username/password (mismo flujo en registro e inicio de sesión).
 */
export async function parseValidatedCredentials(request: Request): Promise<ParsedCredentials> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 }),
    };
  }

  const username = (body as Record<string, unknown>)?.username;
  const password = (body as Record<string, unknown>)?.password;
  const validation = validateCredentials(username, password);
  if (!validation.ok) {
    return {
      ok: false,
      response: NextResponse.json({ error: validation.message }, { status: 400 }),
    };
  }

  return {
    ok: true,
    username: String(username).trim(),
    password: String(password),
  };
}
