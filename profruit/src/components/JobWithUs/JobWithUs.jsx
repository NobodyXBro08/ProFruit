// src/components/JobsWithUs/JobsWithUs.jsx
import React from 'react';
import './JobWithUs.css';
import { FiShoppingBag, FiHome, FiTruck, FiUsers } from 'react-icons/fi';

const partners = [
  {
    id: 1,
    name: 'Supermercados Éxito',
    label: 'Cadena de Supermercados',
    description: 'Distribuimos en más de 50 tiendas a nivel nacional.',
    icon: <FiShoppingBag />,
  },
  {
    id: 2,
    name: 'Tiendas D1',
    label: 'Retail Nacional',
    description: 'Presencia en tiendas de barrio en todo el país.',
    icon: <FiHome />,
  },
  {
    id: 3,
    name: 'Rappi & Domicilios.com',
    label: 'Plataformas de Delivery',
    description: 'Entrega a domicilio en las principales ciudades.',
    icon: <FiTruck />,
  },
  {
    id: 4,
    name: 'Cooperativa de Campesinos',
    label: 'Productores Locales',
    description: 'Trabajamos con más de 200 familias campesinas.',
    icon: <FiUsers />,
  },
];

export default function JobsWithUs() {
  return (
    <section className="jobs" id="jobs">
      <div className="jobs-header">
        <h2 className="jobs-title">Con quiénes trabajamos</h2>
        <p className="jobs-subtitle">
          Hemos construido una sólida red de aliados que nos permite llevar la mejor calidad
          desde los campos colombianos hasta tu mesa.
        </p>
      </div>

      <div className="jobs-grid">
        {partners.map((item) => (
          <article key={item.id} className="jobs-card">
            <div className="jobs-icon">{item.icon}</div>
            <h3 className="jobs-name">{item.name}</h3>
            <p className="jobs-label">{item.label}</p>
            <p className="jobs-description">{item.description}</p>
          </article>
        ))}
      </div>

      <div className="jobs-cta">
        <h3 className="jobs-cta-title">¿Quieres ser nuestro aliado?</h3>
        <p className="jobs-cta-text">
          Si tienes una tienda, restaurante o eres distribuidor, únete a nuestra red de aliados
          y ofrece productos de la más alta calidad a tus clientes.
        </p>

        <div className="jobs-cta-actions">
          <button className="jobs-btn jobs-btn-primary">Contactar ventas</button>
          <button className="jobs-btn jobs-btn-secondary">Descargar catálogo</button>
        </div>
      </div>
    </section>
  );
}
