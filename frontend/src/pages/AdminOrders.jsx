import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaTimes, FaWhatsapp } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';
import { formatPrice } from '../utils/formatPrice';
import { paymentMethodLabel } from '../config/payments';
import { buildWhatsAppCustomerUrl, buildWhatsAppOrderMessage } from '../utils/orderSummary';
import { formatApiError } from '../utils/apiError';
import AdminLayout from '../components/AdminLayout.jsx';
import Container from '../components/ui/Container.jsx';
import Button from '../components/ui/Button.jsx';
import './AdminOrders.css';

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'paid', label: 'Confirmados' },
  { id: 'cancelled', label: 'Cancelados' },
];

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

function statusLabel(status) {
  if (status === 'paid') return 'Confirmado';
  if (status === 'pending') return 'Pendiente';
  if (status === 'cancelled') return 'Cancelado';
  return status;
}

function normalizeOrdersPayload(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.orders)) return data.orders;
  return [];
}

export default function AdminOrders() {
  const { authFetch } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/admin/orders');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(formatApiError(data, res.status));
      setOrders(normalizeOrdersPayload(data));
      if (data && typeof data.expiredStale === 'number' && data.expiredStale > 0) {
        setMessage(
          `Se liberó stock de ${data.expiredStale} pedido(s) pendiente(s) de más de 48 h.`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos.');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    document.title = 'Admin · Pedidos · ProFruit';
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const counts = useMemo(
    () => ({
      all: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      paid: orders.filter((o) => o.status === 'paid').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    }),
    [orders],
  );

  const confirmOrder = async (order) => {
    setConfirmingId(order.id);
    setError(null);
    setMessage(null);
    try {
      const res = await authFetch('/api/pay', {
        method: 'POST',
        body: JSON.stringify({ order_id: order.id, payment_method: order.paymentMethod }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(formatApiError(data, res.status));
      setMessage(`Pedido #${order.id} confirmado. Stock actualizado.`);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo confirmar el pedido.');
    } finally {
      setConfirmingId(null);
    }
  };

  const cancelOrder = async (order) => {
    if (!window.confirm(`¿Cancelar el pedido #${order.id} y liberar el stock reservado?`)) return;
    setCancellingId(order.id);
    setError(null);
    setMessage(null);
    try {
      const res = await authFetch('/api/admin/orders', {
        method: 'POST',
        body: JSON.stringify({ action: 'cancel', order_id: order.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(formatApiError(data, res.status));
      setMessage(`Pedido #${order.id} cancelado. Reserva liberada.`);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cancelar el pedido.');
    } finally {
      setCancellingId(null);
    }
  };

  const openWhatsApp = (order) => {
    const lines = order.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      price: item.unitPrice,
    }));
    const text = buildWhatsAppOrderMessage({
      orderId: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      city: order.city,
      address: order.address,
      paymentMethod: order.paymentMethod,
      total: order.total,
      lines,
    });
    window.open(buildWhatsAppCustomerUrl(order.customerPhone, text), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="admin-orders">
      <Container className="admin-orders-container">
        <Link to="/" className="admin-orders-back">
          <FaArrowLeft aria-hidden /> Volver a la tienda
        </Link>

        <AdminLayout title="Pedidos" subtitle="Revisa, confirma, cancela y coordina entregas con tus clientes.">
          <div className="admin-orders-toolbar">
            <div className="admin-orders-filters" role="tablist" aria-label="Filtrar pedidos">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.id}
                  className={`admin-orders-filter${filter === f.id ? ' admin-orders-filter--active' : ''}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label} ({counts[f.id]})
                </button>
              ))}
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={loadOrders} disabled={loading}>
              Actualizar
            </Button>
          </div>

          {message ? <p className="admin-orders-success">{message}</p> : null}
          {error ? <p className="admin-orders-error">{error}</p> : null}
          {loading ? <p className="admin-orders-muted">Cargando pedidos…</p> : null}

          {!loading && filteredOrders.length === 0 ? (
            <p className="admin-orders-muted">No hay pedidos en este filtro.</p>
          ) : null}

          <ul className="admin-orders-list">
            {filteredOrders.map((order) => (
              <li key={order.id} className="admin-order-card">
                <div className="admin-order-card-head">
                  <div>
                    <h2>Pedido #{order.id}</h2>
                    <p className="admin-order-meta">{formatDate(order.createdAt)}</p>
                  </div>
                  <span className={`admin-order-status admin-order-status--${order.status}`}>
                    {statusLabel(order.status)}
                  </span>
                </div>

                <div className="admin-order-grid">
                  <div>
                    <h3>Cliente</h3>
                    <p>{order.customerName}</p>
                    <p>{order.customerPhone}</p>
                    <p>
                      {order.address}
                      {order.city ? `, ${order.city}` : ''}
                    </p>
                  </div>
                  <div>
                    <h3>Pago</h3>
                    <p>{paymentMethodLabel(order.paymentMethod)}</p>
                    <p className="admin-order-total">Total: {formatPrice(order.total)}</p>
                  </div>
                </div>

                <div className="admin-order-items">
                  <h3>Productos</h3>
                  <ul>
                    {order.items.map((item) => (
                      <li key={`${order.id}-${item.productId}-${item.quantity}`}>
                        {item.productName} × {item.quantity} — {formatPrice(item.quantity * item.unitPrice)}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="admin-order-actions">
                  <Button type="button" variant="primary" size="sm" onClick={() => openWhatsApp(order)}>
                    <FaWhatsapp aria-hidden /> WhatsApp
                  </Button>
                  {order.status === 'pending' ? (
                    <>
                      <Button
                        type="button"
                        variant="dark"
                        size="sm"
                        disabled={confirmingId === order.id || cancellingId === order.id}
                        onClick={() => confirmOrder(order)}
                      >
                        <FaCheck aria-hidden />
                        {confirmingId === order.id ? 'Confirmando…' : 'Confirmar pedido'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={confirmingId === order.id || cancellingId === order.id}
                        onClick={() => cancelOrder(order)}
                      >
                        <FaTimes aria-hidden />
                        {cancellingId === order.id ? 'Cancelando…' : 'Cancelar'}
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </AdminLayout>
      </Container>
    </div>
  );
}
