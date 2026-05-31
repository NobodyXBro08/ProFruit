import { corsJson, corsOptionsResponse } from "@/lib/cors";
import { listProductsForAdmin } from "@/lib/products";
import { requireAdmin } from "@/lib/requireAuth";

export function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const rows = await listProductsForAdmin();
    return corsJson(rows, 200);
  } catch (error) {
    console.error("GET /api/admin/products:", error);
    const message = error instanceof Error ? error.message : String(error);
    return corsJson({ error: message }, 500);
  }
}
