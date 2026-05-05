import React from 'react';
import './Footer.css';
import { FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa';
import { FiPhone, FiMail, FiMapPin, FiShield } from 'react-icons/fi';
import Container from '../ui/Container.jsx';

/**
 * Pie de página: confianza, contacto y enlaces por ancla.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" id="contact">
      <Container className="footer-inner">
        <div className="footer-top">
          <div className="footer-col footer-col-main">
            <h3 className="footer-title">ProFruit</h3>
            <p className="footer-text">
              Empresa colombiana de fruta y productos naturales. Trabajamos con campesinos y aliados de
              confianza para llevar sabor real a tu hogar.
            </p>
            <div className="footer-trust">
              <FiShield className="footer-trust-icon" aria-hidden />
              <span>Envíos cuidados · origen transparente</span>
            </div>
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

          <div className="footer-col">
            <h4 className="footer-heading">Contáctanos</h4>
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

          <div className="footer-col">
            <h4 className="footer-heading">Enlaces</h4>
            <ul className="footer-links">
              <li>
                <a href="#inicio">Inicio</a>
              </li>
              <li>
                <a href="#about">Nosotros</a>
              </li>
              <li>
                <a href="#products">Productos</a>
              </li>
              <li>
                <a href="#opinions">Opiniones</a>
              </li>
              <li>
                <a href="#jobs">Aliados</a>
              </li>
              <li>
                <a href="#contact">Contacto</a>
              </li>
            </ul>
          </div>
        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom">
          <p className="footer-copy">
            © {year} ProFruit. Todos los derechos reservados.
          </p>
          <div className="footer-legal">
            <a href="#contact">Términos y condiciones</a>
            <span aria-hidden>·</span>
            <a href="#contact">Privacidad</a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
