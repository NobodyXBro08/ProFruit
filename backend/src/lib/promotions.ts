import type { ResultSetHeader } from "mysql2";
import { pool, query } from "./db";

export type Promotion = {
  id: number;
  productId: number;
  productName?: string;
  name: string | null;
  discountPercent: number | null;
  promoPrice: number | null;
  startsAt: string;
  endsAt: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ActivePromotionSnapshot = {
  id: number;
  name: string | null;
  discountPercent: number | null;
  promoPrice: number | null;
  startsAt: string;
  endsAt: string;
  /** Precio final a cobrar. */
  effectivePrice: number;
  /** Precio de lista (sin descuento). */
  originalPrice: number;
};

export type PromotionInput = {
  productId: number;
  name?: string | null;
  discountPercent?: number | null;
  promoPrice?: number | null;
  startsAt: string;
  endsAt: string;
  active?: boolean;
};

function toMysqlDateTime(isoOrMysql: string): string {
  const d = new Date(isoOrMysql);
  if (Number.isNaN(d.getTime())) return isoOrMysql;
  return d.toISOString().slice(0, 19).replace("T", " ");
}

function mapPromotion(row: Record<string, unknown>): Promotion {
  return {
    id: Number(row.id),
    productId: Number(row.product_id),
    productName: row.product_name != null ? String(row.product_name) : undefined,
    name: row.name != null ? String(row.name) : null,
    discountPercent: row.discount_percent != null ? Number(row.discount_percent) : null,
    promoPrice: row.promo_price != null ? Number(row.promo_price) : null,
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    active: Boolean(Number(row.active)),
    ...(row.created_at != null ? { createdAt: String(row.created_at) } : {}),
    ...(row.updated_at != null ? { updatedAt: String(row.updated_at) } : {}),
  };
}

export function computeEffectivePrice(
  originalPrice: number,
  promo: { discountPercent: number | null; promoPrice: number | null }
): number {
  if (promo.promoPrice != null && Number.isFinite(promo.promoPrice)) {
    return Math.round(Math.max(0, promo.promoPrice) * 100) / 100;
  }
  if (promo.discountPercent != null && Number.isFinite(promo.discountPercent)) {
    const discounted = originalPrice * (1 - promo.discountPercent / 100);
    return Math.round(Math.max(0, discounted) * 100) / 100;
  }
  return originalPrice;
}

export async function listPromotions(): Promise<Promotion[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT pr.*, p.name AS product_name
     FROM promotions pr
     INNER JOIN products p ON p.id = pr.product_id
     ORDER BY pr.starts_at DESC, pr.id DESC`
  );
  return rows.map(mapPromotion);
}

export async function getPromotionById(id: number): Promise<Promotion | null> {
  const rows = await query<Record<string, unknown>>(
    `SELECT pr.*, p.name AS product_name
     FROM promotions pr
     INNER JOIN products p ON p.id = pr.product_id
     WHERE pr.id = ?
     LIMIT 1`,
    [id]
  );
  if (!rows.length) return null;
  return mapPromotion(rows[0]);
}

/** Promoción vigente por producto (activa y dentro del rango de fechas). */
export async function getActivePromotionForProduct(
  productId: number,
  originalPrice: number
): Promise<ActivePromotionSnapshot | null> {
  const rows = await query<Record<string, unknown>>(
    `SELECT id, name, discount_percent, promo_price, starts_at, ends_at
     FROM promotions
     WHERE product_id = ?
       AND active = 1
       AND starts_at <= NOW()
       AND ends_at >= NOW()
     ORDER BY id DESC
     LIMIT 1`,
    [productId]
  );
  if (!rows.length) return null;

  const row = rows[0];
  const discountPercent = row.discount_percent != null ? Number(row.discount_percent) : null;
  const promoPrice = row.promo_price != null ? Number(row.promo_price) : null;
  const effectivePrice = computeEffectivePrice(originalPrice, { discountPercent, promoPrice });

  return {
    id: Number(row.id),
    name: row.name != null ? String(row.name) : null,
    discountPercent,
    promoPrice,
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    effectivePrice,
    originalPrice,
  };
}

export async function getActivePromotionsByProductIds(
  productIds: number[],
  priceById: Map<number, number>
): Promise<Map<number, ActivePromotionSnapshot>> {
  const result = new Map<number, ActivePromotionSnapshot>();
  if (!productIds.length) return result;

  const placeholders = productIds.map(() => "?").join(",");
  const rows = await query<Record<string, unknown>>(
    `SELECT id, product_id, name, discount_percent, promo_price, starts_at, ends_at
     FROM promotions
     WHERE product_id IN (${placeholders})
       AND active = 1
       AND starts_at <= NOW()
       AND ends_at >= NOW()
     ORDER BY id DESC`,
    productIds
  );

  for (const row of rows) {
    const productId = Number(row.product_id);
    if (result.has(productId)) continue;
    const originalPrice = priceById.get(productId) ?? 0;
    const discountPercent = row.discount_percent != null ? Number(row.discount_percent) : null;
    const promoPrice = row.promo_price != null ? Number(row.promo_price) : null;
    result.set(productId, {
      id: Number(row.id),
      name: row.name != null ? String(row.name) : null,
      discountPercent,
      promoPrice,
      startsAt: String(row.starts_at),
      endsAt: String(row.ends_at),
      effectivePrice: computeEffectivePrice(originalPrice, { discountPercent, promoPrice }),
      originalPrice,
    });
  }

  return result;
}

export async function createPromotion(input: PromotionInput): Promise<Promotion> {
  const [res] = await pool.execute<ResultSetHeader>(
    `INSERT INTO promotions
       (product_id, name, discount_percent, promo_price, starts_at, ends_at, active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.productId,
      input.name ?? null,
      input.discountPercent ?? null,
      input.promoPrice ?? null,
      toMysqlDateTime(input.startsAt),
      toMysqlDateTime(input.endsAt),
      input.active === false ? 0 : 1,
    ]
  );
  const created = await getPromotionById(Number(res.insertId));
  if (!created) throw new Error("No se pudo crear la promoción.");
  return created;
}

export async function updatePromotion(id: number, input: PromotionInput): Promise<boolean> {
  const [res] = await pool.execute<ResultSetHeader>(
    `UPDATE promotions
     SET product_id = ?, name = ?, discount_percent = ?, promo_price = ?,
         starts_at = ?, ends_at = ?, active = ?
     WHERE id = ?`,
    [
      input.productId,
      input.name ?? null,
      input.discountPercent ?? null,
      input.promoPrice ?? null,
      toMysqlDateTime(input.startsAt),
      toMysqlDateTime(input.endsAt),
      input.active === false ? 0 : 1,
      id,
    ]
  );
  return res.affectedRows > 0;
}

export async function setPromotionActive(id: number, active: boolean): Promise<boolean> {
  const [res] = await pool.execute<ResultSetHeader>("UPDATE promotions SET active = ? WHERE id = ?", [
    active ? 1 : 0,
    id,
  ]);
  return res.affectedRows > 0;
}

export async function deletePromotion(id: number): Promise<boolean> {
  const [res] = await pool.execute<ResultSetHeader>("DELETE FROM promotions WHERE id = ?", [id]);
  return res.affectedRows > 0;
}

export async function countActivePromotions(): Promise<number> {
  const rows = await query<{ c: number }>(
    `SELECT COUNT(*) AS c FROM promotions
     WHERE active = 1 AND starts_at <= NOW() AND ends_at >= NOW()`
  );
  return Number(rows[0]?.c ?? 0);
}
