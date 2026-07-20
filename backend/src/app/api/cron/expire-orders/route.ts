import { corsJson, corsOptionsResponse } from "@/lib/cors";
import { expireStalePendingOrders } from "@/lib/orders";

export function OPTIONS(request: Request) {
  return corsOptionsResponse(request);
}

/**
 * Expira pedidos pendientes antiguos sin abrir el panel admin.
 * Autenticación: header Authorization: Bearer <CRON_SECRET> o ?secret=
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return corsJson({ error: "CRON_SECRET no configurado en el servidor." }, 503, request);
  }

  const { searchParams } = new URL(request.url);
  const header = request.headers.get("authorization") || "";
  const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  const querySecret = searchParams.get("secret")?.trim() || "";
  const provided = bearer || querySecret;

  if (!provided || provided !== secret) {
    return corsJson({ error: "No autorizado." }, 401, request);
  }

  const hoursRaw = searchParams.get("hours");
  const hours = hoursRaw ? Number(hoursRaw) : 48;
  const expired = await expireStalePendingOrders(Number.isFinite(hours) ? hours : 48);

  return corsJson({ ok: true, expiredStale: expired }, 200, request);
}

export async function POST(request: Request) {
  return GET(request);
}
