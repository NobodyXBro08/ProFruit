import { corsJson, corsOptionsResponse } from "@/lib/cors";
import { requireAuth } from "@/lib/requireAuth";
import { getUserProfile, updateUserProfile } from "@/lib/users";
import { apiErrorFromUnknown } from "@/lib/apiError";
import { readJsonBody } from "@/lib/http";

export function OPTIONS(request: Request) {
  return corsOptionsResponse(request);
}

function profilePayload(profile: NonNullable<Awaited<ReturnType<typeof getUserProfile>>>) {
  return {
    id: profile.id,
    username: profile.username,
    role: profile.role,
    fullName: profile.fullName,
    phone: profile.phone,
    city: profile.city,
    address: profile.address,
    shippingAddress: profile.address,
  };
}

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const profile = await getUserProfile(auth.user.id);
    if (!profile) {
      return corsJson({ error: "Usuario no encontrado." }, 404, request);
    }
    return corsJson({ user: profilePayload(profile) }, 200, request);
  } catch (error) {
    return apiErrorFromUnknown("me/get", error);
  }
}

export async function PUT(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const body = (raw.body ?? {}) as Record<string, unknown>;
    const fullName =
      body.fullName !== undefined
        ? body.fullName == null
          ? null
          : String(body.fullName)
        : undefined;
    const phone =
      body.phone !== undefined ? (body.phone == null ? null : String(body.phone)) : undefined;
    const city =
      body.city !== undefined ? (body.city == null ? null : String(body.city)) : undefined;
    const address =
      body.address !== undefined
        ? body.address == null
          ? null
          : String(body.address)
        : body.shippingAddress !== undefined
          ? body.shippingAddress == null
            ? null
            : String(body.shippingAddress)
          : undefined;

    const profile = await updateUserProfile(auth.user.id, {
      fullName,
      phone,
      city,
      address,
    });
    if (!profile) {
      return corsJson({ error: "Usuario no encontrado." }, 404, request);
    }
    return corsJson({ user: profilePayload(profile), message: "Perfil actualizado." }, 200, request);
  } catch (error) {
    return apiErrorFromUnknown("me/put", error);
  }
}
