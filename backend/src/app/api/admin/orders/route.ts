import { corsJson, corsOptionsResponse } from "@/lib/cors";
import { listOrdersForAdmin } from "@/lib/adminOrders";
import { requireAdmin } from "@/lib/requireAuth";
import { apiErrorFromUnknown } from "@/lib/apiError";

export function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const orders = await listOrdersForAdmin();
    return corsJson(orders, 200);
  } catch (error) {
    return apiErrorFromUnknown("admin/orders/list", error);
  }
}
