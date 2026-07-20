import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaLeaf, FaWhatsapp } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useLoginModal } from '../context/LoginModalContext.jsx';
import { formatPrice } from '../utils/formatPrice';
import { buildWhatsAppOrderMessage, buildWhatsAppUrl } from '../utils/orderSummary';
import { SITE } from '../config/site';
import { PAYMENT_METHODS, paymentMethodLabel } from '../config/payments';
import Container from '../components/ui/Container.jsx';
import Button from '../components/ui/Button.jsx';
import './Checkout.css';

const emptyForm = {
  customerName: '',
  customerPhone: '',
  city: '',
  address: '',
  paymentMethod: 'whatsapp',
  saveProfile: true,
};

function buildSyncWarning(report) {
  if (!report?.changed) return null;
  const parts = [];
  if (report.priceChanged?.length) {
    parts.push(`Precios actualizados: ${report.priceChanged.join(', ')}.`);
  }
  if (report.stockCapped?.length) {
    parts.push(`Cantidad ajustada por stock: ${report.stockCapped.join(', ')}.`);
  }
  if (report.removed?.length) {
    parts.push(`Sin stock o no disponibles: ${report.removed.join(', ')}.`);
  }
  return parts.length ? parts.join(' ') : 'Tu bolsa se actualizó con precios y stock actuales.';
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user, authFetch, getAuthToken } = useAuth();
  const { lines, subtotal, savings, clearCart, refreshFromApi } = useCart();
  const { openLogin } = useLoginModal();

  const [phase, setPhase] = useState('review');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState(null);
  const [syncWarning, setSyncWarning] = useState(null);
  const [lastOrder, setLastOrder] = useState(null);
  const [doneMessage, setDoneMessage] = useState(null);
  const [serverTotalHint, setServerTotalHint] = useState(null);

  const revalidateCart = useCallback(async () => {
    setValidating(true);
    try {
      const report = await refreshFromApi();
      const warn = buildSyncWarning(report);
      if (warn) setSyncWarning(warn);
    } finally {
      setValidating(false);
    }
  }, [refreshFromApi]);

  useEffect(() => {
    document.title = 'Checkout · ProFruit';
    window.scrollTo(0, 0);
    revalidateCart();
  }, [revalidateCart]);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      customerName: prev.customerName || user.fullName || '',
      customerPhone: prev.customerPhone || user.phone || '',
      city: prev.city || user.city || '',
      address: prev.address || user.address || user.shippingAddress || '',
    }));
  }, [user]);

  const step = useMemo(() => {
    if (phase === 'done') return 4;
    if (phase === 'payment') return 3;
    if (phase === 'shipping') return 2;
    return 1;
  }, [phase]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    setError(null);
    setDoneMessage(null);
    setServerTotalHint(null);

    if (lines.length === 0) {
      setError('Tu bolsa está vacía.');
      return;
    }
    if (!user) {
      setError('Inicia sesión para confirmar tu pedido.');
      openLogin();
      return;
    }
    if (!getAuthToken()) {
      setError('Tu sesión es antigua. Pulsa Salir arriba, vuelve a entrar con tu usuario y contraseña, e intenta de nuevo.');
      return;
    }

    const userId = Number(user.id);
    if (!Number.isInteger(userId) || userId < 1) {
      setError('Sesión no válida. Cierra sesión y vuelve a entrar.');
      return;
    }

    setSubmitting(true);
    try {
      const report = await refreshFromApi();
      const warn = buildSyncWarning(report);
      if (warn) {
        setSyncWarning(warn);
        setError(`${warn} Revisa el resumen y confirma de nuevo.`);
        setSubmitting(false);
        return;
      }

      const freshLines = Array.isArray(report.lines) && report.lines.length ? report.lines : lines;
      if (freshLines.length === 0) {
        throw new Error('Tu bolsa quedó vacía tras validar el stock.');
      }

      const cartTotalBefore =
        Math.round(freshLines.reduce((s, l) => s + l.quantity * l.price, 0) * 100) / 100;

      const orderLines = freshLines.map((l) => ({
        name: l.name,
        quantity: l.quantity,
        price: l.price,
      }));

      const res = await authFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          customerName: form.customerName.trim(),
          customerPhone: form.customerPhone.trim(),
          city: form.city.trim(),
          address: form.address.trim(),
          paymentMethod: form.paymentMethod,
          saveProfile: Boolean(form.saveProfile),
          items: freshLines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Sesión expirada o sin token. Cierra sesión, vuelve a entrar e intenta de nuevo.');
        }
        const base = data.error || data.message || 'No se pudo crear el pedido.';
        const extra = typeof data.details === 'string' && data.details.trim() ? ` (${data.details.trim()})` : '';
        throw new Error(`${base}${extra}`);
      }

      const serverTotal = Number(data.total);
      if (Number.isFinite(serverTotal) && Math.abs(serverTotal - cartTotalBefore) > 0.01) {
        setServerTotalHint(
          `El total cobrado por el servidor es ${formatPrice(serverTotal)} (tu bolsa mostraba ${formatPrice(cartTotalBefore)}).`,
        );
      }

      const nameByProductId = new Map(freshLines.map((l) => [l.productId, l.name]));
      const confirmedLines = Array.isArray(data.items) && data.items.length
        ? data.items.map((item) => ({
            name: nameByProductId.get(item.productId) || `Producto #${item.productId}`,
            quantity: item.quantity,
            price: item.unitPrice,
          }))
        : orderLines;

      clearCart();
      setLastOrder({
        id: Number(data.id),
        total: serverTotal,
        paymentMethod: form.paymentMethod,
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        lines: confirmedLines,
      });
      setPhase('payment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  const openWhatsApp = () => {
    if (!lastOrder) return;
    const message = buildWhatsAppOrderMessage({
      orderId: lastOrder.id,
      customerName: lastOrder.customerName,
      customerPhone: lastOrder.customerPhone,
      city: lastOrder.city,
      address: lastOrder.address,
      paymentMethod: lastOrder.paymentMethod,
      total: lastOrder.total,
      lines: lastOrder.lines,
    });
    window.open(buildWhatsAppUrl(message), '_blank', 'noopener,noreferrer');
  };

  const finishOrder = () => {
    const extra =
      lastOrder?.paymentMethod === 'efectivo'
        ? ' Pagas en efectivo al recibir tu pedido.'
        : '';
    setDoneMessage(
      `Pedido registrado.${extra} Si aún no lo enviaste, usa WhatsApp para confirmarlo con nosotros.`,
    );
    setPhase('done');
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
  const summaryLines = lastOrder?.lines ?? lines.map((l) => ({ name: l.name, quantity: l.quantity, price: l.price }));
  const summaryTotal = lastOrder?.total ?? subtotal;

  return (
    <div className="checkout-page">
      <Container className="checkout-container">
        <header className="checkout-header">
          <Link to="/" className="checkout-back">
            <FaArrowLeft aria-hidden /> Volver al inicio
          </Link>
          <h1 className="checkout-title">Checkout</h1>
          <p className="checkout-subtitle">Confirma tu pedido por WhatsApp o paga en efectivo al recibir.</p>
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
            <span>Confirmar</span>
          </li>
        </ol>

        {validating ? <p className="checkout-form-note">Comprobando precios y stock…</p> : null}
        {syncWarning ? <p className="checkout-msg checkout-msg--warn">{syncWarning}</p> : null}

        <div className="checkout-layout">
          <section className="checkout-main" aria-label="Detalle del pedido">
            {(phase === 'review' || phase === 'shipping') && (
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
                          {line.originalPrice != null && line.originalPrice > line.price ? (
                            <> · <s>{formatPrice(line.originalPrice)}</s></>
                          ) : null}
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
                      <Button
                        type="button"
                        variant="dark"
                        size="md"
                        className="checkout-submit"
                        disabled={validating || lines.length === 0}
                        onClick={() => setPhase('shipping')}
                      >
                        Continuar con datos de envío
                      </Button>
                    )}
                  </>
                )}

                {phase === 'shipping' && user && (
                  <form className="checkout-form" onSubmit={handleConfirmOrder}>
                    <h2 className="checkout-section-title">Datos de envío y contacto</h2>
                    <p className="checkout-form-note">
                      Al confirmar podrás enviar el resumen completo por WhatsApp. El total final lo calcula el servidor con precios actuales.
                    </p>

                    <div className="checkout-fields">
                      <label className="checkout-field">
                        <span>Nombre completo</span>
                        <input
                          type="text"
                          required
                          autoComplete="name"
                          placeholder="Como aparece en el envío"
                          value={form.customerName}
                          onChange={(e) => setField('customerName', e.target.value)}
                        />
                      </label>
                      <label className="checkout-field">
                        <span>Teléfono / WhatsApp</span>
                        <input
                          type="tel"
                          required
                          autoComplete="tel"
                          placeholder="300 000 0000"
                          value={form.customerPhone}
                          onChange={(e) => setField('customerPhone', e.target.value)}
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

                    <label className="checkout-save-profile">
                      <input
                        type="checkbox"
                        checked={form.saveProfile}
                        onChange={(e) => setField('saveProfile', e.target.checked)}
                      />
                      <span>Guardar estos datos en mi perfil para la próxima compra</span>
                    </label>

                    <h3 className="checkout-subsection-title">Forma de pago</h3>
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
                        {submitting ? 'Registrando pedido…' : 'Confirmar pedido'}
                      </Button>
                    </div>
                  </form>
                )}
              </>
            )}

            {phase === 'payment' && lastOrder && (
              <div className="checkout-order-done">
                <h2 className="checkout-section-title">Pedido #{lastOrder.id} registrado</h2>
                <p className="checkout-order-status">
                  Pago: <strong>{paymentMethodLabel(lastOrder.paymentMethod)}</strong>
                </p>
                {serverTotalHint ? <p className="checkout-msg checkout-msg--warn">{serverTotalHint}</p> : null}

                <div className="checkout-summary-inline">
                  <h3>Resumen del pedido</h3>
                  <ul className="checkout-lines">
                    {lastOrder.lines.map((line) => (
                      <li key={`${line.name}-${line.quantity}`} className="checkout-line">
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
                  <p className="checkout-summary-inline-total">
                    Total (servidor): <strong>{formatPrice(lastOrder.total)}</strong>
                  </p>
                  <p className="checkout-form-note">
                    Envío a {lastOrder.address}, {lastOrder.city}
                  </p>
                </div>

                <p className="checkout-form-note">
                  {lastOrder.paymentMethod === 'efectivo'
                    ? 'Envía el resumen por WhatsApp para coordinar la entrega. Pagas en efectivo al recibir.'
                    : 'Pulsa el botón para enviarnos el resumen por WhatsApp y coordinar tu pedido.'}
                </p>
                <Button type="button" variant="primary" size="md" className="checkout-pay-btn" onClick={openWhatsApp}>
                  <FaWhatsapp aria-hidden />
                  Enviar pedido por WhatsApp
                </Button>

                <Button type="button" variant="dark" size="md" className="checkout-pay-btn" onClick={finishOrder}>
                  Finalizar
                </Button>
              </div>
            )}

            {phase === 'done' && lastOrder && (
              <div className="checkout-order-done checkout-order-done--success">
                <h2 className="checkout-section-title">¡Gracias por tu compra!</h2>
                <p>Pedido #{lastOrder.id} · Pendiente de confirmación</p>
                {doneMessage && <p className="checkout-msg checkout-msg--success">{doneMessage}</p>}
                <Button type="button" variant="primary" size="md" className="checkout-pay-btn" onClick={openWhatsApp}>
                  <FaWhatsapp aria-hidden />
                  Enviar por WhatsApp
                </Button>
                <Button type="button" variant="secondary" size="md" onClick={() => navigate('/mis-pedidos')}>
                  Ver mis pedidos
                </Button>
                <Button type="button" variant="dark" size="md" onClick={() => navigate('/#products')}>
                  Seguir comprando
                </Button>
              </div>
            )}
          </section>

          <aside className="checkout-aside" aria-label="Resumen">
            <div className="checkout-summary-card">
              <h2>Resumen</h2>
              <ul className="checkout-lines checkout-lines--compact">
                {summaryLines.map((line) => (
                  <li key={`${line.name}-${line.quantity}`} className="checkout-line checkout-line--compact">
                    <div className="checkout-line-info">
                      <span className="checkout-line-name">{line.name}</span>
                      <span className="checkout-line-meta">{line.quantity} u.</span>
                    </div>
                    <span className="checkout-line-total">{formatPrice(line.quantity * line.price)}</span>
                  </li>
                ))}
              </ul>
              {savings > 0 && !lastOrder ? (
                <div className="checkout-summary-row">
                  <span>Ahorras</span>
                  <strong>{formatPrice(savings)}</strong>
                </div>
              ) : null}
              <div className="checkout-summary-row checkout-summary-row--total">
                <span>{lastOrder ? 'Total cobrado' : 'Total estimado'}</span>
                <strong>{formatPrice(summaryTotal)}</strong>
              </div>
              {!lastOrder ? (
                <p className="checkout-payment-note">El total definitivo lo confirma el servidor al registrar el pedido.</p>
              ) : null}
              {selectedMethod && phase === 'shipping' ? (
                <p className="checkout-payment-note">Pago: {selectedMethod.label}</p>
              ) : null}
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
