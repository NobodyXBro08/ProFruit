import { NextResponse } from "next/server";
import { validateCredentials } from "./auth";
import { readJsonBody } from "./http";

export type ParsedCredentials =
  | { ok: true; username: string; password: string }
  | { ok: false; response: NextResponse };

/**
 * Lee JSON del body y valida username/password (mismo flujo en registro e inicio de sesión).
 */
export async function parseValidatedCredentials(request: Request): Promise<ParsedCredentials> {
  const raw = await readJsonBody(request);
  if (!raw.ok) return { ok: false, response: raw.response };

  const body = raw.body as Record<string, unknown>;
  const username = body?.username;
  const password = body?.password;
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
