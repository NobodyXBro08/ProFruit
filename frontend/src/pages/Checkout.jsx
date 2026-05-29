import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaLeaf } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useLoginModal } from '../context/LoginModalContext.jsx';
import { formatPrice } from '../utils/formatPrice';
import { api } from '../config/api';
import { SITE } from '../config/site';
import Container from '../components/ui/Container.jsx';
import Button from '../components/ui/Button.jsx';
import './Checkout.css';

function orderStatusLabel(status) {
  if (status === 'pending') return 'Pendiente de pago';
  if (status === 'paid') return 'Pagado';
  return String(status || '—');
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lines, subtotal, clearCart } = useCart();
  const { openLogin } = useLoginModal();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [lastOrder, setLastOrder] = useState(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);
  const [payMessage, setPayMessage] = useState(null);

  const step = useMemo(() => {
    if (lastOrder?.status === 'paid') return 3;
    if (lastOrder) return 2;
    return 1;
  }, [lastOrder]);

  useEffect(() => {
    document.title = 'Checkout · ProFruit';
    window.scrollTo(0, 0);
  }, []);

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
      setError('Tu bolsa está vacía.');
      return;
    }
    if (!user) {
      setError('Inicia sesión para enviar tu pedido.');
      openLogin();
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
      setSuccess(`Pedido #${data.id} creado. Total: ${formatPrice(data.total)}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  if (lines.length === 0 && !lastOrder) {
    return (
      <div className="checkout-page">
        <Container className="checkout-empty">
          <div className="checkout-empty-icon" aria-hidden>
            <FaLeaf />
          </div>
          <h1>Tu bolsa está vacía</h1>
          <p>Añade productos antes de continuar al checkout.</p>
          <Button type="button" variant="primary" size="md" onClick={() => navigate('/#products')}>
            Ir a la tienda
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <Container className="checkout-container">
        <header className="checkout-header">
          <Link to="/" className="checkout-back">
            <FaArrowLeft aria-hidden /> Volver a la tienda
          </Link>
          <h1 className="checkout-title">Checkout</h1>
          <p className="checkout-subtitle">Revisa tu pedido, confírmalo y paga con seguridad.</p>
        </header>

        <ol className="checkout-steps" aria-label="Pasos de compra">
          <li className={`checkout-step ${step >= 1 ? 'checkout-step--active' : ''} ${step > 1 ? 'checkout-step--done' : ''}`}>
            <span className="checkout-step-num">1</span>
            <span>Revisar</span>
          </li>
          <li className={`checkout-step ${step >= 2 ? 'checkout-step--active' : ''} ${step > 2 ? 'checkout-step--done' : ''}`}>
            <span className="checkout-step-num">2</span>
            <span>Confirmar</span>
          </li>
          <li className={`checkout-step ${step >= 3 ? 'checkout-step--active' : ''}`}>
            <span className="checkout-step-num">3</span>
            <span>Pagar</span>
          </li>
        </ol>

        <div className="checkout-layout">
          <section className="checkout-main" aria-label="Detalle del pedido">
            {!lastOrder ? (
              <>
                <h2 className="checkout-section-title">Tu pedido</h2>
                <ul className="checkout-lines">
                  {lines.map((line) => (
                    <li key={line.productId} className="checkout-line">
                      {line.image ? (
                        <img className="checkout-line-img" src={line.image} alt="" />
                      ) : (
                        <div className="checkout-line-img checkout-line-img--ph" aria-hidden />
                      )}
                      <div className="checkout-line-info">
                        <span className="checkout-line-name">{line.name}</span>
                        <span className="checkout-line-meta">
                          {line.quantity} × {formatPrice(line.price)}
                        </span>
                      </div>
                      <span className="checkout-line-total">{formatPrice(line.quantity * line.price)}</span>
                    </li>
                  ))}
                </ul>

                {!user ? (
                  <div className="checkout-login-banner">
                    <p>Inicia sesión para confirmar tu pedido.</p>
                    <Button type="button" variant="primary" size="md" onClick={openLogin}>
                      Entrar o registrarse
                    </Button>
                  </div>
                ) : (
                  <form className="checkout-form" onSubmit={handleSubmit}>
                    <h2 className="checkout-section-title">Datos del comprador</h2>
                    <dl className="checkout-buyer">
                      <div>
                        <dt>Nombre</dt>
                        <dd>{user.fullName || user.username}</dd>
                      </div>
                      <div>
                        <dt>Correo</dt>
                        <dd>{user.email || '—'}</dd>
                      </div>
                    </dl>
                    <p className="checkout-form-note">
                      La dirección de envío y el pago con Mercado Pago se integrarán en una próxima versión.
                    </p>
                    {error && <p className="checkout-msg checkout-msg--error">{error}</p>}
                    {success && <p className="checkout-msg checkout-msg--success">{success}</p>}
                    <Button type="submit" variant="dark" size="md" disabled={submitting} className="checkout-submit">
                      {submitting ? 'Creando pedido…' : 'Confirmar y crear pedido'}
                    </Button>
                  </form>
                )}
              </>
            ) : (
              <div className="checkout-order-done">
                <h2 className="checkout-section-title">Pedido #{lastOrder.id}</h2>
                <p className="checkout-order-status">
                  Estado:{' '}
                  <span className={`checkout-status-badge checkout-status-badge--${lastOrder.status}`}>
                    {orderStatusLabel(lastOrder.status)}
                  </span>
                </p>
                {lastOrder.status === 'pending' && (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    disabled={paying}
                    onClick={() => pagar(lastOrder.id)}
                    className="checkout-pay-btn"
                  >
                    {paying ? 'Procesando…' : 'Pagar ahora (demo)'}
                  </Button>
                )}
                {payError && <p className="checkout-msg checkout-msg--error">{payError}</p>}
                {payMessage && <p className="checkout-msg checkout-msg--success">{payMessage}</p>}
                {lastOrder.status === 'paid' && (
                  <Button type="button" variant="primary" size="md" onClick={() => navigate('/#products')}>
                    Seguir comprando
                  </Button>
                )}
              </div>
            )}
          </section>

          <aside className="checkout-aside" aria-label="Resumen">
            <div className="checkout-summary-card">
              <h2>Resumen</h2>
              <div className="checkout-summary-row">
                <span>Subtotal</span>
                <strong>{formatPrice(lastOrder ? lastOrder.total : subtotal)}</strong>
              </div>
              <div className="checkout-summary-row checkout-summary-row--muted">
                <span>Envío</span>
                <span>Se calcula al pagar</span>
              </div>
              <div className="checkout-summary-row checkout-summary-row--total">
                <span>Total estimado</span>
                <strong>{formatPrice(lastOrder ? lastOrder.total : subtotal)}</strong>
              </div>
              <p className="checkout-payment-note">{SITE.payments}</p>
              <p className="checkout-help">
                ¿Necesitas ayuda?{' '}
                <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">
                  Escríbenos por WhatsApp
                </a>
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}
