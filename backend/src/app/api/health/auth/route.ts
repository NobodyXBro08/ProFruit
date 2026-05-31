import { corsJson, corsOptionsResponse } from "@/lib/cors";
import { query } from "@/lib/db";
import { serializeError } from "@/lib/apiError";

export function OPTIONS() {
  return corsOptionsResponse();
}

function jwtConfigured(): boolean {
  return Boolean(process.env.JWT_SECRET?.trim() || process.env.AUTH_SECRET?.trim());
}

export async function GET() {
  let dbConnected = false;
  let usersRoleColumn = false;
  let dbError: string | null = null;

  try {
    await query("SELECT 1 AS ok");
    dbConnected = true;

    try {
      await query("SELECT role FROM users LIMIT 1");
      usersRoleColumn = true;
    } catch (roleError) {
      const code = (roleError as { code?: string })?.code;
      if (code !== "ER_BAD_FIELD_ERROR") throw roleError;
    }
  } catch (error) {
    dbError = serializeError(error);
  }

  const jwtSecretConfigured = jwtConfigured();

  return corsJson(
    {
      ok: dbConnected && jwtSecretConfigured,
      jwtSecretConfigured,
      dbConnected,
      usersRoleColumn,
      checks: {
        login:
          jwtSecretConfigured && dbConnected
            ? "listo"
            : !jwtSecretConfigured
              ? "falta JWT_SECRET"
              : "sin conexión a MySQL",
        admin: usersRoleColumn ? "columna role OK" : "falta columna users.role",
      },
      ...(dbError ? { dbError } : {}),
    },
    dbConnected ? 200 : 503
  );
}
