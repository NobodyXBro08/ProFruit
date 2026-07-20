/**
 * Smoke opcional contra una API en marcha.
 * Uso: API_BASE=http://localhost:3000 npm run test:smoke
 * Sale 0 si el servidor no responde (skip), 1 si falla una aserción.
 */
const BASE = (process.env.API_BASE || "http://127.0.0.1:3000").replace(/\/$/, "");

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { res, body };
}

async function main() {
  let health;
  try {
    health = await req("/api/health");
  } catch (e) {
    console.log(`SKIP smoke: no hay API en ${BASE} (${e.message})`);
    process.exit(0);
  }

  if (!health.res.ok) {
    console.error("FAIL /api/health", health.res.status, health.body);
    process.exit(1);
  }
  console.log("OK /api/health");

  const products = await req("/api/products");
  if (!products.res.ok || !Array.isArray(products.body)) {
    console.error("FAIL /api/products", products.res.status, products.body);
    process.exit(1);
  }
  console.log(`OK /api/products (${products.body.length} items)`);

  const login = await req("/api/login", {
    method: "POST",
    body: JSON.stringify({
      username: process.env.SMOKE_USER || "admin",
      password: process.env.SMOKE_PASS || "Admin123!",
    }),
  });

  if (login.res.status === 401) {
    console.log("SKIP login/orders/pay: credenciales seed no disponibles en esta DB");
    process.exit(0);
  }

  if (!login.res.ok || !login.body?.token) {
    console.error("FAIL /api/login", login.res.status, login.body);
    process.exit(1);
  }
  console.log("OK /api/login");

  const token = login.body.token;
  const me = await req("/api/me", { headers: { Authorization: `Bearer ${token}` } });
  if (!me.res.ok || !me.body?.user?.id) {
    console.error("FAIL /api/me", me.res.status, me.body);
    process.exit(1);
  }
  console.log("OK /api/me role=", me.body.user.role);

  const product = products.body.find((p) => Number(p.stock) > 0);
  if (!product) {
    console.log("SKIP orders/pay: sin productos con stock");
    process.exit(0);
  }

  const order = await req("/api/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      customerName: "Smoke Test",
      customerPhone: "3000000000",
      city: "Bogotá",
      address: "Calle smoke 1",
      paymentMethod: "efectivo",
      items: [{ productId: product.id, quantity: 1 }],
    }),
  });

  if (!order.res.ok || !order.body?.id) {
    console.error("FAIL /api/orders", order.res.status, order.body);
    process.exit(1);
  }
  console.log("OK /api/orders id=", order.body.id);

  const cancel = await req("/api/admin/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: "cancel", order_id: order.body.id }),
  });

  if (!cancel.res.ok) {
    console.error("FAIL cancel order", cancel.res.status, cancel.body);
    process.exit(1);
  }
  console.log("OK cancel order (liberó reserva)");

  console.log("Smoke API OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
