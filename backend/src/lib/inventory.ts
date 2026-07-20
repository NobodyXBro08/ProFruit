import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import { pool, query, withTransaction } from "./db";

export const LOW_STOCK_THRESHOLD = 5;

export const MOVEMENT_TYPES = ["entry", "exit", "adjustment", "sale"] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export type StockMovement = {
  id: number;
  productId: number;
  productName?: string;
  userId: number | null;
  username?: string | null;
  movementType: MovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  note: string | null;
  createdAt: string;
};

export type InventoryItem = {
  id: number;
  name: string;
  weight?: string;
  stock: number;
  stockReserved: number;
  available: number;
  lowStock: boolean;
  status: "ok" | "low" | "out";
};

export type InventorySummary = {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalUnits: number;
  reservedUnits: number;
  availableUnits: number;
};

function mapMovement(row: Record<string, unknown>): StockMovement {
  return {
    id: Number(row.id),
    productId: Number(row.product_id),
    productName: row.product_name != null ? String(row.product_name) : undefined,
    userId: row.user_id != null ? Number(row.user_id) : null,
    username: row.username != null ? String(row.username) : null,
    movementType: String(row.movement_type) as MovementType,
    quantity: Number(row.quantity),
    stockBefore: Number(row.stock_before),
    stockAfter: Number(row.stock_after),
    note: row.note != null ? String(row.note) : null,
    createdAt: String(row.created_at),
  };
}

export async function listInventory(): Promise<{ items: InventoryItem[]; summary: InventorySummary }> {
  const rows = await query<Record<string, unknown>>(
    `SELECT id, name, weight, stock, COALESCE(stock_reserved, 0) AS stock_reserved
     FROM products
     ORDER BY name ASC`
  );

  const items: InventoryItem[] = rows.map((row) => {
    const stock = Number(row.stock);
    const stockReserved = Number(row.stock_reserved ?? 0);
    const available = Math.max(0, stock - stockReserved);
    let status: InventoryItem["status"] = "ok";
    if (available <= 0) status = "out";
    else if (available <= LOW_STOCK_THRESHOLD) status = "low";

    return {
      id: Number(row.id),
      name: String(row.name),
      ...(row.weight != null && String(row.weight) !== "" ? { weight: String(row.weight) } : {}),
      stock,
      stockReserved,
      available,
      lowStock: status === "low",
      status,
    };
  });

  const summary: InventorySummary = {
    totalProducts: items.length,
    lowStockCount: items.filter((i) => i.status === "low").length,
    outOfStockCount: items.filter((i) => i.status === "out").length,
    totalUnits: items.reduce((acc, i) => acc + i.stock, 0),
    reservedUnits: items.reduce((acc, i) => acc + i.stockReserved, 0),
    availableUnits: items.reduce((acc, i) => acc + i.available, 0),
  };

  return { items, summary };
}

export async function listStockMovements(options?: {
  productId?: number;
  limit?: number;
}): Promise<StockMovement[]> {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);
  const params: unknown[] = [];
  let where = "";

  if (options?.productId != null) {
    where = "WHERE sm.product_id = ?";
    params.push(options.productId);
  }

  params.push(limit);

  const rows = await query<Record<string, unknown>>(
    `SELECT sm.id, sm.product_id, p.name AS product_name, sm.user_id, u.username,
            sm.movement_type, sm.quantity, sm.stock_before, sm.stock_after, sm.note, sm.created_at
     FROM stock_movements sm
     INNER JOIN products p ON p.id = sm.product_id
     LEFT JOIN users u ON u.id = sm.user_id
     ${where}
     ORDER BY sm.created_at DESC, sm.id DESC
     LIMIT ${limit}`,
    params.slice(0, -1)
  );

  return rows.map(mapMovement);
}

export async function insertStockMovement(
  conn: PoolConnection,
  input: {
    productId: number;
    userId?: number | null;
    movementType: MovementType;
    quantity: number;
    stockBefore: number;
    stockAfter: number;
    note?: string | null;
  }
): Promise<void> {
  await conn.execute(
    `INSERT INTO stock_movements
       (product_id, user_id, movement_type, quantity, stock_before, stock_after, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.productId,
      input.userId ?? null,
      input.movementType,
      input.quantity,
      input.stockBefore,
      input.stockAfter,
      input.note ?? null,
    ]
  );
}

/**
 * Ajusta el stock físico de un producto y registra el movimiento.
 * quantity > 0 = entrada; quantity < 0 = salida; movementType "adjustment" fija el total absoluto vía note.
 */
export async function adjustProductStock(input: {
  productId: number;
  userId: number;
  delta: number;
  note?: string;
}): Promise<{ stock: number; stockReserved: number; available: number }> {
  if (!Number.isInteger(input.delta) || input.delta === 0) {
    throw new InventoryError("La cantidad del movimiento debe ser un entero distinto de 0.", 400);
  }

  return withTransaction(async (conn) => {
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT id, stock, COALESCE(stock_reserved, 0) AS stock_reserved FROM products WHERE id = ? FOR UPDATE",
      [input.productId]
    );
    if (!rows.length) throw new InventoryError("Producto no encontrado.", 404);

    const stockBefore = Number(rows[0].stock);
    const reserved = Number(rows[0].stock_reserved ?? 0);
    const stockAfter = stockBefore + input.delta;

    if (stockAfter < 0) {
      throw new InventoryError("El stock no puede quedar negativo.", 400);
    }
    if (stockAfter < reserved) {
      throw new InventoryError(
        `El stock no puede ser menor que las unidades reservadas (${reserved}).`,
        400
      );
    }

    const [res] = await conn.execute<ResultSetHeader>("UPDATE products SET stock = ? WHERE id = ?", [
      stockAfter,
      input.productId,
    ]);
    if (res.affectedRows === 0) throw new InventoryError("No se pudo actualizar el stock.", 500);

    const movementType: MovementType = input.delta > 0 ? "entry" : "exit";
    await insertStockMovement(conn, {
      productId: input.productId,
      userId: input.userId,
      movementType,
      quantity: Math.abs(input.delta),
      stockBefore,
      stockAfter,
      note: input.note ?? null,
    });

    return {
      stock: stockAfter,
      stockReserved: reserved,
      available: Math.max(0, stockAfter - reserved),
    };
  });
}

export async function setProductStockAbsolute(input: {
  productId: number;
  userId: number;
  stock: number;
  note?: string;
}): Promise<{ stock: number; stockReserved: number; available: number }> {
  if (!Number.isInteger(input.stock) || input.stock < 0) {
    throw new InventoryError("El stock debe ser un entero mayor o igual a 0.", 400);
  }

  return withTransaction(async (conn) => {
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT id, stock, COALESCE(stock_reserved, 0) AS stock_reserved FROM products WHERE id = ? FOR UPDATE",
      [input.productId]
    );
    if (!rows.length) throw new InventoryError("Producto no encontrado.", 404);

    const stockBefore = Number(rows[0].stock);
    const reserved = Number(rows[0].stock_reserved ?? 0);
    const stockAfter = input.stock;

    if (stockAfter < reserved) {
      throw new InventoryError(
        `El stock no puede ser menor que las unidades reservadas (${reserved}).`,
        400
      );
    }

    if (stockAfter === stockBefore) {
      return {
        stock: stockAfter,
        stockReserved: reserved,
        available: Math.max(0, stockAfter - reserved),
      };
    }

    await conn.execute("UPDATE products SET stock = ? WHERE id = ?", [stockAfter, input.productId]);

    const delta = stockAfter - stockBefore;
    await insertStockMovement(conn, {
      productId: input.productId,
      userId: input.userId,
      movementType: "adjustment",
      quantity: Math.abs(delta),
      stockBefore,
      stockAfter,
      note: input.note ?? `Ajuste de stock (${stockBefore} → ${stockAfter})`,
    });

    return {
      stock: stockAfter,
      stockReserved: reserved,
      available: Math.max(0, stockAfter - reserved),
    };
  });
}

/** Registra un movimiento fuera de transacción propia (p. ej. al crear producto). */
export async function logStockMovement(input: {
  productId: number;
  userId?: number | null;
  movementType: MovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  note?: string | null;
}): Promise<void> {
  await pool.execute(
    `INSERT INTO stock_movements
       (product_id, user_id, movement_type, quantity, stock_before, stock_after, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.productId,
      input.userId ?? null,
      input.movementType,
      input.quantity,
      input.stockBefore,
      input.stockAfter,
      input.note ?? null,
    ]
  );
}

export class InventoryError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "InventoryError";
  }
}
