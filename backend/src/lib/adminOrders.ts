import { query } from "./db";

const columnCache = new Map<string, Set<string>>();

async function getTableColumns(table: string): Promise<Set<string>> {
  const cached = columnCache.get(table);
  if (cached) return cached;

  const rows = await query<{ COLUMN_NAME: string }>(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  const cols = new Set(rows.map((r) => String(r.COLUMN_NAME)));
  columnCache.set(table, cols);
  return cols;
}

function pickColumn(columns: Set<string>, name: string, alias: string, fallback: string): string {
  return columns.has(name) ? `${alias}.${name}` : fallback;
}

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
  const orderCols = await getTableColumns("orders");
  const itemCols = await getTableColumns("order_items");

  const customerName = pickColumn(orderCols, "customer_name", "o", "''");
  const customerPhone = pickColumn(orderCols, "customer_phone", "o", "''");
  const shippingAddress = pickColumn(orderCols, "shipping_address", "o", "NULL");
  const notes = pickColumn(orderCols, "notes", "o", "NULL");
  const createdAt = pickColumn(orderCols, "created_at", "o", "NULL");
  const unitPrice = itemCols.has("unit_price") ? "oi.unit_price" : "COALESCE(p.price, 0)";
  const orderBy = orderCols.has("created_at") ? "o.created_at DESC, o.id DESC" : "o.id DESC";

  const rows = await query<Record<string, unknown>>(
    `SELECT
       o.id,
       o.status,
       o.total,
       ${customerName} AS customer_name,
       ${customerPhone} AS customer_phone,
       ${shippingAddress} AS shipping_address,
       ${notes} AS notes,
       ${createdAt} AS created_at,
       oi.product_id,
       oi.quantity,
       ${unitPrice} AS unit_price,
       p.name AS product_name
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN products p ON p.id = oi.product_id
     ORDER BY ${orderBy}, oi.id ASC`
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
