import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useLoginModal } from './LoginModalContext.jsx';
import CartDrawer from '../components/CartDrawer/CartDrawer.jsx';
import CartFab from '../components/CartFloating/CartFab.jsx';

const CartUiContext = createContext(null);

export function CartUiProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const { openLogin } = useLoginModal();

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ openCart, closeCart }), [openCart, closeCart]);

  return (
    <CartUiContext.Provider value={value}>
      {children}
      <CartFab onOpen={openCart} />
      <CartDrawer isOpen={isOpen} onClose={closeCart} onRequestLogin={openLogin} />
    </CartUiContext.Provider>
  );
}

export function useCartUi() {
  const ctx = useContext(CartUiContext);
  if (!ctx) throw new Error('useCartUi debe usarse dentro de CartUiProvider');
  return ctx;
}
