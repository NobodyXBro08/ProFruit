import { corsJson, corsOptionsResponse } from "@/lib/cors";
import { requireAuth } from "@/lib/requireAuth";

export function OPTIONS(request: Request) {
  return corsOptionsResponse(request);
}

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  return corsJson(
    {
      user: {
        id: auth.user.id,
        username: auth.user.username,
        role: auth.user.role,
      },
    },
    200,
    request
  );
}
