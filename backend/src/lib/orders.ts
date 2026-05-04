import type { PoolConnection } from "mysql2/promise";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { withTransaction } from "./db";
import type { ValidatedOrderCreate } from "./orderValidators";

export class OrderError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "OrderError";
  }
}

export interface CreatedOrder {
  id: number;
  status: string;
  total: number;
  items: { productId: number; quantity: number; unitPrice: number; lineTotal: number }[];
}

async function assertUserExists(conn: PoolConnection, userId: number): Promise<void> {
  const [rows] = await conn.query<RowDataPacket[]>("SELECT id FROM users WHERE id = ? LIMIT 1", [userId]);
  if (!rows.length) throw new OrderError("Usuario no encontrado.", 400);
}

export async function createOrder(input: ValidatedOrderCreate): Promise<CreatedOrder> {
  const { items, userId } = input;

  return withTransaction(async (conn) => {
    await assertUserExists(conn, userId);

    const productIds = items.map((i) => i.productId);
    const placeholders = productIds.map(() => "?").join(",");

    const [lockedRows] = await conn.query<RowDataPacket[]>(
      `SELECT id, price, stock, COALESCE(stock_reserved, 0) AS stock_reserved FROM products WHERE id IN (${placeholders}) FOR UPDATE`,
      productIds
    );

    if (lockedRows.length !== productIds.length) {
      const found = new Set(lockedRows.map((r) => Number(r.id)));
      const missing = productIds.filter((id) => !found.has(id));
      throw new OrderError(`Producto(s) no encontrado(s): ${missing.join(", ")}.`, 400);
    }

    const byId = new Map<number, { price: number; available: number }>();
    for (const r of lockedRows) {
      const total = Number(r.stock);
      const reserved = Number(r.stock_reserved ?? 0);
      const available = total - reserved;
      byId.set(Number(r.id), { price: Number(r.price), available });
    }

    let total = 0;
    const resolvedLines: { productId: number; quantity: number; unitPrice: number; lineTotal: number }[] = [];

    for (const line of items) {
      const p = byId.get(line.productId);
      if (!p) throw new OrderError(`Producto no encontrado: ${line.productId}.`, 400);
      if (p.available < line.quantity) {
        throw new OrderError(
          `Stock insuficiente para el producto ${line.productId}. Disponible: ${p.available}, solicitado: ${line.quantity}.`,
          409
        );
      }
      const unitPrice = p.price;
      const lineTotal = Math.round(line.quantity * unitPrice * 100) / 100;
      total += lineTotal;
      resolvedLines.push({
        productId: line.productId,
        quantity: line.quantity,
        unitPrice,
        lineTotal,
      });
    }

    total = Math.round(total * 100) / 100;

    const [orderResult] = await conn.query<ResultSetHeader>(
      "INSERT INTO orders (user_id, status, total) VALUES (?, 'pending', ?)",
      [userId, total]
    );

    const orderId = Number(orderResult.insertId);
    if (!orderId) throw new OrderError("No se pudo crear el pedido.", 500);

    for (const line of resolvedLines) {
      await conn.query<ResultSetHeader>(
        "INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)",
        [orderId, line.productId, line.quantity]
      );
    }

    for (const line of resolvedLines) {
      const [upd] = await conn.query<ResultSetHeader>(
        "UPDATE products SET stock_reserved = stock_reserved + ? WHERE id = ? AND (stock - stock_reserved) >= ?",
        [line.quantity, line.productId, line.quantity]
      );
      if (upd.affectedRows !== 1) {
        throw new OrderError("Error al apartar inventario.", 500);
      }
    }

    return {
      id: orderId,
      status: "pending",
      total,
      items: resolvedLines,
    };
  });
}

export async function finalizePaidOrder(orderId: number): Promise<void> {
  return withTransaction(async (conn) => {
    const [orders] = await conn.query<RowDataPacket[]>(
      "SELECT id, status, total FROM orders WHERE id = ? FOR UPDATE",
      [orderId]
    );
    if (!orders.length) throw new OrderError("Pedido no encontrado.", 404);
    const st = String(orders[0].status);
    if (st !== "pending") {
      throw new OrderError("Solo se pueden concretar pedidos en estado pendiente.", 409);
    }

    const orderTotal = Number(orders[0].total);

    const [items] = await conn.query<RowDataPacket[]>(
      "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
      [orderId]
    );

    for (const row of items) {
      const pid = Number(row.product_id);
      const qty = Number(row.quantity);
      const [upd] = await conn.query<ResultSetHeader>(
        "UPDATE products SET stock = stock - ?, stock_reserved = stock_reserved - ? WHERE id = ? AND stock_reserved >= ? AND stock >= ?",
        [qty, qty, pid, qty, qty]
      );
      if (upd.affectedRows !== 1) {
        throw new OrderError(`Inventario inconsistente para el producto ${pid}.`, 500);
      }
    }

    await conn.query<ResultSetHeader>(
      "INSERT INTO payments (order_id, amount, status) VALUES (?, ?, ?)",
      [orderId, orderTotal, "paid"]
    );

    await conn.query("UPDATE orders SET status = 'paid' WHERE id = ?", [orderId]);
  });
}
