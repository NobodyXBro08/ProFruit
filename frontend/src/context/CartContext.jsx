import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'profruit-cart-v1';

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
        typeof l.maxStock === 'number'
    );
  } catch {
    return [];
  }
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

  const addToCart = useCallback((product) => {
    if (!product?.id || product.stock < 1) return;
    const stock = Number(product.stock);
    const price = Number(product.price);
    setLines((prev) => {
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
      };
      return next;
    });
  }, []);

  const setLineQuantity = useCallback((productId, quantity) => {
    const q = Math.floor(Number(quantity));
    setLines((prev) => {
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
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const totalQuantity = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);
  const subtotal = useMemo(
    () => Math.round(lines.reduce((s, l) => s + l.quantity * l.price, 0) * 100) / 100,
    [lines]
  );

  const value = useMemo(
    () => ({
      lines,
      addToCart,
      setLineQuantity,
      bumpQuantity,
      removeLine,
      clearCart,
      totalQuantity,
      subtotal,
    }),
    [lines, addToCart, setLineQuantity, bumpQuantity, removeLine, clearCart, totalQuantity, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}
