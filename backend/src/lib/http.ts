import { NextResponse } from "next/server";
import { corsHeaders } from "./cors";

export async function readJsonBody(
  request: Request
): Promise<{ ok: true; body: unknown } | { ok: false; response: NextResponse }> {
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400, headers: corsHeaders }),
    };
  }
}

export function parseQueryId(id: string | null): { ok: true; id: number } | { ok: false; error: string } {
  if (id === null || String(id).trim() === "") return { ok: false, error: "El parámetro id es obligatorio." };
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1) return { ok: false, error: "El id debe ser un entero positivo." };
  return { ok: true, id: n };
}
