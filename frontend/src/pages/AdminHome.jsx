import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaBoxOpen, FaClipboardList } from 'react-icons/fa';
import AdminLayout from '../components/AdminLayout.jsx';
import Container from '../components/ui/Container.jsx';
import './AdminHome.css';

export default function AdminHome() {
  useEffect(() => {
    document.title = 'Admin · ProFruit';
  }, []);

  return (
    <div className="admin-home">
      <Container className="admin-home-container">
        <Link to="/" className="admin-home-back">
          <FaArrowLeft aria-hidden /> Volver a la tienda
        </Link>

        <AdminLayout title="Panel de administración" subtitle="Elige qué quieres gestionar.">
          <div className="admin-home-grid">
            <Link to="/admin/pedidos" className="admin-home-card">
              <FaClipboardList className="admin-home-card-icon" aria-hidden />
              <h2>Pedidos</h2>
              <p>Revisa pedidos pendientes, confirma entregas y contacta clientes por WhatsApp.</p>
            </Link>
            <Link to="/admin/productos" className="admin-home-card">
              <FaBoxOpen className="admin-home-card-icon" aria-hidden />
              <h2>Catálogo de productos</h2>
              <p>Crea, edita y elimina productos del catálogo, precios y stock.</p>
            </Link>
          </div>
        </AdminLayout>
      </Container>
    </div>
  );
}
