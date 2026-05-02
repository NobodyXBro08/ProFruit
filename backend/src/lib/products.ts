import { query } from "./db";

let cachedProductsHasImageColumn: boolean | null = null;

async function productsTableHasImageColumn(): Promise<boolean> {
  if (cachedProductsHasImageColumn !== null) return cachedProductsHasImageColumn;
  try {
    const rows = await query<{ c: number }>(
      "SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'image'"
    );
    cachedProductsHasImageColumn = Number(rows[0]?.c) > 0;
  } catch {
    cachedProductsHasImageColumn = false;
  }
  return cachedProductsHasImageColumn;
}

export interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
  weight?: string;
}

function availableStock(row: Record<string, unknown>): number {
  const total = Number(row.stock);
  const reserved = Number(row.stock_reserved ?? 0);
  return Math.max(0, total - reserved);
}

export async function listProducts(): Promise<Product[]> {
  const hasImage = await productsTableHasImageColumn();
  const cols = hasImage
    ? "id, name, description, price, stock, COALESCE(stock_reserved, 0) AS stock_reserved, weight, image"
    : "id, name, description, price, stock, COALESCE(stock_reserved, 0) AS stock_reserved, weight";
  const rows = await query<Record<string, unknown>>(`SELECT ${cols} FROM products ORDER BY id DESC`);
  return rows.map((row) => ({
    id: row.id as number,
    name: row.name as string,
    description: row.description as string,
    price: Number(row.price),
    stock: availableStock(row),
    ...(row.image != null && { image: String(row.image) }),
    ...(row.weight != null && { weight: String(row.weight) }),
  }));
}

export async function getProductById(id: number): Promise<Product | null> {
  const hasImage = await productsTableHasImageColumn();
  const cols = hasImage
    ? "id, name, description, price, stock, COALESCE(stock_reserved, 0) AS stock_reserved, weight, image"
    : "id, name, description, price, stock, COALESCE(stock_reserved, 0) AS stock_reserved, weight";
  const rows = await query<Record<string, unknown>>(`SELECT ${cols} FROM products WHERE id = ?`, [id]);
  if (!rows.length) return null;
  const row = rows[0];
  return {
    id: row.id as number,
    name: row.name as string,
    description: row.description as string,
    price: Number(row.price),
    stock: availableStock(row),
    ...(row.image != null && { image: String(row.image) }),
    ...(row.weight != null && { weight: String(row.weight) }),
  };
}

export async function createProduct(product: Product): Promise<Product> {
  const result = await query<{ insertId: number }>(
    "INSERT INTO products (name, description, price, stock, stock_reserved, weight) VALUES (?, ?, ?, ?, 0, ?)",
    [
      product.name,
      product.description,
      product.price,
      product.stock,
      product.weight ?? null,
    ]
  );

  const insertId = (result as any).insertId ?? (Array.isArray(result) && (result as any)[0]?.insertId);

  return {
    ...product,
    id: typeof insertId === "number" ? insertId : undefined,
  };
}

export async function updateProduct(product: Product): Promise<boolean> {
  if (!product.id) {
    throw new Error("El id es obligatorio para actualizar un producto");
  }

  const sql =
    "UPDATE products SET name = ?, description = ?, price = ?, stock = ?, weight = ? WHERE id = ? AND ? >= COALESCE(stock_reserved, 0)";

  const result = await query<any>(sql, [
    product.name,
    product.description,
    product.price,
    product.stock,
    product.weight ?? null,
    product.id,
    product.stock,
  ]);

  const affectedRows = (result as any).affectedRows ?? (Array.isArray(result) && (result as any)[0]?.affectedRows);
  return Number(affectedRows) > 0;
}

export async function deleteProduct(id: number): Promise<boolean> {
  const sql = "DELETE FROM products WHERE id = ?";
  const result = await query<any>(sql, [id]);

  const affectedRows = (result as any).affectedRows ?? (Array.isArray(result) && (result as any)[0]?.affectedRows);
  return Number(affectedRows) > 0;
}

