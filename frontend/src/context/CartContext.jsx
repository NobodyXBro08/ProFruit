import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../config/api';

const CartContext = createContext(null);

const STORAGE_KEY = 'profruit-cart-v1';
const TOUCH_KEY = 'profruit-cart-touched-v1';

function loadInitialLines() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l) =>
        l &&
        typeof l.productId === 'number' &&
        typeof l.name === 'string' &&
        typeof l.price === 'number' &&
        typeof l.quantity === 'number' &&
        typeof l.maxStock === 'number',
    );
  } catch {
    return [];
  }
}

function touchCart() {
  try {
    localStorage.setItem(TOUCH_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

/**
 * Sincroniza líneas del carrito con el catálogo actual (precio, stock, nombre).
 * @returns {{ changed: boolean, removed: string[], priceChanged: string[], stockCapped: string[] }}
 */
function applyCatalogSync(prev, products) {
  const byId = new Map(products.map((p) => [Number(p.id), p]));
  const removed = [];
  const priceChanged = [];
  const stockCapped = [];
  let changed = false;

  const next = [];
  for (const line of prev) {
    const product = byId.get(line.productId);
    if (!product) {
      removed.push(line.name);
      changed = true;
      continue;
    }
    const stock = Number(product.stock);
    const price = Number(product.price);
    if (!Number.isFinite(stock) || stock < 1) {
      removed.push(line.name);
      changed = true;
      continue;
    }
    let quantity = line.quantity;
    if (quantity > stock) {
      stockCapped.push(line.name);
      quantity = stock;
      changed = true;
    }
    if (Math.abs(price - line.price) > 0.001) {
      priceChanged.push(line.name);
      changed = true;
    }
    if (product.name !== line.name || line.maxStock !== stock) {
      changed = true;
    }
    next.push({
      ...line,
      name: product.name,
      price,
      maxStock: stock,
      quantity,
      ...(product.originalPrice != null ? { originalPrice: Number(product.originalPrice) } : { originalPrice: undefined }),
    });
  }

  return { lines: next, changed, removed, priceChanged, stockCapped };
}

export function CartProvider({ children }) {
  const [lines, setLines] = useState(loadInitialLines);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore quota */
    }
  }, [lines]);

  const addToCart = useCallback((product, imageUrl = null) => {
    if (!product?.id || product.stock < 1) return;
    const stock = Number(product.stock);
    const price = Number(product.price);
    const img =
      imageUrl ||
      (product.image && (product.image.startsWith('http') || product.image.startsWith('data:'))
        ? product.image
        : null);

    setLines((prev) => {
      touchCart();
      const i = prev.findIndex((l) => l.productId === product.id);
      if (i === -1) {
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price,
            maxStock: stock,
            quantity: 1,
            ...(product.originalPrice != null && Number(product.originalPrice) > price
              ? { originalPrice: Number(product.originalPrice) }
              : {}),
            ...(img ? { image: img } : {}),
          },
        ];
      }
      const line = prev[i];
      const nextQty = Math.min(line.quantity + 1, stock);
      const next = [...prev];
      next[i] = {
        ...line,
        name: product.name,
        price,
        maxStock: stock,
        quantity: nextQty,
        ...(product.originalPrice != null && Number(product.originalPrice) > price
          ? { originalPrice: Number(product.originalPrice) }
          : {}),
        ...(img ? { image: img } : {}),
      };
      return next;
    });
  }, []);

  const setLineQuantity = useCallback((productId, quantity) => {
    const q = Math.floor(Number(quantity));
    setLines((prev) => {
      touchCart();
      const i = prev.findIndex((l) => l.productId === productId);
      if (i === -1) return prev;
      const line = prev[i];
      if (!Number.isFinite(q) || q <= 0) return prev.filter((l) => l.productId !== productId);
      const capped = Math.min(q, line.maxStock);
      const next = [...prev];
      next[i] = { ...line, quantity: capped };
      return next;
    });
  }, []);

  const bumpQuantity = useCallback((productId, delta) => {
    setLines((prev) => {
      touchCart();
      const i = prev.findIndex((l) => l.productId === productId);
      if (i === -1) return prev;
      const line = prev[i];
      const nextQty = line.quantity + delta;
      if (nextQty <= 0) return prev.filter((l) => l.productId !== productId);
      if (nextQty > line.maxStock) return prev;
      const next = [...prev];
      next[i] = { ...line, quantity: nextQty };
      return next;
    });
  }, []);

  const removeLine = useCallback((productId) => {
    setLines((prev) => {
      touchCart();
      return prev.filter((l) => l.productId !== productId);
    });
  }, []);

  const clearCart = useCallback(() => {
    touchCart();
    setLines([]);
  }, []);

  const reconcileFromProducts = useCallback((products) => {
    let report = {
      changed: false,
      removed: [],
      priceChanged: [],
      stockCapped: [],
      lines: null,
    };
    setLines((prev) => {
      if (!Array.isArray(products) || prev.length === 0) {
        report = { ...report, lines: prev };
        return prev;
      }
      const result = applyCatalogSync(prev, products);
      report = {
        changed: result.changed,
        removed: result.removed,
        priceChanged: result.priceChanged,
        stockCapped: result.stockCapped,
        lines: result.lines,
      };
      return result.changed ? result.lines : prev;
    });
    return report;
  }, []);

  const refreshFromApi = useCallback(async () => {
    const empty = { changed: false, removed: [], priceChanged: [], stockCapped: [], lines: null };
    try {
      const res = await fetch(api('/api/products'));
      if (!res.ok) return empty;
      const data = await res.json().catch(() => []);
      const products = Array.isArray(data) ? data : [];
      return reconcileFromProducts(products);
    } catch {
      return empty;
    }
  }, [reconcileFromProducts]);

  const getLastTouchedAt = useCallback(() => {
    try {
      const raw = localStorage.getItem(TOUCH_KEY);
      const n = Number(raw);
      return Number.isFinite(n) ? n : 0;
    } catch {
      return 0;
    }
  }, []);

  const totalQuantity = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);
  const subtotal = useMemo(
    () => Math.round(lines.reduce((s, l) => s + l.quantity * l.price, 0) * 100) / 100,
    [lines],
  );
  const listSubtotal = useMemo(() => {
    const sum = lines.reduce((s, l) => {
      const list = l.originalPrice != null && l.originalPrice > l.price ? l.originalPrice : l.price;
      return s + l.quantity * list;
    }, 0);
    return Math.round(sum * 100) / 100;
  }, [lines]);
  const savings = Math.round((listSubtotal - subtotal) * 100) / 100;

  const value = useMemo(
    () => ({
      lines,
      addToCart,
      setLineQuantity,
      bumpQuantity,
      removeLine,
      clearCart,
      reconcileFromProducts,
      refreshFromApi,
      getLastTouchedAt,
      totalQuantity,
      subtotal,
      listSubtotal,
      savings,
    }),
    [
      lines,
      addToCart,
      setLineQuantity,
      bumpQuantity,
      removeLine,
      clearCart,
      reconcileFromProducts,
      refreshFromApi,
      getLastTouchedAt,
      totalQuantity,
      subtotal,
      listSubtotal,
      savings,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}
