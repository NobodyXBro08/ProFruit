export interface ValidatedOrderItem {
  productId: number;
  quantity: number;
}

export interface ValidatedOrderCreate {
  items: ValidatedOrderItem[];
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: string;
  notes?: string;
  userId?: number;
}

function parsePositiveInt(value: unknown, field: string): number | null {
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

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export function validateOrderCreate(
  body: unknown
): { ok: true; data: ValidatedOrderCreate } | { ok: false; error: string } {
  if (body === null || typeof body !== "object") {
    return { ok: false, error: "El cuerpo debe ser un objeto JSON." };
  }
  const o = body as Record<string, unknown>;

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
    const productId = parsePositiveInt(line.productId ?? line.product_id, "productId");
    if (productId === null) {
      return { ok: false, error: `items[${i}].productId debe ser un entero positivo.` };
    }
    const quantity = parsePositiveInt(line.quantity, "quantity");
    if (quantity === null) {
      return { ok: false, error: `items[${i}].quantity debe ser un entero positivo.` };
    }
    parsedLines.push({ productId, quantity });
  }

  const items = mergeItems(parsedLines);

  const customerName = o.customerName ?? o.customer_name;
  if (typeof customerName !== "string" || !customerName.trim()) {
    return { ok: false, error: "El campo customerName es obligatorio y no puede estar vacío." };
  }

  const customerEmail = o.customerEmail ?? o.customer_email;
  if (typeof customerEmail !== "string" || !customerEmail.trim()) {
    return { ok: false, error: "El campo customerEmail es obligatorio y no puede estar vacío." };
  }
  const emailNorm = customerEmail.trim().toLowerCase();
  if (!isValidEmail(emailNorm)) {
    return { ok: false, error: "El campo customerEmail no tiene un formato válido." };
  }

  let customerPhone: string | undefined;
  if (o.customerPhone !== undefined && o.customerPhone !== null) {
    if (typeof o.customerPhone !== "string") {
      return { ok: false, error: "El campo customerPhone, si se envía, debe ser texto." };
    }
    const p = o.customerPhone.trim();
    customerPhone = p === "" ? undefined : p.slice(0, 64);
  }

  let shippingAddress: string | undefined;
  if (o.shippingAddress !== undefined && o.shippingAddress !== null) {
    if (typeof o.shippingAddress !== "string") {
      return { ok: false, error: "El campo shippingAddress, si se envía, debe ser texto." };
    }
    const a = o.shippingAddress.trim();
    shippingAddress = a === "" ? undefined : a;
  }

  let notes: string | undefined;
  if (o.notes !== undefined && o.notes !== null) {
    if (typeof o.notes !== "string") {
      return { ok: false, error: "El campo notes, si se envía, debe ser texto." };
    }
    const n = o.notes.trim();
    notes = n === "" ? undefined : n;
  }

  let userId: number | undefined;
  if (o.userId !== undefined && o.userId !== null) {
    const uid = parsePositiveInt(o.userId, "userId");
    if (uid === null) {
      return { ok: false, error: "El campo userId, si se envía, debe ser un entero positivo." };
    }
    userId = uid;
  }

  return {
    ok: true,
    data: {
      items,
      customerName: customerName.trim(),
      customerEmail: emailNorm,
      customerPhone,
      shippingAddress,
      notes,
      userId,
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
