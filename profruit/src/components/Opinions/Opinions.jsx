// src/components/Opinions/Opinions.jsx
import React from 'react';
import './Opinions.css';
import { FaStar } from 'react-icons/fa';
import { FaQuoteLeft } from 'react-icons/fa6';

const testimonials = [
  {
    id: 1,
    name: 'María González',
    city: 'Bogotá',
    initials: 'MG',
    rating: 5,
    text: 'Los frutos deshidratados de ProFruit son increíbles. La calidad es excepcional y el sabor es auténtico. ¡Mi familia los ama!',
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
    text: 'La mejor opción para snacks saludables. Mis hijos prefieren estos frutos a cualquier dulce procesado. ¡Gracias ProFruit!',
  },
];

function renderStars(count) {
  return Array.from({ length: count }).map((_, i) => <FaStar key={i} />);
}

export default function Opinions() {
  return (
    <section className="opinions" id="opinions">
      <div className="opinions-header">
        <h2 className="opinions-title">Lo que dicen nuestros clientes</h2>
        <p className="opinions-subtitle">
          Miles de familias confían en ProFruit para sus snacks saludables y naturales.
        </p>
      </div>

      <div className="opinions-grid">
        {testimonials.map((item) => (
          <article key={item.id} className="opinion-card">
            <FaQuoteLeft className="opinion-quote-icon" />

            <div className="opinion-stars">{renderStars(item.rating)}</div>

            <p className="opinion-text">"{item.text}"</p>

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
    </section>
  );
}
