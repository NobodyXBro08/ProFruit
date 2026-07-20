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

    const promoByProduct = new Map<number, { discountPercent: number | null; promoPrice: number | null }>();
    try {
      const [promoRows] = await conn.query<RowDataPacket[]>(
        `SELECT product_id, discount_percent, promo_price
         FROM promotions
         WHERE product_id IN (${placeholders})
           AND active = 1
           AND starts_at <= NOW()
           AND ends_at >= NOW()
         ORDER BY id DESC`,
        productIds
      );
      for (const pr of promoRows) {
        const pid = Number(pr.product_id);
        if (promoByProduct.has(pid)) continue;
        promoByProduct.set(pid, {
          discountPercent: pr.discount_percent != null ? Number(pr.discount_percent) : null,
          promoPrice: pr.promo_price != null ? Number(pr.promo_price) : null,
        });
      }
    } catch {
      // Tabla promotions puede no existir en instalaciones antiguas.
    }

    const byId = new Map<number, { price: number; available: number }>();
    for (const r of lockedRows) {
      const total = Number(r.stock);
      const reserved = Number(r.stock_reserved ?? 0);
      const available = total - reserved;
      const listPrice = Number(r.price);
      const promo = promoByProduct.get(Number(r.id));
      let unitPrice = listPrice;
      if (promo) {
        if (promo.promoPrice != null && Number.isFinite(promo.promoPrice)) {
          unitPrice = Math.round(Math.max(0, promo.promoPrice) * 100) / 100;
        } else if (promo.discountPercent != null && Number.isFinite(promo.discountPercent)) {
          unitPrice = Math.round(Math.max(0, listPrice * (1 - promo.discountPercent / 100)) * 100) / 100;
        }
      }
      byId.set(Number(r.id), { price: unitPrice, available });
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

    const shippingPayload = JSON.stringify({
      city: input.city,
      address: input.address,
      line: `${input.address}, ${input.city}`,
    });

    const [orderResult] = await conn.query<ResultSetHeader>(
      `INSERT INTO orders (user_id, status, total, customer_name, customer_email, customer_phone, shipping_address, notes)
       VALUES (?, 'pending', ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        total,
        input.customerName,
        input.customerEmail ?? "",
        input.customerPhone,
        shippingPayload,
        `payment_method:${input.paymentMethod}`,
      ]
    );

    const orderId = Number(orderResult.insertId);
    if (!orderId) throw new OrderError("No se pudo crear el pedido.", 500);

    for (const line of resolvedLines) {
      await conn.query<ResultSetHeader>(
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
        [orderId, line.productId, line.quantity, line.unitPrice]
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

/**
 * Dentro de una transacción: descuenta `stock` y libera `stock_reserved`
 * según `order_items` (pedido creado en `pending` con reserva previa).
 */
export async function deductStockForConfirmedOrder(
  conn: PoolConnection,
  orderId: number,
  options?: { userId?: number | null }
): Promise<void> {
  const [items] = await conn.query<RowDataPacket[]>(
    "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
    [orderId]
  );

  for (const row of items) {
    const pid = Number(row.product_id);
    const qty = Number(row.quantity);

    const [beforeRows] = await conn.query<RowDataPacket[]>(
      "SELECT stock FROM products WHERE id = ? FOR UPDATE",
      [pid]
    );
    const stockBefore = beforeRows.length ? Number(beforeRows[0].stock) : 0;

    const [upd] = await conn.query<ResultSetHeader>(
      "UPDATE products SET stock = stock - ?, stock_reserved = stock_reserved - ? WHERE id = ? AND stock_reserved >= ? AND stock >= ?",
      [qty, qty, pid, qty, qty]
    );
    if (upd.affectedRows !== 1) {
      throw new OrderError(`Inventario inconsistente para el producto ${pid}.`, 500);
    }

    try {
      await conn.execute(
        `INSERT INTO stock_movements
           (product_id, user_id, movement_type, quantity, stock_before, stock_after, note)
         VALUES (?, ?, 'sale', ?, ?, ?, ?)`,
        [
          pid,
          options?.userId ?? null,
          qty,
          stockBefore,
          stockBefore - qty,
          `Venta confirmada · pedido #${orderId}`,
        ]
      );
    } catch {
      // stock_movements puede no existir aún.
    }
  }
}

/**
 * Libera `stock_reserved` de un pedido pendiente cancelado (sin tocar stock físico).
 */
export async function releaseReservedStockForOrder(
  conn: PoolConnection,
  orderId: number
): Promise<void> {
  const [items] = await conn.query<RowDataPacket[]>(
    "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
    [orderId]
  );

  for (const row of items) {
    const pid = Number(row.product_id);
    const qty = Number(row.quantity);
    const [upd] = await conn.query<ResultSetHeader>(
      "UPDATE products SET stock_reserved = stock_reserved - ? WHERE id = ? AND stock_reserved >= ?",
      [qty, pid, qty]
    );
    if (upd.affectedRows !== 1) {
      throw new OrderError(`No se pudo liberar la reserva del producto ${pid}.`, 500);
    }
  }
}

/** Cancela un pedido pendiente y libera el stock reservado. */
export async function cancelPendingOrder(orderId: number): Promise<{ id: number; status: string }> {
  return withTransaction(async (conn) => {
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT id, status FROM orders WHERE id = ? FOR UPDATE",
      [orderId]
    );
    if (!rows.length) throw new OrderError("Orden no encontrada.", 404);

    const status = String(rows[0].status);
    if (status !== "pending") {
      throw new OrderError(
        status === "cancelled"
          ? "La orden ya está cancelada."
          : "Solo se pueden cancelar pedidos en estado pendiente.",
        409
      );
    }

    await releaseReservedStockForOrder(conn, orderId);
    await conn.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [orderId]);

    return { id: orderId, status: "cancelled" };
  });
}

/**
 * Cancela pedidos pendientes más antiguos que `maxAgeHours` y libera reservas.
 * @returns cantidad de pedidos expirados
 */
export async function expireStalePendingOrders(maxAgeHours = 48): Promise<number> {
  const hours = Math.min(Math.max(maxAgeHours, 1), 720);

  try {
    return await withTransaction(async (conn) => {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM orders
         WHERE status = 'pending'
           AND created_at < (NOW() - INTERVAL ? HOUR)
         FOR UPDATE`,
        [hours]
      );

      let expired = 0;
      for (const row of rows) {
        const orderId = Number(row.id);
        await releaseReservedStockForOrder(conn, orderId);
        await conn.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [orderId]);
        expired += 1;
      }
      return expired;
    });
  } catch (error) {
    console.warn("expireStalePendingOrders:", error);
    return 0;
  }
}

const FULFILLMENT_TRANSITIONS: Record<string, string[]> = {
  paid: ["preparing"],
  preparing: ["shipped"],
  shipped: ["delivered"],
};

export type CustomerOrderItem = {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
};

export type CustomerOrder = {
  id: number;
  status: string;
  total: number;
  customerName: string;
  customerPhone: string;
  city: string;
  address: string;
  paymentMethod: string;
  createdAt: string;
  items: CustomerOrderItem[];
};

function parseShipping(raw: unknown): { city: string; address: string } {
  if (typeof raw !== "string" || !raw.trim()) return { city: "", address: "" };
  try {
    const o = JSON.parse(raw) as { city?: string; address?: string; line?: string };
    return {
      city: typeof o.city === "string" ? o.city : "",
      address: typeof o.address === "string" ? o.address : typeof o.line === "string" ? o.line : raw,
    };
  } catch {
    return { city: "", address: raw };
  }
}

function parsePaymentMethod(notes: unknown): string {
  const s = typeof notes === "string" ? notes : "";
  const match = s.match(/payment_method:([a-z]+)/);
  return match?.[1] ?? "manual";
}

/** Lista pedidos del cliente autenticado. */
export async function listOrdersForUser(userId: number): Promise<CustomerOrder[]> {
  const { query } = await import("./db");
  const rows = await query<Record<string, unknown>>(
    `SELECT
       o.id,
       o.status,
       o.total,
       o.customer_name,
       o.customer_phone,
       o.shipping_address,
       o.notes,
       o.created_at,
       oi.product_id,
       oi.quantity,
       oi.unit_price,
       p.name AS product_name
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE o.user_id = ?
     ORDER BY o.created_at DESC, o.id DESC, oi.id ASC`,
    [userId]
  );

  const byId = new Map<number, CustomerOrder>();
  for (const row of rows) {
    const id = Number(row.id);
    let order = byId.get(id);
    if (!order) {
      const shipping = parseShipping(row.shipping_address);
      order = {
        id,
        status: String(row.status ?? "pending"),
        total: Number(row.total),
        customerName: String(row.customer_name ?? ""),
        customerPhone: String(row.customer_phone ?? ""),
        city: shipping.city,
        address: shipping.address,
        paymentMethod: parsePaymentMethod(row.notes),
        createdAt:
          row.created_at instanceof Date
            ? row.created_at.toISOString()
            : row.created_at
              ? String(row.created_at)
              : "",
        items: [],
      };
      byId.set(id, order);
    }
    if (row.product_id != null) {
      order.items.push({
        productId: Number(row.product_id),
        productName: String(row.product_name ?? `Producto #${row.product_id}`),
        quantity: Number(row.quantity),
        unitPrice: Number(row.unit_price ?? 0),
      });
    }
  }
  return Array.from(byId.values());
}

/**
 * Avanza el estado de fulfillment: paid → preparing → shipped → delivered.
 */
export async function updateOrderFulfillmentStatus(
  orderId: number,
  nextStatus: string
): Promise<{ id: number; status: string }> {
  const allowed = new Set(["preparing", "shipped", "delivered"]);
  if (!allowed.has(nextStatus)) {
    throw new OrderError("Estado de entrega no válido.", 400);
  }

  return withTransaction(async (conn) => {
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT id, status FROM orders WHERE id = ? FOR UPDATE",
      [orderId]
    );
    if (!rows.length) throw new OrderError("Orden no encontrada.", 404);

    const current = String(rows[0].status);
    const nexts = FULFILLMENT_TRANSITIONS[current] ?? [];
    if (!nexts.includes(nextStatus)) {
      throw new OrderError(
        `No se puede pasar de "${current}" a "${nextStatus}". Transiciones válidas: ${nexts.join(", ") || "ninguna"}.`,
        409
      );
    }

    await conn.query("UPDATE orders SET status = ? WHERE id = ?", [nextStatus, orderId]);
    return { id: orderId, status: nextStatus };
  });
}
