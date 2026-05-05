import React from 'react';
import './JobWithUs.css';
import { FiShoppingBag, FiHome, FiTruck, FiUsers, FiZap } from 'react-icons/fi';
import Button from '../ui/Button.jsx';

const partners = [
  {
    id: 1,
    name: 'Supermercados Éxito',
    label: 'Retail',
    description: 'Distribuimos en más de 50 tiendas a nivel nacional.',
    icon: <FiShoppingBag />,
  },
  {
    id: 2,
    name: 'Tiendas D1',
    label: 'Barrio',
    description: 'Presencia en tiendas de barrio en todo el país.',
    icon: <FiHome />,
  },
  {
    id: 3,
    name: 'Rappi & Domicilios.com',
    label: 'Delivery',
    description: 'Entrega a domicilio en las principales ciudades.',
    icon: <FiTruck />,
  },
  {
    id: 4,
    name: 'Cooperativa de campesinos',
    label: 'Origen',
    description: 'Más de 200 familias productoras.',
    icon: <FiUsers />,
  },
];

const SALES_MAIL = 'ventas@profruit.co';

export default function JobsWithUs() {
  return (
    <section className="jobs" id="jobs">
      <div className="jobs-wrap">
        <header className="jobs-head">
          <span className="jobs-kicker">
            <FiZap aria-hidden />
            Red viva
          </span>
          <h2 className="jobs-title">
            Del campo
            <span className="jobs-title-block">a tu canal</span>
          </h2>
          <p className="jobs-lead">
            Cuatro formas en las que ProFruit ya se mueve. Imagina tu marca aquí: sin discursos largos, con
            contratos que se entienden.
          </p>
        </header>

        <div className="jobs-bento">
          <div className="jobs-bento-hero">
            <p className="jobs-bento-hero-label">Aliados</p>
            <p className="jobs-bento-hero-stat">50+</p>
            <p className="jobs-bento-hero-text">puntos de venta y rutas activas. ¿Siguiente parada? La tuya.</p>
          </div>

          {partners.map((item, index) => (
            <article
              key={item.id}
              className={`jobs-bento-card jobs-bento-card--${index}`}
            >
              <div className="jobs-bento-icon">{item.icon}</div>
              <span className="jobs-bento-chip">{item.label}</span>
              <h3 className="jobs-bento-name">{item.name}</h3>
              <p className="jobs-bento-desc">{item.description}</p>
            </article>
          ))}
        </div>

        <div className="jobs-cta-panel">
          <div className="jobs-cta-copy">
            <h3 className="jobs-cta-title">¿Vendes, distribuyes o produces?</h3>
            <p className="jobs-cta-text">
              Escríbenos. Te respondemos con propuesta clara: catálogo, márgenes y logística. Sin humo.
            </p>
          </div>
          <div className="jobs-cta-btns">
            <Button
              variant="primary"
              size="md"
              type="button"
              className="jobs-cta-btn"
              onClick={() => {
                window.location.href = `mailto:${SALES_MAIL}?subject=Aliado%20ProFruit`;
              }}
            >
              Hablar con ventas
            </Button>
            <Button
              variant="ghost"
              size="md"
              type="button"
              className="jobs-cta-btn jobs-cta-btn--ghost"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver datos de contacto
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
