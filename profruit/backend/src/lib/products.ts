import { query } from "./db";

export interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
  weight?: string;
}

export async function listProducts(): Promise<Product[]> {
  const rows = await query<Record<string, unknown>>(
    "SELECT id, name, description, price, stock, weight FROM products ORDER BY id DESC"
  );
  return rows.map((row) => ({
    id: row.id as number,
    name: row.name as string,
    description: row.description as string,
    price: Number(row.price),
    stock: Number(row.stock),
    ...(row.image != null && { image: String(row.image) }),
    ...(row.weight != null && { weight: String(row.weight) }),
  }));
}

export async function getProductById(id: number): Promise<Product | null> {
  const rows = await query<Record<string, unknown>>(
    "SELECT id, name, description, price, stock, weight FROM products WHERE id = ?",
    [id]
  );
  if (!rows.length) return null;
  const row = rows[0];
  return {
    id: row.id as number,
    name: row.name as string,
    description: row.description as string,
    price: Number(row.price),
    stock: Number(row.stock),
    ...(row.image != null && { image: String(row.image) }),
    ...(row.weight != null && { weight: String(row.weight) }),
  };
}

export async function createProduct(product: Product): Promise<Product> {
  const result = await query<{ insertId: number }>(
    "INSERT INTO products (name, description, price, stock, weight) VALUES (?, ?, ?, ?, ?)",
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
    "UPDATE products SET name = ?, description = ?, price = ?, stock = ?, weight = ? WHERE id = ?";

  const result = await query<any>(sql, [
    product.name,
    product.description,
    product.price,
    product.stock,
    product.weight ?? null,
    product.id,
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

