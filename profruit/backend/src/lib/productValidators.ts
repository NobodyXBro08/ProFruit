import type { Product } from "./products";

/** Resultado de parseo de `id` en query string (GET/DELETE). */
export function parseProductIdParam(id: string | null): { ok: true; id: number } | { ok: false; error: string } {
  if (id === null || String(id).trim() === "") {
    return { ok: false, error: "El parámetro id es obligatorio." };
  }
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1) {
    return { ok: false, error: "El id debe ser un número entero positivo." };
  }
  return { ok: true, id: n };
}

type CreateFields = Pick<Product, "name" | "description" | "price" | "stock"> & { weight?: string };

/**
 * Valida cuerpo para crear producto (campos obligatorios y tipos).
 */
export function validateProductCreate(body: unknown): { ok: true; data: CreateFields } | { ok: false; error: string } {
  if (body === null || typeof body !== "object") {
    return { ok: false, error: "El cuerpo debe ser un objeto JSON." };
  }
  const o = body as Record<string, unknown>;

  const name = o.name;
  const description = o.description;
  if (typeof name !== "string" || !name.trim()) {
    return { ok: false, error: "El campo name es obligatorio y no puede estar vacío." };
  }
  if (typeof description !== "string" || !description.trim()) {
    return { ok: false, error: "El campo description es obligatorio y no puede estar vacío." };
  }

  const priceRaw = o.price;
  const priceNum =
    typeof priceRaw === "number" ? priceRaw : typeof priceRaw === "string" ? Number(priceRaw) : Number.NaN;
  if (!Number.isFinite(priceNum) || priceNum < 0) {
    return { ok: false, error: "El campo price debe ser un número mayor o igual a 0." };
  }

  const stockRaw = o.stock;
  const stockNum =
    typeof stockRaw === "number" ? stockRaw : typeof stockRaw === "string" ? Number(stockRaw) : Number.NaN;
  if (!Number.isInteger(stockNum) || stockNum < 0) {
    return { ok: false, error: "El campo stock debe ser un entero mayor o igual a 0." };
  }

  let weight: string | undefined;
  if (o.weight !== undefined && o.weight !== null) {
    if (typeof o.weight !== "string") {
      return { ok: false, error: "El campo weight, si se envía, debe ser texto." };
    }
    const w = o.weight.trim();
    weight = w === "" ? undefined : w;
  }

  return {
    ok: true,
    data: {
      name: name.trim(),
      description: description.trim(),
      price: priceNum,
      stock: stockNum,
      weight,
    },
  };
}

/**
 * Valida cuerpo para actualizar producto (id obligatorio + mismos campos que creación).
 */
export function validateProductUpdate(
  body: unknown
): { ok: true; data: CreateFields & { id: number } } | { ok: false; error: string } {
  if (body === null || typeof body !== "object") {
    return { ok: false, error: "El cuerpo debe ser un objeto JSON." };
  }
  const o = body as Record<string, unknown>;
  const idRaw = o.id;
  const idNum = typeof idRaw === "number" ? idRaw : typeof idRaw === "string" ? Number(idRaw) : Number.NaN;
  if (!Number.isInteger(idNum) || idNum < 1) {
    return { ok: false, error: "El campo id es obligatorio y debe ser un entero positivo." };
  }

  const rest = validateProductCreate(body);
  if (!rest.ok) return rest;
  return { ok: true, data: { ...rest.data, id: idNum } };
}
