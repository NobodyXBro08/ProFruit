import React, { useEffect, useState } from 'react';
import './About.css';

import Aguacate from '../../assets/images/Aguacate.jpg';
import Sandia from '../../assets/images/Sandia.jpg';
import Pan from '../../assets/images/Pan.jpg';
import Limon from '../../assets/images/Limon.jpg';
import Naranja from '../../assets/images/Naranja.jpg';

const bgImages = [Aguacate, Sandia, Pan, Limon, Naranja];

export default function About() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % bgImages.length);
    }, 12000);

    return () => clearInterval(id);
  }, []);

  return (
    <section className="about" id="about">
      <div className="about-bg">
        {bgImages.map((src, index) => (
          <div
            key={index}
            className={`about-bg-layer ${index === currentIndex ? 'active' : ''}`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
        <div className="about-overlay" />
      </div>

      <div className="about-content container">
        <h1 className="about-title">Bienvenido A ProFruit</h1>
        <h2 className="about-subtitle">
          Lo mejor de la naturaleza deshidratada
        </h2>
        <h3 className="about-description">
          Descubre nuestros frutos deshidratados de las más alta calidad, cultivados
          por campesinos locales con amor y dedicación
        </h3>

        <div className="about-buttons">
          <a href="/products" className="button-primary">Ver Productos</a>
          <a href="/contact" className="button-secondary">Contactar</a>
        </div>
      </div>
    </section>
  );
}
