export const dynamic = "force-dynamic";

export async function GET() {
  // await pool.query("SELECT 1");
  return Response.json({ test: "ok sin DB" });
}
