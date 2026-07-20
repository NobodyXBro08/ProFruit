export type ValidatedRegister = {
  username: string;
  password: string;
};

export function validateRegisterBody(
  body: unknown
): { ok: true; data: ValidatedRegister } | { ok: false; error: string } {
  if (body === null || typeof body !== "object") {
    return { ok: false, error: "El cuerpo debe ser un objeto JSON." };
  }
  const o = body as Record<string, unknown>;

  const usernameRaw = o.username;
  const passwordRaw = o.password;
  const u = typeof usernameRaw === "string" ? usernameRaw.trim() : "";
  if (!u || typeof passwordRaw !== "string" || passwordRaw.length === 0) {
    return { ok: false, error: "El usuario y la contraseña son obligatorios y no pueden estar vacíos." };
  }
  if (passwordRaw.length < 8) {
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };
  }

  return {
    ok: true,
    data: {
      username: u,
      password: passwordRaw,
    },
  };
}
