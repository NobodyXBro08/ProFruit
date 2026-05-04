import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function middleware(request: NextRequest) {
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
