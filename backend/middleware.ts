import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function parseAllowedOrigins(): string[] | null {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw || raw === "*") return null;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const DEV_DEFAULTS = [
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
];

function resolveAllowOrigin(requestOrigin: string | null): string {
  const configured = parseAllowedOrigins();
  if (configured === null) {
    if (process.env.NODE_ENV === "production") {
      return requestOrigin || "*";
    }
    if (requestOrigin && DEV_DEFAULTS.includes(requestOrigin)) return requestOrigin;
    return DEV_DEFAULTS[0];
  }
  if (requestOrigin && configured.includes(requestOrigin)) return requestOrigin;
  return configured[0] ?? "*";
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": resolveAllowOrigin(origin),
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const res = NextResponse.next();
  for (const [key, value] of Object.entries(corsHeaders)) {
    res.headers.set(key, value);
  }
  return res;
}

export const config = {
  matcher: "/api/:path*",
};
