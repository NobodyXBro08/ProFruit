import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';
import { useLoginModal } from '../context/LoginModalContext.jsx';
import { formatPrice } from '../utils/formatPrice';
import { orderStatusLabel } from '../utils/orderStatus';
import { paymentMethodLabel } from '../config/payments';
import { formatApiError } from '../utils/apiError';
import Container from '../components/ui/Container.jsx';
import Button from '../components/ui/Button.jsx';
import './MyOrders.css';

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export default function MyOrders() {
  const navigate = useNavigate();
  const { user, authFetch, sessionReady, updateProfile } = useAuth();
  const { openLogin } = useLoginModal();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({
    fullName: '',
    phone: '',
    city: '',
    address: '',
  });
  const [profileMsg, setProfileMsg] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/orders');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(formatApiError(data, res.status));
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar tus pedidos.');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    document.title = 'Mis pedidos · ProFruit';
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    if (!user) {
      setLoading(false);
      return;
    }
    setProfile({
      fullName: user.fullName || '',
      phone: user.phone || '',
      city: user.city || '',
      address: user.address || user.shippingAddress || '',
    });
    loadOrders();
  }, [sessionReady, user, loadOrders]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await updateProfile({
        fullName: profile.fullName.trim(),
        phone: profile.phone.trim(),
        city: profile.city.trim(),
        address: profile.address.trim(),
      });
      setProfileMsg('Perfil guardado. Se usará en el próximo checkout.');
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : 'No se pudo guardar el perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (!sessionReady) {
    return (
      <div className="my-orders-page">
        <Container>
          <p className="my-orders-muted">Cargando sesión…</p>
        </Container>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="my-orders-page">
        <Container className="my-orders-empty">
          <h1>Mis pedidos</h1>
          <p>Inicia sesión para ver el historial y editar tu perfil de envío.</p>
          <Button type="button" variant="primary" size="md" onClick={openLogin}>
            Entrar o registrarse
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="my-orders-page">
      <Container className="my-orders-container">
        <Link to="/" className="my-orders-back">
          <FaArrowLeft aria-hidden /> Volver al inicio
        </Link>
        <header className="my-orders-header">
          <h1>Mis pedidos</h1>
          <p>Sigue el estado de tus compras y actualiza tus datos de envío.</p>
        </header>

        <section className="my-orders-profile" aria-label="Perfil de envío">
          <h2>Datos de envío</h2>
          <form className="my-orders-profile-form" onSubmit={handleSaveProfile}>
            <label>
              <span>Nombre completo</span>
              <input
                value={profile.fullName}
                onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                autoComplete="name"
              />
            </label>
            <label>
              <span>Teléfono</span>
              <input
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                autoComplete="tel"
              />
            </label>
            <label>
              <span>Ciudad</span>
              <input
                value={profile.city}
                onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                autoComplete="address-level2"
              />
            </label>
            <label className="my-orders-profile-full">
              <span>Dirección</span>
              <input
                value={profile.address}
                onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                autoComplete="street-address"
              />
            </label>
            <Button type="submit" variant="secondary" size="sm" disabled={savingProfile}>
              {savingProfile ? 'Guardando…' : 'Guardar perfil'}
            </Button>
          </form>
          {profileMsg ? <p className="my-orders-profile-msg">{profileMsg}</p> : null}
        </section>

        <div className="my-orders-toolbar">
          <h2>Historial</h2>
          <Button type="button" variant="secondary" size="sm" onClick={loadOrders} disabled={loading}>
            Actualizar
          </Button>
        </div>

        {error ? <p className="my-orders-error">{error}</p> : null}
        {loading ? <p className="my-orders-muted">Cargando pedidos…</p> : null}
        {!loading && orders.length === 0 ? (
          <div className="my-orders-empty-list">
            <p>Aún no tienes pedidos.</p>
            <Button type="button" variant="primary" size="md" onClick={() => navigate('/#products')}>
              Ir a la tienda
            </Button>
          </div>
        ) : null}

        <ul className="my-orders-list">
          {orders.map((order) => (
            <li key={order.id} className="my-order-card">
              <div className="my-order-card-head">
                <div>
                  <h3>Pedido #{order.id}</h3>
                  <p className="my-order-meta">{formatDate(order.createdAt)}</p>
                </div>
                <span className={`my-order-status my-order-status--${order.status}`}>
                  {orderStatusLabel(order.status)}
                </span>
              </div>
              <p className="my-order-total">Total: {formatPrice(order.total)}</p>
              <p className="my-order-meta">Pago: {paymentMethodLabel(order.paymentMethod)}</p>
              <p className="my-order-meta">
                {order.address}
                {order.city ? `, ${order.city}` : ''}
              </p>
              <ul className="my-order-items">
                {order.items.map((item) => (
                  <li key={`${order.id}-${item.productId}`}>
                    {item.productName} × {item.quantity} — {formatPrice(item.quantity * item.unitPrice)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}
