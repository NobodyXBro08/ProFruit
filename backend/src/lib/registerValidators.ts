export type ValidatedRegister = {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone?: string;
  shippingAddress?: string;
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

  const fullNameRaw = o.fullName ?? o.full_name;
  if (typeof fullNameRaw !== "string" || !fullNameRaw.trim()) {
    return { ok: false, error: "El campo fullName (nombre completo) es obligatorio." };
  }

  const emailRaw = o.email;
  if (typeof emailRaw !== "string" || !emailRaw.trim()) {
    return { ok: false, error: "El campo email es obligatorio." };
  }
  const emailNorm = emailRaw.trim().toLowerCase();
  if (!isValidEmail(emailNorm)) {
    return { ok: false, error: "El campo email no tiene un formato válido." };
  }

  let phone: string | undefined;
  if (o.phone !== undefined && o.phone !== null) {
    if (typeof o.phone !== "string") {
      return { ok: false, error: "El campo phone, si se envía, debe ser texto." };
    }
    const p = o.phone.trim();
    phone = p === "" ? undefined : p.slice(0, 64);
  }

  let shippingAddress: string | undefined;
  const addr = o.shippingAddress ?? o.shipping_address;
  if (addr !== undefined && addr !== null) {
    if (typeof addr !== "string") {
      return { ok: false, error: "El campo shippingAddress, si se envía, debe ser texto." };
    }
    const a = addr.trim();
    shippingAddress = a === "" ? undefined : a;
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
      fullName: fullNameRaw.trim(),
      email: emailNorm,
      phone,
      shippingAddress,
    },
  };
}
