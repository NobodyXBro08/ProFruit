import { handleRegisterPost } from "@/lib/authRouteHandlers";
import { corsOptionsResponse } from "@/lib/cors";

export const POST = handleRegisterPost;

export function OPTIONS() {
  return corsOptionsResponse();
}
