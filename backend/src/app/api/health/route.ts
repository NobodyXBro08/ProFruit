import { corsJson, corsOptionsResponse } from "@/lib/cors";

export function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET() {
  return corsJson({ ok: true }, 200);
}
