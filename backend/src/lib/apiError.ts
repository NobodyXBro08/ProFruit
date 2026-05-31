import { NextResponse } from "next/server";
import { corsHeaders } from "./cors";

export type ApiErrorBody = {
  error: string;
  details?: string;
  hint?: string;
  code?: string;
  status?: number;
};

export function isDebugErrorsEnabled(): boolean {
  const flag = process.env.DEBUG_ERRORS?.trim().toLowerCase();
  if (flag === "1" || flag === "true" || flag === "yes") return true;
  return process.env.NODE_ENV !== "production";
}

export function serializeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function mysqlErrorMeta(error: unknown): { code?: string; hint?: string } {
  const e = error as { code?: string; sqlMessage?: string; errno?: number };
  const code = e?.code;
  const sql = e?.sqlMessage ?? "";

  if (code === "ER_BAD_FIELD_ERROR" && sql.includes("role")) {
    return {
      code,
      hint: "Falta la columna users.role. Ejecuta: ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'client';",
    };
  }

  if (code === "ER_NO_SUCH_TABLE" && sql.includes("users")) {
    return {
      code,
      hint: "La tabla users no existe. Revisa las migraciones de la base de datos.",
    };
  }

  if (code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "ETIMEDOUT") {
    return {
      code,
      hint: "No hay conexión a MySQL. Revisa MYSQLHOST, MYSQLPORT, MYSQLUSER y MYSQLPASSWORD en Railway.",
    };
  }

  if (code === "ER_ACCESS_DENIED_ERROR") {
    return {
      code,
      hint: "Credenciales MySQL incorrectas (MYSQLUSER / MYSQLPASSWORD).",
    };
  }

  if (code === "ER_BAD_DB_ERROR") {
    return {
      code,
      hint: "La base MYSQLDATABASE no existe o el nombre es incorrecto.",
    };
  }

  return code ? { code } : {};
}

export function buildApiError(
  error: string,
  options: {
    status?: number;
    details?: string;
    hint?: string;
    code?: string;
    cause?: unknown;
  } = {}
): ApiErrorBody {
  const body: ApiErrorBody = { error, status: options.status };
  const meta = options.cause ? mysqlErrorMeta(options.cause) : {};

  if (options.details) body.details = options.details;
  else if (options.cause && isDebugErrorsEnabled()) {
    body.details = serializeError(options.cause);
  }

  body.hint = options.hint ?? meta.hint;
  body.code = options.code ?? meta.code;

  return body;
}

export function apiErrorResponse(
  error: string,
  status = 500,
  options: {
    details?: string;
    hint?: string;
    code?: string;
    cause?: unknown;
  } = {}
): NextResponse {
  const body = buildApiError(error, { ...options, status });
  console.error(`[API ${status}] ${error}`, {
    details: body.details,
    hint: body.hint,
    code: body.code,
    cause: options.cause instanceof Error ? options.cause.stack : options.cause,
  });
  return NextResponse.json(body, { status, headers: corsHeaders });
}

export function apiErrorFromUnknown(
  context: string,
  cause: unknown,
  status = 500
): NextResponse {
  const details = serializeError(cause);
  const meta = mysqlErrorMeta(cause);

  if (details.includes("JWT_SECRET")) {
    return apiErrorResponse(
      "El servidor no tiene JWT_SECRET configurado.",
      503,
      {
        hint: "Añade JWT_SECRET en Railway (Variables del backend) y redeploy.",
        code: "JWT_SECRET_MISSING",
        cause,
      }
    );
  }

  return apiErrorResponse(`Error interno del servidor (${context}).`, status, {
    details: isDebugErrorsEnabled() ? details : undefined,
    hint: meta.hint,
    code: meta.code,
    cause,
  });
}
