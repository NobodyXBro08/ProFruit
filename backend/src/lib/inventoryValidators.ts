export function validateStockAdjust(
  body: unknown
):
  | { ok: true; data: { productId: number; delta: number; note?: string } }
  | { ok: false; error: string } {
  if (body === null || typeof body !== "object") {
    return { ok: false, error: "El cuerpo debe ser un objeto JSON." };
  }
  const o = body as Record<string, unknown>;

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

  const deltaRaw = o.delta ?? o.quantity;
  const delta =
    typeof deltaRaw === "number" ? deltaRaw : typeof deltaRaw === "string" ? Number(deltaRaw) : Number.NaN;
  if (!Number.isInteger(delta) || delta === 0) {
    return { ok: false, error: "delta debe ser un entero distinto de 0 (positivo = entrada, negativo = salida)." };
  }

  let note: string | undefined;
  if (o.note !== undefined && o.note !== null) {
    if (typeof o.note !== "string") {
      return { ok: false, error: "note, si se envía, debe ser texto." };
    }
    const trimmed = o.note.trim().slice(0, 512);
    note = trimmed === "" ? undefined : trimmed;
  }

  return { ok: true, data: { productId, delta, note } };
}

export function validateStockSet(
  body: unknown
):
  | { ok: true; data: { productId: number; stock: number; note?: string } }
  | { ok: false; error: string } {
  if (body === null || typeof body !== "object") {
    return { ok: false, error: "El cuerpo debe ser un objeto JSON." };
  }
  const o = body as Record<string, unknown>;

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

  const stockRaw = o.stock;
  const stock =
    typeof stockRaw === "number" ? stockRaw : typeof stockRaw === "string" ? Number(stockRaw) : Number.NaN;
  if (!Number.isInteger(stock) || stock < 0) {
    return { ok: false, error: "stock debe ser un entero mayor o igual a 0." };
  }

  let note: string | undefined;
  if (o.note !== undefined && o.note !== null) {
    if (typeof o.note !== "string") {
      return { ok: false, error: "note, si se envía, debe ser texto." };
    }
    const trimmed = o.note.trim().slice(0, 512);
    note = trimmed === "" ? undefined : trimmed;
  }

  return { ok: true, data: { productId, stock, note } };
}
