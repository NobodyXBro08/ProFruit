import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const origins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function withCors(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get("origin") || "";
  if (origins.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  }
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
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
