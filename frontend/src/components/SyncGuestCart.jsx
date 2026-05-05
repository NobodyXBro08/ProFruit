import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

/** Sin sesión no hay bolsa: evita datos viejos en localStorage. */
export default function SyncGuestCart() {
  const { user } = useAuth();
  const { clearCart } = useCart();

  useEffect(() => {
    if (!user) clearCart();
  }, [user, clearCart]);

  return null;
}
