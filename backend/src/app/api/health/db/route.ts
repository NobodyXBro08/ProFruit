import { pool } from "@/lib/db";
import { corsJson, corsOptionsResponse } from "@/lib/cors";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT 1 as test");
    return corsJson({ ok: true, db: rows }, 200);
  } catch (error) {
    console.error("DB ERROR:", error);
    const message = error instanceof Error ? error.message : String(error);
    return corsJson({ ok: false, error: message }, 500);
  }
}
