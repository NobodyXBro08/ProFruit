import { query } from "./db";

export interface AdminOrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface AdminOrder {
  id: number;
  status: string;
  total: number;
  customerName: string;
  customerPhone: string;
  city: string;
  address: string;
  paymentMethod: string;
  createdAt: string;
  items: AdminOrderItem[];
}

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

export async function listOrdersForAdmin(): Promise<AdminOrder[]> {
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
     ORDER BY o.created_at DESC, o.id DESC, oi.id ASC`
  );

  const byId = new Map<number, AdminOrder>();

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
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? ""),
        items: [],
      };
      byId.set(id, order);
    }

    if (row.product_id != null) {
      order.items.push({
        productId: Number(row.product_id),
        productName: String(row.product_name ?? `Producto #${row.product_id}`),
        quantity: Number(row.quantity),
        unitPrice: Number(row.unit_price),
      });
    }
  }

  return Array.from(byId.values());
}
