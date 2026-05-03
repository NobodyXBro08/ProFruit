import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT 1 as test");
    return Response.json({ ok: true, db: rows });
  } catch (error) {
    console.error("DB ERROR:", error);
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
