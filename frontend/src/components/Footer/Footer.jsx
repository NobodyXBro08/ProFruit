import React from 'react';
import './Footer.css';
import { FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa';
import { FiPhone, FiMail, FiMapPin, FiArrowUpRight } from 'react-icons/fi';
import Container from '../ui/Container.jsx';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" id="contact">
      <span className="footer-watermark" aria-hidden>
        PF
      </span>
      <Container className="footer-inner">
        <div className="footer-hero">
          <h2 className="footer-hero-title">
            Hablemos
            <span className="footer-hero-dot">.</span>
          </h2>
          <p className="footer-hero-text">
            Un mensaje basta. Te leemos rápido: pedidos raros, mayoreo, o solo saludar al equipo.
          </p>
          <a className="footer-hero-mail" href="mailto:info@profruit.co">
            info@profruit.co
            <FiArrowUpRight aria-hidden />
          </a>
        </div>

        <div className="footer-grid">
          <div className="footer-card">
            <h3 className="footer-card-title">ProFruit</h3>
            <p className="footer-card-text">
              Fruta y natural desde Colombia. Sin cuentos de laboratorio: campo, gente y sabor.
            </p>
            <div className="footer-social">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="footer-social-btn"
              >
                <FaFacebookF />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="footer-social-btn"
              >
                <FaInstagram />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="footer-social-btn"
              >
                <FaTwitter />
              </a>
            </div>
          </div>

          <div className="footer-card footer-card--accent">
            <h4 className="footer-card-label">Línea directa</h4>
            <ul className="footer-list">
              <li>
                <FiPhone className="footer-icon" aria-hidden />
                <span>+57 300 123 4567</span>
              </li>
              <li>
                <FiMail className="footer-icon" aria-hidden />
                <span>info@profruit.co</span>
              </li>
              <li>
                <FiMapPin className="footer-icon" aria-hidden />
                <span>
                  Calle 123 #45-67
                  <br />
                  Bogotá, Colombia
                </span>
              </li>
            </ul>
          </div>

          <nav className="footer-card" aria-label="Pie">
            <h4 className="footer-card-label">Saltar a</h4>
            <ul className="footer-links">
              <li>
                <a href="#inicio">Inicio</a>
              </li>
              <li>
                <a href="#about">Historia</a>
              </li>
              <li>
                <a href="#products">Tienda</a>
              </li>
              <li>
                <a href="#opinions">Reseñas</a>
              </li>
              <li>
                <a href="#jobs">Aliados</a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">© {year} ProFruit — Hecho con hambre honesta.</p>
          <div className="footer-legal">
            <a href="#contact">Términos</a>
            <span aria-hidden>·</span>
            <a href="#contact">Privacidad</a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
