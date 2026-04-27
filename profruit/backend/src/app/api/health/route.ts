import { NextResponse } from "next/server";

/**
 * Comprobación de disponibilidad del servidor (sin acceso a base de datos).
 * Útil para monitoreo y pruebas rápidas en Postman (GA7-220501096-AA5-EV03).
 */
export async function GET() {
  return NextResponse.json({ ok: true, message: "Backend ProFruit OK" }, { status: 200 });
}
