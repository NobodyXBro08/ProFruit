import type { ResultSetHeader } from "mysql2";
import { pool, query } from "./db";

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
}

function availableUnits(row: Record<string, unknown>): number {
  const total = Number(row.stock);
  const reserved = Number(row.stock_reserved ?? 0);
  return Math.max(0, total - reserved);
}

function mapRow(row: Record<string, unknown>): Product {
  return {
    id: row.id as number,
    name: row.name as string,
    description: row.description as string,
    price: Number(row.price),
    stock: availableUnits(row),
    stock_reserved: Number(row.stock_reserved ?? 0),
    ...(row.image != null && String(row.image) !== "" ? { image: String(row.image) } : {}),
    ...(row.weight != null && String(row.weight) !== "" ? { weight: String(row.weight) } : {}),
  };
}

export async function listProducts(): Promise<Product[]> {
  const rows = await query<Record<string, unknown>>(`${PRODUCTS_SELECT} ORDER BY id DESC`);
  return rows.map(mapRow);
}

export async function getProductById(id: number): Promise<Product | null> {
  const rows = await query<Record<string, unknown>>(`${PRODUCTS_SELECT} WHERE id = ?`, [id]);
  if (!rows.length) return null;
  return mapRow(rows[0]);
}

export async function createProduct(product: Product): Promise<Product> {
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
  return {
    ...product,
    id: insertId || undefined,
  };
}

export async function updateProduct(product: Product): Promise<boolean> {
  if (!product.id) {
    throw new Error("El id es obligatorio para actualizar un producto");
  }

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
  return res.affectedRows > 0;
}

export async function deleteProduct(id: number): Promise<boolean> {
  const [res] = await pool.execute<ResultSetHeader>("DELETE FROM products WHERE id = ?", [id]);
  return res.affectedRows > 0;
}
