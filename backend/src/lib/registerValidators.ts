export type ValidatedRegister = {
  username: string;
  password: string;
  email: string;
};

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export function validateRegisterBody(
  body: unknown
): { ok: true; data: ValidatedRegister } | { ok: false; error: string } {
  if (body === null || typeof body !== "object") {
    return { ok: false, error: "El cuerpo debe ser un objeto JSON." };
  }
  const o = body as Record<string, unknown>;

  const emailRaw = o.email;
  if (typeof emailRaw !== "string" || !emailRaw.trim()) {
    return { ok: false, error: "El campo email es obligatorio." };
  }
  const emailNorm = emailRaw.trim().toLowerCase();
  if (!isValidEmail(emailNorm)) {
    return { ok: false, error: "El campo email no tiene un formato válido." };
  }

  const usernameRaw = o.username;
  const passwordRaw = o.password;
  const u = typeof usernameRaw === "string" ? usernameRaw.trim() : "";
  const p = typeof passwordRaw === "string" ? passwordRaw.trim() : "";
  if (!u || !p) {
    return { ok: false, error: "El usuario y la contraseña son obligatorios y no pueden estar vacíos." };
  }

  return {
    ok: true,
    data: {
      username: u,
      password: p,
      email: emailNorm,
    },
  };
}
