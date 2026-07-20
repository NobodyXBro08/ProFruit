import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const ABANDONED_MS = 2 * 60 * 60 * 1000; // 2 horas
const REMIND_KEY = 'profruit-cart-reminded-v1';

/** Recordatorio suave si la bolsa lleva tiempo sin actividad. */
export default function AbandonedCartReminder() {
  const { lines, getLastTouchedAt, totalQuantity } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current || totalQuantity < 1) return;

    const touched = getLastTouchedAt();
    if (!touched) return;
    const age = Date.now() - touched;
    if (age < ABANDONED_MS) return;

    try {
      const last = Number(localStorage.getItem(REMIND_KEY) || 0);
      if (Date.now() - last < ABANDONED_MS) return;
      localStorage.setItem(REMIND_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }

    shown.current = true;
    showToast(
      `Tienes ${lines.length} producto(s) en tu bolsa. ¿Quieres terminar tu pedido?`,
      'success',
    );
    // No navegar automáticamente; el toast es suficiente.
  }, [lines.length, totalQuantity, getLastTouchedAt, showToast, navigate]);

  return null;
}
