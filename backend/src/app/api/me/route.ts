import { corsHeaders, corsJson, corsOptionsResponse } from "@/lib/cors";
import { requireAuth } from "@/lib/requireAuth";

export function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: Request) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  return corsJson(
    {
      user: {
        id: auth.user.id,
        username: auth.user.username,
        role: auth.user.role,
      },
    },
    200
  );
}
