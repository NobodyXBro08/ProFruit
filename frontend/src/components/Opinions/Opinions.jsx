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

const cities = ['Bogotá', 'Medellín', 'Cali', 'Cartagena', 'Barranquilla', 'Bucaramanga', 'Pereira', 'Manizales'];

export default function Opinions() {
  return (
    <section className="opinions" id="opinions">
      <div className="opinions-marquee-wrap" aria-hidden>
        <div className="opinions-marquee">
          {[...cities, ...cities].map((city, i) => (
            <span key={`${city}-${i}`} className="opinions-marquee-item">
              {city}
            </span>
          ))}
        </div>
      </div>

      <div className="opinions-inner">
        <header className="opinions-head">
          <span className="opinions-kicker">Voces reales · 0 Photoshop</span>
          <h2 className="opinions-title">
            Fans
            <br />
            <span className="opinions-title-accent">de verdad.</span>
          </h2>
          <p className="opinions-lead">
            Historias cortas, sin plantillas rancias. Así suena la gente cuando el sabor llega y se queda.
          </p>
        </header>

        <div className="opinions-stats">
          <div className="opinions-stat">
            <span className="opinions-stat-value">4.9</span>
            <span className="opinions-stat-label">satisfacción media</span>
          </div>
          <div className="opinions-stat opinions-stat--accent">
            <span className="opinions-stat-value">+12k</span>
            <span className="opinions-stat-label">bolsas felices (meta)</span>
          </div>
          <div className="opinions-stat">
            <span className="opinions-stat-value">∞</span>
            <span className="opinions-stat-label">ganas de repetir</span>
          </div>
        </div>

        <div className="opinions-rail" role="list">
          {testimonials.map((item, index) => (
            <article
              key={item.id}
              className={`opinion-card opinion-card--${index % 3}`}
              role="listitem"
              style={{ '--opinion-rotate': `${(index % 2 === 0 ? -1 : 1) * (1.2 + index * 0.35)}deg` }}
            >
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
