import React, { useEffect, useState } from 'react';
import './About.css';

import Aguacate from '../../assets/images/Aguacate.jpg';
import Sandia from '../../assets/images/Sandia.jpg';
import Limon from '../../assets/images/Limon.jpg';
import Naranja from '../../assets/images/Naranja.jpg';

const bgImages = [Aguacate, Sandia, Limon, Naranja];

/**
 * Hero: fondo rotativo con fruta fresca y CTAs hacia catálogo y contacto.
 */
export default function About() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bgImages.length);
    }, 10000);

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
        <div className="about-overlay-gradient" />
      </div>

      <div className="about-content">
        <p className="about-eyebrow">Origen colombiano · calidad real</p>
        <h1 className="about-title">Fruta y snacks naturales, pensados para tu mesa</h1>
        <p className="about-subtitle">Lo mejor del campo, con el cuidado que tu familia merece.</p>
        <p className="about-description">
          Seleccionamos fruta y productos naturales con aliados locales. Pide con confianza: transparencia,
          sabor auténtico y entrega que puedes rastrear desde el carrito.
        </p>

        <div className="about-buttons">
          <a href="#products" className="about-btn about-btn--primary">
            Comprar ahora
          </a>
          <a href="#contact" className="about-btn about-btn--secondary">
            Hablar con nosotros
          </a>
        </div>
      </div>
    </section>
  );
}
