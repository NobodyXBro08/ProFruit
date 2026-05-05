import React from 'react';
import './JobWithUs.css';
import { FiShoppingBag, FiHome, FiTruck, FiUsers } from 'react-icons/fi';
import Container from '../ui/Container.jsx';
import SectionHeader from '../ui/SectionHeader.jsx';
import Button from '../ui/Button.jsx';

const partners = [
  {
    id: 1,
    name: 'Supermercados Éxito',
    label: 'Cadena de supermercados',
    description: 'Distribuimos en más de 50 tiendas a nivel nacional.',
    icon: <FiShoppingBag />,
  },
  {
    id: 2,
    name: 'Tiendas D1',
    label: 'Retail nacional',
    description: 'Presencia en tiendas de barrio en todo el país.',
    icon: <FiHome />,
  },
  {
    id: 3,
    name: 'Rappi & Domicilios.com',
    label: 'Plataformas de delivery',
    description: 'Entrega a domicilio en las principales ciudades.',
    icon: <FiTruck />,
  },
  {
    id: 4,
    name: 'Cooperativa de campesinos',
    label: 'Productores locales',
    description: 'Trabajamos con más de 200 familias campesinas.',
    icon: <FiUsers />,
  },
];

const SALES_MAIL = 'ventas@profruit.co';

export default function JobsWithUs() {
  return (
    <section className="jobs" id="jobs">
      <Container>
        <SectionHeader
          title="Con quiénes trabajamos"
          subtitle="Una red que conecta el campo colombiano con tu mesa: retail, delivery y productores de confianza."
        />

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
            Si tienes una tienda, restaurante o eres distribuidor, únete a nuestra red y ofrece productos de
            calidad a tus clientes.
          </p>

          <div className="jobs-cta-actions">
            <Button
              variant="primary"
              size="md"
              type="button"
              className="jobs-cta-btn"
              onClick={() => {
                window.location.href = `mailto:${SALES_MAIL}?subject=Aliado%20ProFruit`;
              }}
            >
              Contactar ventas
            </Button>
            <Button
              variant="secondary"
              size="md"
              type="button"
              className="jobs-cta-btn"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver contacto
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
