import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaTimes, FaMinus, FaPlus, FaTrash, FaLeaf, FaArrowRight } from 'react-icons/fa';
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

  const step = useMemo(() => {
    if (lastOrder) return 3;
    if (lines.length === 0) return 1;
    return 2;
  }, [lastOrder, lines.length]);

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
      setError('Añade al menos un producto.');
      return;
    }
    if (!user) {
      setError('Inicia sesión para enviar tu pedido.');
      return;
    }

    const userId = Number(user.id);
    if (!Number.isInteger(userId) || userId < 1) {
      setError('Sesión no válida. Cierra sesión y vuelve a entrar.');
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
      setSuccess(`Pedido #${data.id} listo. Total: ${formatPrice(data.total)}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  const goShop = () => {
    onClose();
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!isOpen) return null;

  return (
    <div className="cart-drawer-root" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
      <button type="button" className="cart-drawer-backdrop" aria-label="Cerrar carrito" onClick={onClose} />
      <aside className="cart-drawer-panel">
        <header className="cart-drawer-header">
          <div className="cart-drawer-header-text">
            <h2 id="cart-drawer-title" className="cart-drawer-title">
              Tu bolsa
            </h2>
            <p className="cart-drawer-sub">
              {lines.length === 0
                ? 'Vacía por ahora'
                : `${lines.length} ${lines.length === 1 ? 'producto' : 'productos'} · ${formatPrice(subtotal)}`}
            </p>
          </div>
          <button type="button" className="cart-drawer-close" onClick={onClose} aria-label="Cerrar">
            <FaTimes size={20} />
          </button>
        </header>

        <ol className="cart-drawer-steps" aria-label="Pasos de compra">
          <li
            className={`cart-drawer-step ${step > 1 ? 'cart-drawer-step--done' : ''} ${step === 1 ? 'cart-drawer-step--here' : ''}`}
          >
            <span className="cart-drawer-step-num">1</span>
            <span className="cart-drawer-step-label">Revisar</span>
          </li>
          <li
            className={`cart-drawer-step ${step > 2 ? 'cart-drawer-step--done' : ''} ${step === 2 ? 'cart-drawer-step--here' : ''}`}
          >
            <span className="cart-drawer-step-num">2</span>
            <span className="cart-drawer-step-label">Confirmar</span>
          </li>
          <li className={`cart-drawer-step ${step === 3 ? 'cart-drawer-step--here' : ''} ${lastOrder?.status === 'paid' ? 'cart-drawer-step--done' : ''}`}>
            <span className="cart-drawer-step-num">3</span>
            <span className="cart-drawer-step-label">Pagar</span>
          </li>
        </ol>

        <div className="cart-drawer-scroll">
          {lines.length === 0 && !lastOrder ? (
            <div className="cart-drawer-empty">
              <div className="cart-drawer-empty-icon" aria-hidden>
                <FaLeaf />
              </div>
              <h3 className="cart-drawer-empty-title">Aquí va todo lo rico que elijas</h3>
              <p className="cart-drawer-empty-text">
                Toca un producto en la tienda y pulsa <strong>Añadir al carrito</strong>. Volverás aquí y verás el
                resumen claro antes de pagar.
              </p>
              <Button type="button" variant="primary" size="md" className="cart-drawer-empty-cta" onClick={goShop}>
                Ir a la tienda
                <FaArrowRight aria-hidden />
              </Button>
            </div>
          ) : null}

          {lines.length > 0 ? (
            <ul className="cart-drawer-lines">
              {lines.map((line) => (
                <li key={line.productId} className="cart-drawer-card">
                  <div className="cart-drawer-card-top">
                    {line.image ? (
                      <div className="cart-drawer-thumb">
                        <img src={line.image} alt="" />
                      </div>
                    ) : (
                      <div className="cart-drawer-thumb cart-drawer-thumb--placeholder" aria-hidden />
                    )}
                    <div className="cart-drawer-card-info">
                      <span className="cart-drawer-line-name">{line.name}</span>
                      <span className="cart-drawer-line-meta">
                        {formatPrice(line.price)} c/u · Máx. {line.maxStock}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="cart-drawer-remove"
                      aria-label={`Quitar ${line.name}`}
                      onClick={() => removeLine(line.productId)}
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                  <div className="cart-drawer-card-bottom">
                    <span className="cart-drawer-qty-label">Cantidad</span>
                    <div className="cart-drawer-qty">
                      <button
                        type="button"
                        className="cart-drawer-qty-btn"
                        aria-label="Quitar una unidad"
                        onClick={() => bumpQuantity(line.productId, -1)}
                      >
                        <FaMinus size={13} />
                      </button>
                      <span className="cart-drawer-qty-value">{line.quantity}</span>
                      <button
                        type="button"
                        className="cart-drawer-qty-btn"
                        aria-label="Añadir una unidad"
                        disabled={line.quantity >= line.maxStock}
                        onClick={() => bumpQuantity(line.productId, 1)}
                      >
                        <FaPlus size={13} />
                      </button>
                    </div>
                    <span className="cart-drawer-line-total">{formatPrice(line.quantity * line.price)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {lastOrder ? (
            <div className="cart-drawer-order-card">
              <p className="cart-drawer-order-card-title">Pedido creado</p>
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
                  variant="primary"
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
          ) : null}
        </div>

        <div className="cart-drawer-footer">
          {lines.length > 0 ? (
            <div className="cart-drawer-summary">
              <div className="cart-drawer-summary-row">
                <span>Subtotal estimado</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <p className="cart-drawer-summary-hint">Envío e impuestos se confirman al pagar (demo).</p>
            </div>
          ) : null}

          {!user && lines.length > 0 ? (
            <div className="cart-drawer-guest">
              <p className="cart-drawer-guest-title">Siguiente paso: tu cuenta</p>
              <p className="cart-drawer-guest-text">
                Así guardamos tu pedido y te dejamos pagar con seguridad. Un solo clic y listo.
              </p>
              <Button type="button" variant="primary" size="md" className="cart-drawer-guest-btn" onClick={() => onRequestLogin?.()}>
                Entrar o registrarse
              </Button>
            </div>
          ) : null}

          <form className="cart-drawer-form" onSubmit={handleSubmit} autoComplete="off">
            {lines.length > 0 ? (
              <>
                <p className="cart-drawer-form-title">Enviar pedido al servidor</p>
                <p className="cart-drawer-form-hint">
                  {user
                    ? `Pedido a nombre de ${user.username}.`
                    : 'Debes iniciar sesión para esta acción.'}
                </p>
              </>
            ) : null}

            {error && <p className="cart-drawer-msg cart-drawer-msg--error">{error}</p>}
            {success && <p className="cart-drawer-msg cart-drawer-msg--success">{success}</p>}

            {lines.length > 0 ? (
              <Button
                type="submit"
                variant="dark"
                size="md"
                className="cart-drawer-submit"
                disabled={submitting || !user}
              >
                {submitting ? 'Creando pedido…' : 'Confirmar y crear pedido'}
              </Button>
            ) : null}
          </form>
        </div>
      </aside>
    </div>
  );
}
