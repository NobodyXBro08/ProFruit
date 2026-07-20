import { NextResponse } from "next/server";

function parseAllowedOrigins(): string[] | null {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw || raw === "*") return null;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Orígenes por defecto en desarrollo local. */
const DEV_DEFAULTS = [
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
];

function resolveAllowOrigin(requestOrigin: string | null): string {
  const configured = parseAllowedOrigins();
  const allowList = configured ?? (process.env.NODE_ENV === "production" ? [] : DEV_DEFAULTS);

  if (configured === null && process.env.NODE_ENV === "production") {
    // Producción sin lista: reflejar origen si viene (SPA en otro dominio) o *.
    return requestOrigin || "*";
  }

  if (allowList.length === 0) {
    return requestOrigin || "*";
  }

  if (requestOrigin && allowList.includes(requestOrigin)) {
    return requestOrigin;
  }

  // Preflight sin Origin o origen no listado: primer permitido (no abre a *).
  return allowList[0];
}

export function corsHeadersFor(request?: Request | null): Record<string, string> {
  const origin = request?.headers.get("origin") ?? request?.headers.get("Origin") ?? null;
  return {
    "Access-Control-Allow-Origin": resolveAllowOrigin(origin),
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

/** Cabeceras estáticas (sin Request): usan lista por defecto / primer origen. */
export const corsHeaders: Record<string, string> = corsHeadersFor(null);

export function corsOptionsResponse(request?: Request): Response {
  return new Response(null, { status: 204, headers: corsHeadersFor(request) });
}

/** Respuesta JSON con CORS (equivalente a Response.json + cabeceras). */
export function corsJson(data: unknown, status = 200, request?: Request): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeadersFor(request),
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export function corsNextJson(data: unknown, status = 200, request?: Request): NextResponse {
  return NextResponse.json(data, { status, headers: corsHeadersFor(request) });
}
