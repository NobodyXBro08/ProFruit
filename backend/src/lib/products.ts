import type { ResultSetHeader } from "mysql2";
import { pool, query } from "./db";
import {
  getActivePromotionsByProductIds,
  type ActivePromotionSnapshot,
} from "./promotions";
import { logStockMovement } from "./inventory";

const PRODUCTS_SELECT =
  "SELECT id, name, description, price, stock, stock_reserved, weight, image FROM products";

export interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  stock_reserved?: number;
  image?: string;
  weight?: string;
  /** Precio de lista cuando hay promoción activa. */
  originalPrice?: number;
  promotion?: ActivePromotionSnapshot | null;
}

function availableUnits(row: Record<string, unknown>): number {
  const total = Number(row.stock);
  const reserved = Number(row.stock_reserved ?? 0);
  return Math.max(0, total - reserved);
}

function mapRow(row: Record<string, unknown>, promo?: ActivePromotionSnapshot | null): Product {
  const listPrice = Number(row.price);
  const base: Product = {
    id: row.id as number,
    name: row.name as string,
    description: row.description as string,
    price: promo ? promo.effectivePrice : listPrice,
    stock: availableUnits(row),
    stock_reserved: Number(row.stock_reserved ?? 0),
    ...(row.image != null && String(row.image) !== "" ? { image: String(row.image) } : {}),
    ...(row.weight != null && String(row.weight) !== "" ? { weight: String(row.weight) } : {}),
  };

  if (promo) {
    base.originalPrice = listPrice;
    base.promotion = promo;
  }

  return base;
}

function mapAdminRow(row: Record<string, unknown>): Product {
  return {
    id: row.id as number,
    name: row.name as string,
    description: row.description as string,
    price: Number(row.price),
    stock: Number(row.stock),
    stock_reserved: Number(row.stock_reserved ?? 0),
    ...(row.image != null && String(row.image) !== "" ? { image: String(row.image) } : {}),
    ...(row.weight != null && String(row.weight) !== "" ? { weight: String(row.weight) } : {}),
  };
}

export async function listProductsForAdmin(): Promise<Product[]> {
  const rows = await query<Record<string, unknown>>(`${PRODUCTS_SELECT} ORDER BY id DESC`);
  return rows.map(mapAdminRow);
}

export async function listProducts(): Promise<Product[]> {
  const rows = await query<Record<string, unknown>>(`${PRODUCTS_SELECT} ORDER BY id DESC`);
  const priceById = new Map<number, number>();
  const ids: number[] = [];
  for (const row of rows) {
    const id = Number(row.id);
    ids.push(id);
    priceById.set(id, Number(row.price));
  }

  let promos = new Map<number, ActivePromotionSnapshot>();
  try {
    promos = await getActivePromotionsByProductIds(ids, priceById);
  } catch (error) {
    // Tabla promotions puede no existir aún en DBs antiguas.
    console.warn("listProducts: no se pudieron cargar promociones:", error);
  }

  return rows.map((row) => mapRow(row, promos.get(Number(row.id)) ?? null));
}

export async function getProductById(id: number): Promise<Product | null> {
  const rows = await query<Record<string, unknown>>(`${PRODUCTS_SELECT} WHERE id = ?`, [id]);
  if (!rows.length) return null;
  const row = rows[0];
  const listPrice = Number(row.price);
  try {
    const { getActivePromotionForProduct } = await import("./promotions");
    const promo = await getActivePromotionForProduct(id, listPrice);
    return mapRow(row, promo);
  } catch {
    return mapRow(row, null);
  }
}

/** Precio de lista (sin promoción), para admin y validaciones. */
export async function getProductListPrice(id: number): Promise<number | null> {
  const rows = await query<Record<string, unknown>>("SELECT price FROM products WHERE id = ? LIMIT 1", [id]);
  if (!rows.length) return null;
  return Number(rows[0].price);
}

export async function createProduct(
  product: Product,
  options?: { userId?: number }
): Promise<Product> {
  const [res] = await pool.execute<ResultSetHeader>(
    "INSERT INTO products (name, description, price, stock, stock_reserved, weight, image) VALUES (?, ?, ?, ?, 0, ?, ?)",
    [
      product.name,
      product.description,
      product.price,
      product.stock,
      product.weight ?? null,
      product.image ?? null,
    ]
  );
  const insertId = Number(res.insertId);

  if (insertId && product.stock > 0) {
    try {
      await logStockMovement({
        productId: insertId,
        userId: options?.userId ?? null,
        movementType: "entry",
        quantity: product.stock,
        stockBefore: 0,
        stockAfter: product.stock,
        note: "Stock inicial al crear producto",
      });
    } catch (error) {
      console.warn("createProduct: no se pudo registrar movimiento de stock:", error);
    }
  }

  return {
    ...product,
    id: insertId || undefined,
  };
}

export async function updateProduct(
  product: Product,
  options?: { userId?: number }
): Promise<boolean> {
  if (!product.id) {
    throw new Error("El id es obligatorio para actualizar un producto");
  }

  const beforeRows = await query<Record<string, unknown>>(
    "SELECT stock, COALESCE(stock_reserved, 0) AS stock_reserved FROM products WHERE id = ? LIMIT 1",
    [product.id]
  );
  if (!beforeRows.length) return false;

  const stockBefore = Number(beforeRows[0].stock);

  const [res] = await pool.execute<ResultSetHeader>(
    "UPDATE products SET name = ?, description = ?, price = ?, stock = ?, weight = ?, image = ? WHERE id = ? AND ? >= COALESCE(stock_reserved, 0)",
    [
      product.name,
      product.description,
      product.price,
      product.stock,
      product.weight ?? null,
      product.image ?? null,
      product.id,
      product.stock,
    ]
  );

  if (res.affectedRows > 0 && product.stock !== stockBefore) {
    try {
      await logStockMovement({
        productId: product.id,
        userId: options?.userId ?? null,
        movementType: "adjustment",
        quantity: Math.abs(product.stock - stockBefore),
        stockBefore,
        stockAfter: product.stock,
        note: `Ajuste desde catálogo (${stockBefore} → ${product.stock})`,
      });
    } catch (error) {
      console.warn("updateProduct: no se pudo registrar movimiento de stock:", error);
    }
  }

  return res.affectedRows > 0;
}

export async function deleteProduct(id: number): Promise<boolean> {
  const [res] = await pool.execute<ResultSetHeader>("DELETE FROM products WHERE id = ?", [id]);
  return res.affectedRows > 0;
}
