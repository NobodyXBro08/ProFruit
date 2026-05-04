import { handleLoginPost } from "@/lib/authRouteHandlers";
import { corsOptionsResponse } from "@/lib/cors";

export const POST = handleLoginPost;

export function OPTIONS() {
  return corsOptionsResponse();
}
