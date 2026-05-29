import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaLeaf } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useLoginModal } from '../context/LoginModalContext.jsx';
import { formatPrice } from '../utils/formatPrice';
import { api } from '../config/api';
import { SITE } from '../config/site';
import { PAYMENT_METHODS, paymentMethodLabel } from '../config/payments';
import Container from '../components/ui/Container.jsx';
import Button from '../components/ui/Button.jsx';
import './Checkout.css';

function orderStatusLabel(status) {
  if (status === 'pending') return 'Pendiente de pago';
  if (status === 'paid') return 'Pagado';
  return String(status || '—');
}

const emptyForm = {
  customerName: '',
  customerEmail: '',
  city: '',
  address: '',
  paymentMethod: 'mercadopago',
};

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { lines, subtotal, clearCart } = useCart();
  const { openLogin } = useLoginModal();

  const [phase, setPhase] = useState('review');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [lastOrder, setLastOrder] = useState(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);
  const [payMessage, setPayMessage] = useState(null);

  useEffect(() => {
    document.title = 'Checkout · ProFruit';
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        customerName: prev.customerName || user.fullName || user.username || '',
        customerEmail: prev.customerEmail || user.email || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    const mp = searchParams.get('mp');
    const orderParam = searchParams.get('order');
    if (mp === 'success' && orderParam) {
      setLastOrder({ id: Number(orderParam), status: 'paid', total: 0 });
      setPhase('done');
      setPayMessage('Pago recibido por Mercado Pago. Revisa tu correo para la confirmación.');
    }
  }, [searchParams]);

  const step = useMemo(() => {
    if (lastOrder?.status === 'paid') return 4;
    if (phase === 'payment') return 3;
    if (phase === 'shipping') return 2;
    return 1;
  }, [lastOrder, phase]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const pagarManual = useCallback(async (orderId, paymentMethod) => {
    setPayError(null);
    setPayMessage(null);
    setPaying(true);
    try {
      const res = await fetch(api('/api/pay'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, payment_method: paymentMethod }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.useMercadoPago) {
          throw new Error('Este pedido requiere pago en línea con Mercado Pago.');
        }
        throw new Error(data.error || data.message || 'No se pudo procesar el pago.');
      }
      setLastOrder((prev) =>
        prev && prev.id === orderId ? { ...prev, status: 'paid' } : prev,
      );
      setPhase('done');
      setPayMessage(
        data.emailSent
          ? data.message
          : `${data.message || 'Pago registrado.'}${data.emailError ? ` (${data.emailError})` : ''}`,
      );
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Error al pagar.');
    } finally {
      setPaying(false);
    }
  }, []);

  const pagarMercadoPago = useCallback(async (orderId) => {
    setPayError(null);
    setPayMessage(null);
    setPaying(true);
    try {
      const res = await fetch(api('/api/pay/mercadopago'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.hint || 'No se pudo iniciar Mercado Pago.');
      }
      if (data.init_point) {
        window.location.href = data.init_point;
        return;
      }
      throw new Error('Mercado Pago no devolvió enlace de pago.');
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Error al conectar con Mercado Pago.');
    } finally {
      setPaying(false);
    }
  }, []);

  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    setError(null);
    setPayError(null);
    setPayMessage(null);

    if (lines.length === 0) {
      setError('Tu bolsa está vacía.');
      return;
    }
    if (!user) {
      setError('Inicia sesión para confirmar tu pedido.');
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
          customerName: form.customerName.trim(),
          customerEmail: form.customerEmail.trim(),
          city: form.city.trim(),
          address: form.address.trim(),
          paymentMethod: form.paymentMethod,
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
      setLastOrder({
        id: Number(data.id),
        status: typeof data.status === 'string' ? data.status : 'pending',
        total: Number(data.total),
        paymentMethod: form.paymentMethod,
      });
      setPhase('payment');
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
            Ver productos
          </Button>
        </Container>
      </div>
    );
  }

  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === form.paymentMethod);
  const orderPaymentMethod = lastOrder?.paymentMethod ?? form.paymentMethod;
  const isOnlinePay = orderPaymentMethod === 'mercadopago' || orderPaymentMethod === 'pse';

  return (
    <div className="checkout-page">
      <Container className="checkout-container">
        <header className="checkout-header">
          <Link to="/" className="checkout-back">
            <FaArrowLeft aria-hidden /> Volver al inicio
          </Link>
          <h1 className="checkout-title">Checkout</h1>
          <p className="checkout-subtitle">Revisa, confirma tus datos y elige cómo pagar.</p>
        </header>

        <ol className="checkout-steps" aria-label="Pasos de compra">
          <li className={`checkout-step ${step >= 1 ? 'checkout-step--active' : ''} ${step > 1 ? 'checkout-step--done' : ''}`}>
            <span className="checkout-step-num">1</span>
            <span>Revisar</span>
          </li>
          <li className={`checkout-step ${step >= 2 ? 'checkout-step--active' : ''} ${step > 2 ? 'checkout-step--done' : ''}`}>
            <span className="checkout-step-num">2</span>
            <span>Datos</span>
          </li>
          <li className={`checkout-step ${step >= 3 ? 'checkout-step--active' : ''} ${step > 3 ? 'checkout-step--done' : ''}`}>
            <span className="checkout-step-num">3</span>
            <span>Pagar</span>
          </li>
        </ol>

        <div className="checkout-layout">
          <section className="checkout-main" aria-label="Detalle del pedido">
            {(phase === 'review' || (phase === 'shipping' && !lastOrder)) && (
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

                {phase === 'review' && (
                  <>
                    {!user ? (
                      <div className="checkout-login-banner">
                        <p>Inicia sesión para continuar.</p>
                        <Button type="button" variant="primary" size="md" onClick={openLogin}>
                          Entrar o registrarse
                        </Button>
                      </div>
                    ) : (
                      <Button type="button" variant="dark" size="md" className="checkout-submit" onClick={() => setPhase('shipping')}>
                        Continuar con datos de envío
                      </Button>
                    )}
                  </>
                )}

                {phase === 'shipping' && user && (
                  <form className="checkout-form" onSubmit={handleConfirmOrder}>
                    <h2 className="checkout-section-title">Datos de envío y contacto</h2>
                    <p className="checkout-form-note">
                      El correo que indiques recibirá la confirmación del pedido y novedades de envío.
                    </p>

                    <div className="checkout-fields">
                      <label className="checkout-field">
                        <span>Nombre completo</span>
                        <input
                          type="text"
                          required
                          autoComplete="name"
                          value={form.customerName}
                          onChange={(e) => setField('customerName', e.target.value)}
                        />
                      </label>
                      <label className="checkout-field">
                        <span>Correo electrónico</span>
                        <input
                          type="email"
                          required
                          autoComplete="email"
                          value={form.customerEmail}
                          onChange={(e) => setField('customerEmail', e.target.value)}
                        />
                      </label>
                      <label className="checkout-field">
                        <span>Ciudad</span>
                        <input
                          type="text"
                          required
                          autoComplete="address-level2"
                          value={form.city}
                          onChange={(e) => setField('city', e.target.value)}
                        />
                      </label>
                      <label className="checkout-field checkout-field--full">
                        <span>Dirección de envío</span>
                        <input
                          type="text"
                          required
                          autoComplete="street-address"
                          placeholder="Calle, número, barrio, complemento"
                          value={form.address}
                          onChange={(e) => setField('address', e.target.value)}
                        />
                      </label>
                    </div>

                    <h3 className="checkout-subsection-title">Método de pago</h3>
                    <fieldset className="checkout-payment-options">
                      {PAYMENT_METHODS.map((method) => (
                        <label key={method.id} className="checkout-payment-option">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.id}
                            checked={form.paymentMethod === method.id}
                            onChange={() => setField('paymentMethod', method.id)}
                          />
                          <span className="checkout-payment-option-body">
                            <strong>{method.label}</strong>
                            <small>{method.hint}</small>
                          </span>
                        </label>
                      ))}
                    </fieldset>

                    {error && <p className="checkout-msg checkout-msg--error">{error}</p>}

                    <div className="checkout-form-actions">
                      <Button type="button" variant="secondary" size="md" onClick={() => setPhase('review')}>
                        Volver
                      </Button>
                      <Button type="submit" variant="dark" size="md" disabled={submitting} className="checkout-submit">
                        {submitting ? 'Creando pedido…' : 'Confirmar pedido'}
                      </Button>
                    </div>
                  </form>
                )}
              </>
            )}

            {phase === 'payment' && lastOrder && lastOrder.status !== 'paid' && (
              <div className="checkout-order-done">
                <h2 className="checkout-section-title">Pedido #{lastOrder.id} creado</h2>
                <p className="checkout-order-status">
                  Método elegido: <strong>{paymentMethodLabel(orderPaymentMethod)}</strong>
                </p>
                <p className="checkout-form-note">
                  {isOnlinePay
                    ? 'Serás redirigido a Mercado Pago para completar el pago de forma segura.'
                    : 'Confirmaremos tu pedido y te contactaremos para coordinar el pago y envío.'}
                </p>
                {isOnlinePay ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    disabled={paying}
                    onClick={() => pagarMercadoPago(lastOrder.id)}
                    className="checkout-pay-btn"
                  >
                    {paying ? 'Conectando…' : 'Pagar con Mercado Pago'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    disabled={paying}
                    onClick={() => pagarManual(lastOrder.id, orderPaymentMethod)}
                    className="checkout-pay-btn"
                  >
                    {paying ? 'Procesando…' : 'Confirmar pedido (efectivo)'}
                  </Button>
                )}
                {payError && <p className="checkout-msg checkout-msg--error">{payError}</p>}
              </div>
            )}

            {(phase === 'done' || lastOrder?.status === 'paid') && (
              <div className="checkout-order-done checkout-order-done--success">
                <h2 className="checkout-section-title">¡Gracias por tu compra!</h2>
                {lastOrder ? <p>Pedido #{lastOrder.id} · {orderStatusLabel(lastOrder.status)}</p> : null}
                {payMessage && <p className="checkout-msg checkout-msg--success">{payMessage}</p>}
                <Button type="button" variant="primary" size="md" onClick={() => navigate('/#products')}>
                  Seguir comprando
                </Button>
              </div>
            )}
          </section>

          <aside className="checkout-aside" aria-label="Resumen">
            <div className="checkout-summary-card">
              <h2>Resumen</h2>
              <div className="checkout-summary-row">
                <span>Subtotal</span>
                <strong>{formatPrice(lastOrder?.total ?? subtotal)}</strong>
              </div>
              <div className="checkout-summary-row checkout-summary-row--muted">
                <span>Envío</span>
                <span>Se confirma según ciudad</span>
              </div>
              {phase === 'shipping' && selectedMethod ? (
                <div className="checkout-summary-row checkout-summary-row--muted">
                  <span>Pago</span>
                  <span>{selectedMethod.label}</span>
                </div>
              ) : null}
              <div className="checkout-summary-row checkout-summary-row--total">
                <span>Total estimado</span>
                <strong>{formatPrice(lastOrder?.total ?? subtotal)}</strong>
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
