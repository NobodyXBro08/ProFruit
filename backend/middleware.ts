import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Orígenes permitidos para el navegador (Netlify u otro). Separados por coma.
 * Ejemplo: https://tu-app.netlify.app,http://localhost:3001
 */
function allowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS ?? process.env.FRONTEND_URL ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function withCors(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin");
  const list = allowedOrigins();

  if (list.includes("*")) {
    response.headers.set("Access-Control-Allow-Origin", "*");
  } else if (origin && list.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  } else if (list.length === 1) {
    response.headers.set("Access-Control-Allow-Origin", list[0]);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Access-Control-Max-Age", "86400");

  return response;
}

export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return withCors(request, new NextResponse(null, { status: 204 }));
  }
  return withCors(request, NextResponse.next());
}

export const config = {
  matcher: "/api/:path*",
};
