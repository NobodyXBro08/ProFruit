import React from 'react';
import './Opinions.css';
import { FaQuoteLeft } from 'react-icons/fa6';
import { StarsFilled } from '../../utils/stars';

const testimonials = [
  {
    id: 1,
    name: 'María González',
    city: 'Bogotá',
    initials: 'MG',
    rating: 5,
    text: 'Los productos de ProFruit son increíbles. La calidad es excepcional y el sabor es auténtico. ¡Mi familia los ama!',
  },
  {
    id: 2,
    name: 'Carlos Rodríguez',
    city: 'Medellín',
    initials: 'CR',
    rating: 5,
    text: 'Excelente servicio y productos de primera calidad. Las entregas son rápidas y el empaque es perfecto. Muy recomendado.',
  },
  {
    id: 3,
    name: 'Ana Martínez',
    city: 'Cali',
    initials: 'AM',
    rating: 4,
    text: 'Me encanta que trabajen directamente con campesinos locales. Los productos son frescos y el precio es muy justo.',
  },
  {
    id: 4,
    name: 'Luis Herrera',
    city: 'Cartagena',
    initials: 'LH',
    rating: 5,
    text: 'La mejor opción para snacks saludables. Mis hijos prefieren estos productos a cualquier dulce procesado. ¡Gracias ProFruit!',
  },
];

export default function Opinions() {
  return (
    <section className="opinions" id="opinions">
      <div className="opinions-inner">
        <header className="opinions-head">
          <span className="opinions-kicker">Reseñas</span>
          <h2 className="opinions-title">
            Lo que dicen <span className="opinions-title-accent">en casa</span>
          </h2>
          <p className="opinions-lead">
            Opiniones de clientes reales. Sin ruido: solo sabor y servicio.
          </p>
        </header>

        <div className="opinions-stats">
          <div className="opinions-stat">
            <span className="opinions-stat-value">4.9</span>
            <span className="opinions-stat-label">Nota media</span>
          </div>
          <div className="opinions-stat opinions-stat--accent">
            <span className="opinions-stat-value">+12k</span>
            <span className="opinions-stat-label">Pedidos (meta)</span>
          </div>
          <div className="opinions-stat">
            <span className="opinions-stat-value">4</span>
            <span className="opinions-stat-label">Ciudades</span>
          </div>
        </div>

        <div className="opinions-rail" role="list">
          {testimonials.map((item) => (
            <article key={item.id} className="opinion-card" role="listitem">
              <FaQuoteLeft className="opinion-quote-icon" aria-hidden />
              <div className="opinion-stars">
                <StarsFilled count={item.rating} />
              </div>
              <p className="opinion-text">&ldquo;{item.text}&rdquo;</p>
              <div className="opinion-user">
                <div className="opinion-avatar">{item.initials}</div>
                <div>
                  <p className="opinion-name">{item.name}</p>
                  <p className="opinion-city">{item.city}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
