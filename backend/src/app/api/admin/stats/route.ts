import { corsJson, corsOptionsResponse } from "@/lib/cors";
import { listInventory } from "@/lib/inventory";
import { listOrdersForAdmin } from "@/lib/adminOrders";
import { listProductsForAdmin } from "@/lib/products";
import { countActivePromotions } from "@/lib/promotions";
import { requirePermission } from "@/lib/requireAuth";
import { listUsers } from "@/lib/users";

export function OPTIONS(request: Request) {
  return corsOptionsResponse(request);
}

export async function GET(request: Request) {
  const auth = await requirePermission(request, "stats:view");
  if (!auth.ok) return auth.response;

  try {
    const [products, inventory, orders, activePromotions] = await Promise.all([
      listProductsForAdmin(),
      listInventory(),
      listOrdersForAdmin(),
      countActivePromotions().catch(() => 0),
    ]);

    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const paidOrders = orders.filter((o) => o.status === "paid").length;
    const revenue = orders
      .filter((o) => o.status === "paid")
      .reduce((acc, o) => acc + Number(o.total), 0);

    let usersCount: number | null = null;
    if (auth.user.role === "super_admin") {
      try {
        const users = await listUsers();
        usersCount = users.length;
      } catch {
        usersCount = null;
      }
    }

    return corsJson(
      {
        products: {
          total: products.length,
        },
        inventory: inventory.summary,
        orders: {
          total: orders.length,
          pending: pendingOrders,
          paid: paidOrders,
          revenue: Math.round(revenue * 100) / 100,
        },
        promotions: {
          active: activePromotions,
        },
        ...(usersCount != null ? { users: { total: usersCount } } : {}),
        lowStockAlerts: inventory.items.filter((i) => i.status === "low" || i.status === "out").slice(0, 8),
      },
      200
    );
  } catch (error) {
    console.error("GET /api/admin/stats:", error);
    const message = error instanceof Error ? error.message : String(error);
    return corsJson({ error: "Error al obtener estadísticas.", details: message }, 500);
  }
}
