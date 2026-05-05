import React, { useCallback, useEffect, useState } from 'react';
import { FaTimes, FaMinus, FaPlus, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { formatPrice } from '../../utils/formatPrice';
import { api } from '../../config/api';
import Button from '../ui/Button.jsx';
import './CartDrawer.css';

function orderStatusLabel(status) {
  if (status === 'pending') return 'Pendiente de pago';
  if (status === 'paid') return 'Pagado';
  return String(status || '—');
}

export default function CartDrawer({ isOpen, onClose, onRequestLogin }) {
  const { user } = useAuth();
  const { lines, bumpQuantity, removeLine, subtotal, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [lastOrder, setLastOrder] = useState(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);
  const [payMessage, setPayMessage] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    setError(null);
    setSuccess(null);
    setPayError(null);
    setPayMessage(null);
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const pagar = useCallback(async (orderId) => {
    setPayError(null);
    setPayMessage(null);
    setPaying(true);
    try {
      const res = await fetch(api('/api/pay'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.message || 'No se pudo procesar el pago.');
      }
      setLastOrder((prev) =>
        prev && prev.id === orderId ? { ...prev, status: 'paid' } : prev,
      );
      setPayMessage(data.message || 'Pago realizado.');
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Error al pagar.');
    } finally {
      setPaying(false);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLastOrder(null);
    setPayError(null);
    setPayMessage(null);
    if (lines.length === 0) {
      setError('El carrito está vacío.');
      return;
    }
    if (!user) {
      setError('Para confirmar el pedido necesitas una cuenta. Inicia sesión y vuelve a confirmar.');
      return;
    }

    const userId = Number(user.id);
    if (!Number.isInteger(userId) || userId < 1) {
      setError('Tu sesión no es válida (falta el id de usuario). Cierra sesión e inicia sesión de nuevo.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(api('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const base = data.error || data.message || 'No se pudo crear el pedido.';
        const extra = typeof data.details === 'string' && data.details.trim() ? ` (${data.details.trim()})` : '';
        throw new Error(`${base}${extra}`);
      }
      clearCart();
      const status = typeof data.status === 'string' ? data.status : 'pending';
      setLastOrder({
        id: Number(data.id),
        status,
        total: Number(data.total),
      });
      setSuccess(`Pedido #${data.id} creado. Total: ${formatPrice(data.total)}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cart-drawer-root" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
      <button type="button" className="cart-drawer-backdrop" aria-label="Cerrar carrito" onClick={onClose} />
      <aside className="cart-drawer-panel">
        <header className="cart-drawer-header">
          <h2 id="cart-drawer-title" className="cart-drawer-title">
            Tu carrito
          </h2>
          <button type="button" className="cart-drawer-close" onClick={onClose} aria-label="Cerrar">
            <FaTimes size={20} />
          </button>
        </header>

        <div className="cart-drawer-body">
          {lines.length === 0 ? (
            !lastOrder && (
              <p className="cart-drawer-empty">Aún no hay productos. Añade ítems desde el catálogo.</p>
            )
          ) : (
            <ul className="cart-drawer-lines">
              {lines.map((line) => (
                <li key={line.productId} className="cart-drawer-line">
                  <div className="cart-drawer-line-main">
                    {line.image ? (
                      <div className="cart-drawer-thumb">
                        <img src={line.image} alt={line.name} />
                      </div>
                    ) : (
                      <div className="cart-drawer-thumb cart-drawer-thumb--placeholder" aria-hidden />
                    )}
                    <div className="cart-drawer-line-info">
                      <span className="cart-drawer-line-name">{line.name}</span>
                      <span className="cart-drawer-line-price">{formatPrice(line.price)} c/u</span>
                    </div>
                  </div>
                  <div
                    className={`cart-drawer-line-actions ${line.image ? '' : 'cart-drawer-line-actions--flush'}`}
                  >
                    <div className="cart-drawer-qty">
                      <button
                        type="button"
                        className="cart-drawer-qty-btn"
                        aria-label="Menos"
                        onClick={() => bumpQuantity(line.productId, -1)}
                      >
                        <FaMinus size={12} />
                      </button>
                      <span className="cart-drawer-qty-value">{line.quantity}</span>
                      <button
                        type="button"
                        className="cart-drawer-qty-btn"
                        aria-label="Más"
                        disabled={line.quantity >= line.maxStock}
                        onClick={() => bumpQuantity(line.productId, 1)}
                      >
                        <FaPlus size={12} />
                      </button>
                    </div>
                    <span className="cart-drawer-line-sub">{formatPrice(line.quantity * line.price)}</span>
                    <button
                      type="button"
                      className="cart-drawer-remove"
                      aria-label={`Quitar ${line.name}`}
                      onClick={() => removeLine(line.productId)}
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {lines.length > 0 && (
            <div className="cart-drawer-total-row">
              <span>Subtotal</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>
          )}

          {lastOrder && (
            <div className="cart-drawer-order-card">
              <p className="cart-drawer-order-card-title">Tu pedido</p>
              <p className="cart-drawer-order-card-row">
                <span>N.º</span>
                <strong>#{lastOrder.id}</strong>
              </p>
              <p className="cart-drawer-order-card-row">
                <span>Total</span>
                <strong>{formatPrice(lastOrder.total)}</strong>
              </p>
              <p className="cart-drawer-order-card-row cart-drawer-order-card-row--status">
                <span>Estado</span>
                <span
                  className={`cart-drawer-order-status cart-drawer-order-status--${lastOrder.status}`}
                  title={lastOrder.status}
                >
                  {orderStatusLabel(lastOrder.status)}
                </span>
              </p>
              {lastOrder.status === 'pending' && (
                <Button
                  type="button"
                  variant="dark"
                  size="md"
                  className="cart-drawer-pay-btn"
                  disabled={paying}
                  onClick={() => pagar(lastOrder.id)}
                >
                  {paying ? 'Procesando…' : 'Pagar ahora'}
                </Button>
              )}
              {payError && <p className="cart-drawer-msg cart-drawer-msg--error">{payError}</p>}
              {payMessage && <p className="cart-drawer-msg cart-drawer-msg--success">{payMessage}</p>}
            </div>
          )}

          {!user && lines.length > 0 ? (
            <div className="cart-drawer-guest-banner">
              <p className="cart-drawer-guest-text">
                <strong>¿Listo para pagar?</strong> Inicia sesión para confirmar tu pedido con tu cuenta.
              </p>
              <Button type="button" variant="primary" size="sm" onClick={() => onRequestLogin?.()}>
                Iniciar sesión
              </Button>
            </div>
          ) : null}

          <form className="cart-drawer-form" onSubmit={handleSubmit} autoComplete="off">
            <p className="cart-drawer-form-title">Confirmar pedido</p>
            <p className="cart-drawer-form-hint">
              {user
                ? `Se usará tu cuenta (${user.username}) como titular del pedido.`
                : 'Inicia sesión para enviar el pedido al servidor.'}
            </p>

            {error && <p className="cart-drawer-msg cart-drawer-msg--error">{error}</p>}
            {success && <p className="cart-drawer-msg cart-drawer-msg--success">{success}</p>}

            <Button
              type="submit"
              variant="dark"
              size="md"
              className="cart-drawer-submit"
              disabled={submitting || lines.length === 0 || !user}
            >
              {submitting ? 'Enviando…' : 'Confirmar pedido'}
            </Button>
          </form>
        </div>
      </aside>
    </div>
  );
}
