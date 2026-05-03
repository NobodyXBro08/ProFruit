export async function GET() {
  // const [rows] = await pool.query("SELECT * FROM products LIMIT 10");
  return Response.json({ test: "ok sin DB" });
}

export async function POST() {
  return Response.json({ test: "ok sin DB" });
}

export async function PUT() {
  return Response.json({ test: "ok sin DB" });
}

export async function DELETE() {
  return Response.json({ test: "ok sin DB" });
}
