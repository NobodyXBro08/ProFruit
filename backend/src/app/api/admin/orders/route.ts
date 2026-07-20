import { corsJson, corsOptionsResponse } from "@/lib/cors";
import { listOrdersForAdmin } from "@/lib/adminOrders";
import {
  cancelPendingOrder,
  expireStalePendingOrders,
  OrderError,
  updateOrderFulfillmentStatus,
} from "@/lib/orders";
import { requirePermission } from "@/lib/requireAuth";
import { apiErrorFromUnknown } from "@/lib/apiError";
import { readJsonBody } from "@/lib/http";

export function OPTIONS(request: Request) {
  return corsOptionsResponse(request);
}

/** Lista pedidos; antes expira pendientes antiguos (>48h) y libera reservas. */
export async function GET(request: Request) {
  const auth = await requirePermission(request, "orders:manage");
  if (!auth.ok) return auth.response;

  try {
    const expired = await expireStalePendingOrders(48);
    const orders = await listOrdersForAdmin();
    return corsJson({ orders, expiredStale: expired }, 200, request);
  } catch (error) {
    return apiErrorFromUnknown("admin/orders/list", error);
  }
}

/**
 * Acciones:
 * - { action: 'cancel', order_id }
 * - { action: 'status', order_id, status: 'preparing'|'shipped'|'delivered' }
 */
export async function POST(request: Request) {
  const auth = await requirePermission(request, "orders:manage");
  if (!auth.ok) return auth.response;

  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const body = raw.body as Record<string, unknown> | null;
    const action = body && typeof body === "object" ? String(body.action ?? "cancel") : "cancel";

    const rawId = body?.order_id ?? body?.orderId;
    const orderId = typeof rawId === "number" ? rawId : typeof rawId === "string" ? Number(rawId) : Number.NaN;
    if (!Number.isInteger(orderId) || orderId < 1) {
      return corsJson({ error: "order_id inválido o ausente." }, 400, request);
    }

    if (action === "cancel") {
      const result = await cancelPendingOrder(orderId);
      return corsJson(
        { success: true, message: "Pedido cancelado. Stock reservado liberado.", ...result },
        200,
        request
      );
    }

    if (action === "status") {
      const status = typeof body?.status === "string" ? body.status.trim() : "";
      const result = await updateOrderFulfillmentStatus(orderId, status);
      return corsJson(
        { success: true, message: `Pedido actualizado a ${result.status}.`, ...result },
        200,
        request
      );
    }

    return corsJson(
      { error: "Acción no soportada. Usa action: 'cancel' o action: 'status'." },
      400,
      request
    );
  } catch (error) {
    if (error instanceof OrderError) {
      return corsJson({ error: error.message }, error.statusCode, request);
    }
    return apiErrorFromUnknown("admin/orders/action", error);
  }
}
