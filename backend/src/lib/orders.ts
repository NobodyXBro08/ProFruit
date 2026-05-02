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

/**
 * Crea pedido, líneas, y descuenta stock en una sola transacción.
 */
export async function createOrder(input: ValidatedOrderCreate): Promise<CreatedOrder> {
  const { items, customerName, customerEmail, customerPhone, shippingAddress, notes, userId } = input;

  return withTransaction(async (conn) => {
    if (userId !== undefined) {
      await assertUserExists(conn, userId);
    }

    const productIds = items.map((i) => i.productId);
    const placeholders = productIds.map(() => "?").join(",");

    const [lockedRows] = await conn.query<RowDataPacket[]>(
      `SELECT id, price, stock FROM products WHERE id IN (${placeholders}) FOR UPDATE`,
      productIds
    );

    if (lockedRows.length !== productIds.length) {
      const found = new Set(lockedRows.map((r) => Number(r.id)));
      const missing = productIds.filter((id) => !found.has(id));
      throw new OrderError(`Producto(s) no encontrado(s): ${missing.join(", ")}.`, 400);
    }

    const byId = new Map<number, { price: number; stock: number }>();
    for (const r of lockedRows) {
      byId.set(Number(r.id), { price: Number(r.price), stock: Number(r.stock) });
    }

    let total = 0;
    const resolvedLines: { productId: number; quantity: number; unitPrice: number; lineTotal: number }[] = [];

    for (const line of items) {
      const p = byId.get(line.productId);
      if (!p) throw new OrderError(`Producto no encontrado: ${line.productId}.`, 400);
      if (p.stock < line.quantity) {
        throw new OrderError(
          `Stock insuficiente para el producto ${line.productId}. Disponible: ${p.stock}, solicitado: ${line.quantity}.`,
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
      `INSERT INTO orders (user_id, status, total, customer_name, customer_email, customer_phone, shipping_address, notes)
       VALUES (?, 'pending', ?, ?, ?, ?, ?, ?)`,
      [
        userId ?? null,
        total,
        customerName,
        customerEmail,
        customerPhone ?? null,
        shippingAddress ?? null,
        notes ?? null,
      ]
    );

    const orderId = Number(orderResult.insertId);
    if (!orderId) throw new OrderError("No se pudo crear el pedido.", 500);

    for (const line of resolvedLines) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)`,
        [orderId, line.productId, line.quantity, line.unitPrice]
      );
    }

    for (const line of resolvedLines) {
      const [upd] = await conn.query<ResultSetHeader>(
        `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`,
        [line.quantity, line.productId, line.quantity]
      );
      if (upd.affectedRows !== 1) {
        throw new OrderError("Error al actualizar inventario.", 500);
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
