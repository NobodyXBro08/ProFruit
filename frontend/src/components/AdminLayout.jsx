import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { roleLabel } from '../utils/roles';
import './AdminLayout.css';

const NAV_ITEMS = [
  { to: '/admin', end: true, label: 'Inicio', permission: 'panel:access' },
  { to: '/admin/pedidos', label: 'Pedidos', permission: 'orders:manage' },
  { to: '/admin/productos', label: 'Productos', permission: 'products:manage' },
  { to: '/admin/inventario', label: 'Inventario', permission: 'inventory:manage' },
  { to: '/admin/promociones', label: 'Promociones', permission: 'promotions:manage' },
  { to: '/admin/usuarios', label: 'Usuarios', permission: 'users:manage' },
];

export default function AdminLayout({ title, subtitle, children }) {
  const { user, can } = useAuth();
  const visible = NAV_ITEMS.filter((item) => can(item.permission));

  return (
    <div className="admin-layout">
      <div className="admin-layout-meta">
        <span className="admin-layout-role">{roleLabel(user?.role)}</span>
      </div>

      <nav className="admin-tabs" aria-label="Secciones de administración">
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={Boolean(item.end)}
            className={({ isActive }) => `admin-tab${isActive ? ' admin-tab--active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <header className="admin-layout-header">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>

      {children}
    </div>
  );
}
