export interface ValidatedOrderItem {
  productId: number;
  quantity: number;
}

export interface ValidatedOrderCreate {
  items: ValidatedOrderItem[];
  userId: number;
}

function parsePositiveInt(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

function mergeItems(raw: { productId: number; quantity: number }[]): ValidatedOrderItem[] {
  const map = new Map<number, number>();
  for (const { productId, quantity } of raw) {
    map.set(productId, (map.get(productId) ?? 0) + quantity);
  }
  return Array.from(map.entries()).map(([productId, quantity]) => ({ productId, quantity }));
}

export function validateOrderCreate(
  body: unknown
): { ok: true; data: ValidatedOrderCreate } | { ok: false; error: string } {
  if (body === null || typeof body !== "object") {
    return { ok: false, error: "El cuerpo debe ser un objeto JSON." };
  }
  const o = body as Record<string, unknown>;

  const uid = parsePositiveInt(o.userId ?? o.user_id);
  if (uid === null) {
    return { ok: false, error: "El campo userId es obligatorio y debe ser un entero positivo." };
  }

  const itemsRaw = o.items;
  if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
    return { ok: false, error: "El campo items debe ser un array con al menos un elemento." };
  }

  const parsedLines: { productId: number; quantity: number }[] = [];
  for (let i = 0; i < itemsRaw.length; i++) {
    const el = itemsRaw[i];
    if (el === null || typeof el !== "object") {
      return { ok: false, error: `items[${i}] debe ser un objeto.` };
    }
    const line = el as Record<string, unknown>;
    const productId = parsePositiveInt(line.productId ?? line.product_id);
    if (productId === null) {
      return { ok: false, error: `items[${i}].productId debe ser un entero positivo.` };
    }
    const quantity = parsePositiveInt(line.quantity);
    if (quantity === null) {
      return { ok: false, error: `items[${i}].quantity debe ser un entero positivo.` };
    }
    parsedLines.push({ productId, quantity });
  }

  return {
    ok: true,
    data: {
      items: mergeItems(parsedLines),
      userId: uid,
    },
  };
}

export function validateOrderFinalize(
  body: unknown
): { ok: true; id: number } | { ok: false; error: string } {
  if (body === null || typeof body !== "object") {
    return { ok: false, error: "El cuerpo debe ser un objeto JSON." };
  }
  const o = body as Record<string, unknown>;
  const idRaw = o.id;
  const idNum = typeof idRaw === "number" ? idRaw : typeof idRaw === "string" ? Number(idRaw) : Number.NaN;
  if (!Number.isInteger(idNum) || idNum < 1) {
    return { ok: false, error: "El campo id es obligatorio y debe ser un entero positivo." };
  }
  if (o.status !== "paid") {
    return { ok: false, error: 'Para concretar la compra envía status: "paid".' };
  }
  return { ok: true, id: idNum };
}
