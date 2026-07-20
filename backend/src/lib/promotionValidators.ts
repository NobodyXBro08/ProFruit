import type { PromotionInput } from "./promotions";

function parseDateField(value: unknown, field: string): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== "string" || !value.trim()) {
    return { ok: false, error: `El campo ${field} es obligatorio.` };
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, error: `El campo ${field} no es una fecha válida.` };
  }
  return { ok: true, value: value.trim() };
}

export function validatePromotionBody(
  body: unknown,
  options?: { requireId?: boolean }
):
  | { ok: true; data: PromotionInput & { id?: number } }
  | { ok: false; error: string } {
  if (body === null || typeof body !== "object") {
    return { ok: false, error: "El cuerpo debe ser un objeto JSON." };
  }
  const o = body as Record<string, unknown>;

  let id: number | undefined;
  if (options?.requireId) {
    const idRaw = o.id;
    const idNum = typeof idRaw === "number" ? idRaw : typeof idRaw === "string" ? Number(idRaw) : Number.NaN;
    if (!Number.isInteger(idNum) || idNum < 1) {
      return { ok: false, error: "El campo id es obligatorio y debe ser un entero positivo." };
    }
    id = idNum;
  }

  const productIdRaw = o.productId ?? o.product_id;
  const productId =
    typeof productIdRaw === "number"
      ? productIdRaw
      : typeof productIdRaw === "string"
        ? Number(productIdRaw)
        : Number.NaN;
  if (!Number.isInteger(productId) || productId < 1) {
    return { ok: false, error: "productId es obligatorio y debe ser un entero positivo." };
  }

  let name: string | null = null;
  if (o.name !== undefined && o.name !== null) {
    if (typeof o.name !== "string") {
      return { ok: false, error: "name, si se envía, debe ser texto." };
    }
    const trimmed = o.name.trim().slice(0, 191);
    name = trimmed === "" ? null : trimmed;
  }

  const hasPercent = o.discountPercent !== undefined && o.discountPercent !== null && o.discountPercent !== "";
  const hasPromoPrice = o.promoPrice !== undefined && o.promoPrice !== null && o.promoPrice !== "";

  if (!hasPercent && !hasPromoPrice) {
    return { ok: false, error: "Debes indicar discountPercent o promoPrice." };
  }
  if (hasPercent && hasPromoPrice) {
    return { ok: false, error: "Usa solo uno: discountPercent o promoPrice, no ambos." };
  }

  let discountPercent: number | null = null;
  if (hasPercent) {
    const raw = o.discountPercent;
    const num = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : Number.NaN;
    if (!Number.isFinite(num) || num <= 0 || num > 100) {
      return { ok: false, error: "discountPercent debe ser un número entre 0 (exclusivo) y 100." };
    }
    discountPercent = Math.round(num * 100) / 100;
  }

  let promoPrice: number | null = null;
  if (hasPromoPrice) {
    const raw = o.promoPrice;
    const num = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : Number.NaN;
    if (!Number.isFinite(num) || num < 0) {
      return { ok: false, error: "promoPrice debe ser un número mayor o igual a 0." };
    }
    promoPrice = Math.round(num * 100) / 100;
  }

  const starts = parseDateField(o.startsAt ?? o.starts_at, "startsAt");
  if (!starts.ok) return starts;
  const ends = parseDateField(o.endsAt ?? o.ends_at, "endsAt");
  if (!ends.ok) return ends;

  if (new Date(ends.value).getTime() <= new Date(starts.value).getTime()) {
    return { ok: false, error: "endsAt debe ser posterior a startsAt." };
  }

  let active = true;
  if (o.active !== undefined) {
    if (typeof o.active === "boolean") active = o.active;
    else if (o.active === 0 || o.active === "0" || o.active === "false") active = false;
    else if (o.active === 1 || o.active === "1" || o.active === "true") active = true;
    else return { ok: false, error: "active debe ser booleano." };
  }

  return {
    ok: true,
    data: {
      ...(id != null ? { id } : {}),
      productId,
      name,
      discountPercent,
      promoPrice,
      startsAt: starts.value,
      endsAt: ends.value,
      active,
    },
  };
}
