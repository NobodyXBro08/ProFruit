import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowLeft,
  FaBoxOpen,
  FaClipboardList,
  FaTags,
  FaWarehouse,
  FaUsers,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';
import { formatPrice } from '../utils/formatPrice';
import AdminLayout from '../components/AdminLayout.jsx';
import Container from '../components/ui/Container.jsx';
import './AdminHome.css';

const MODULES = [
  {
    to: '/admin/pedidos',
    permission: 'orders:manage',
    icon: FaClipboardList,
    title: 'Pedidos',
    description: 'Revisa pedidos pendientes, confirma entregas y contacta clientes.',
  },
  {
    to: '/admin/productos',
    permission: 'products:manage',
    icon: FaBoxOpen,
    title: 'Productos',
    description: 'Crea, edita y elimina productos del catálogo, precios y stock.',
  },
  {
    to: '/admin/inventario',
    permission: 'inventory:manage',
    icon: FaWarehouse,
    title: 'Inventario',
    description: 'Controla entradas, salidas, alertas de stock bajo e historial.',
  },
  {
    to: '/admin/promociones',
    permission: 'promotions:manage',
    icon: FaTags,
    title: 'Promociones',
    description: 'Configura descuentos por producto con fechas de vigencia.',
  },
  {
    to: '/admin/usuarios',
    permission: 'users:manage',
    icon: FaUsers,
    title: 'Usuarios',
    description: 'Gestiona roles: editor, administrador y super administrador.',
  },
];

export default function AdminHome() {
  const { authFetch, can } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Admin · ProFruit';

    async function loadStats() {
      if (!can('stats:view')) {
        setLoading(false);
        return;
      }
      try {
        const res = await authFetch('/api/admin/stats');
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'No se pudieron cargar las estadísticas.');
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar estadísticas.');
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [authFetch, can]);

  const modules = MODULES.filter((m) => can(m.permission));

  return (
    <div className="admin-home">
      <Container className="admin-home-container">
        <Link to="/" className="admin-home-back">
          <FaArrowLeft aria-hidden /> Volver a la tienda
        </Link>

        <AdminLayout title="Panel de administración" subtitle="Resumen general y acceso rápido a cada módulo.">
          {loading ? <p className="admin-home-muted">Cargando estadísticas…</p> : null}
          {error ? <p className="admin-home-error">{error}</p> : null}

          {stats ? (
            <section className="admin-home-stats" aria-label="Estadísticas generales">
              <div className="admin-home-stat">
                <span className="admin-home-stat-label">Productos</span>
                <strong>{stats.products?.total ?? 0}</strong>
              </div>
              <div className="admin-home-stat">
                <span className="admin-home-stat-label">Disponibles</span>
                <strong>{stats.inventory?.availableUnits ?? 0}</strong>
              </div>
              <div className="admin-home-stat">
                <span className="admin-home-stat-label">Pedidos pendientes</span>
                <strong>{stats.orders?.pending ?? 0}</strong>
              </div>
              <div className="admin-home-stat">
                <span className="admin-home-stat-label">Ventas confirmadas</span>
                <strong>{formatPrice(stats.orders?.revenue ?? 0)}</strong>
              </div>
              <div className="admin-home-stat">
                <span className="admin-home-stat-label">Promos activas</span>
                <strong>{stats.promotions?.active ?? 0}</strong>
              </div>
              {stats.users ? (
                <div className="admin-home-stat">
                  <span className="admin-home-stat-label">Usuarios</span>
                  <strong>{stats.users.total}</strong>
                </div>
              ) : null}
            </section>
          ) : null}

          {stats?.lowStockAlerts?.length ? (
            <section className="admin-home-alerts" aria-label="Alertas de inventario">
              <h2>
                <FaExclamationTriangle aria-hidden /> Alertas de stock
              </h2>
              <ul>
                {stats.lowStockAlerts.map((item) => (
                  <li key={item.id}>
                    <strong>{item.name}</strong>
                    <span>
                      {item.status === 'out' ? 'Agotado' : `Solo ${item.available} disponibles`}
                    </span>
                  </li>
                ))}
              </ul>
              {can('inventory:manage') ? (
                <Link to="/admin/inventario" className="admin-home-alerts-link">
                  Ir a inventario
                </Link>
              ) : null}
            </section>
          ) : null}

          <div className="admin-home-grid">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link key={mod.to} to={mod.to} className="admin-home-card">
                  <Icon className="admin-home-card-icon" aria-hidden />
                  <h2>{mod.title}</h2>
                  <p>{mod.description}</p>
                </Link>
              );
            })}
          </div>
        </AdminLayout>
      </Container>
    </div>
  );
}
