import React from 'react';
import { NavLink } from 'react-router-dom';
import './AdminLayout.css';

export default function AdminLayout({ title, subtitle, children }) {
  return (
    <div className="admin-layout">
      <nav className="admin-tabs" aria-label="Secciones de administración">
        <NavLink to="/admin" end className={({ isActive }) => `admin-tab${isActive ? ' admin-tab--active' : ''}`}>
          Inicio
        </NavLink>
        <NavLink to="/admin/pedidos" className={({ isActive }) => `admin-tab${isActive ? ' admin-tab--active' : ''}`}>
          Pedidos
        </NavLink>
        <NavLink to="/admin/productos" className={({ isActive }) => `admin-tab${isActive ? ' admin-tab--active' : ''}`}>
          Productos
        </NavLink>
      </nav>

      <header className="admin-layout-header">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>

      {children}
    </div>
  );
}
