import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeEffectivePrice } from "../src/lib/promotions";
import { validateOrderCreate, parsePaymentMethod } from "../src/lib/orderValidators";
import { normalizeRole, roleHasPermission, isStaffRole } from "../src/lib/roles";
import { validateCredentials } from "../src/lib/auth";
import { signToken, verifyToken } from "../src/lib/tokens";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-profruit";

describe("promotions.computeEffectivePrice", () => {
  it("usa promoPrice si existe", () => {
    assert.equal(computeEffectivePrice(10000, { discountPercent: 50, promoPrice: 8000 }), 8000);
  });

  it("aplica porcentaje si no hay promoPrice", () => {
    assert.equal(computeEffectivePrice(10000, { discountPercent: 10, promoPrice: null }), 9000);
  });

  it("devuelve precio original sin promo", () => {
    assert.equal(computeEffectivePrice(10000, { discountPercent: null, promoPrice: null }), 10000);
  });
});

describe("orderValidators", () => {
  it("acepta pedido sin userId", () => {
    const v = validateOrderCreate({
      customerName: "Ana",
      customerPhone: "3001234567",
      city: "Bogotá",
      address: "Calle 1",
      paymentMethod: "whatsapp",
      items: [{ productId: 1, quantity: 2 }],
    });
    assert.equal(v.ok, true);
    if (v.ok) assert.equal(v.data.userId, 0);
  });

  it("rechaza método de pago inválido", () => {
    const v = validateOrderCreate({
      customerName: "Ana",
      customerPhone: "3001234567",
      city: "Bogotá",
      address: "Calle 1",
      paymentMethod: "tarjeta",
      items: [{ productId: 1, quantity: 1 }],
    });
    assert.equal(v.ok, false);
  });

  it("parsePaymentMethod solo acepta whitelisted", () => {
    assert.equal(parsePaymentMethod({ payment_method: "efectivo" }), "efectivo");
    assert.equal(parsePaymentMethod({ paymentMethod: "crypto" }), null);
  });
});

describe("roles", () => {
  it("normaliza roles desconocidos a client", () => {
    assert.equal(normalizeRole("god"), "client");
    assert.equal(normalizeRole("admin"), "admin");
  });

  it("permisos de editor vs admin", () => {
    assert.equal(roleHasPermission("editor", "orders:manage"), false);
    assert.equal(roleHasPermission("admin", "orders:manage"), true);
    assert.equal(isStaffRole("client"), false);
    assert.equal(isStaffRole("editor"), true);
  });
});

describe("auth.validateCredentials", () => {
  it("no recorta la contraseña (espacios cuentan)", () => {
    assert.equal(validateCredentials("user", "  ").ok, true);
    assert.equal(validateCredentials("user", "").ok, false);
  });
});

describe("tokens", () => {
  it("firma y verifica payload con role", () => {
    const token = signToken({ sub: 1, username: "admin", role: "super_admin" }, 60_000);
    const payload = verifyToken(token);
    assert.ok(payload);
    assert.equal(payload?.sub, 1);
    assert.equal(payload?.role, "super_admin");
  });

  it("rechaza token manipulado", () => {
    const token = signToken({ sub: 1, username: "admin", role: "admin" }, 60_000);
    assert.equal(verifyToken(`${token}x`), null);
  });
});
