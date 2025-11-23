import React from 'react';
import './Footer.css';
import { FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa';
import { FiPhone, FiMail, FiMapPin } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">

        {/* columnas superiores */}
        <div className="footer-top">

          {/* Columna principal: ocupa 2 columnas visuales */}
          <div className="footer-col footer-col-main">
            <h3 className="footer-title">ProFruit</h3>
            <p className="footer-text">
              Somos una empresa colombiana dedicada a ofrecer los mejores frutos deshidratados,
              trabajando directamente con campesinos locales para garantizar la más alta calidad
              y frescura en cada producto.
            </p>

            <div className="footer-social">
              <a href="#" aria-label="Facebook" className="footer-social-btn">
                <FaFacebookF />
              </a>
              <a href="#" aria-label="Instagram" className="footer-social-btn">
                <FaInstagram />
              </a>
              <a href="#" aria-label="Twitter" className="footer-social-btn">
                <FaTwitter />
              </a>
            </div>
          </div>

          {/* Columna contacto */}
          <div className="footer-col">
            <h4 className="footer-heading">Contáctanos</h4>
            <ul className="footer-list">
              <li>
                <FiPhone className="footer-icon" />
                <span>+57 300 123 4567</span>
              </li>
              <li>
                <FiMail className="footer-icon" />
                <span>info@profruit.co</span>
              </li>
              <li>
                <FiMapPin className="footer-icon" />
                <span>Calle 123 #45-67<br />Bogotá, Colombia</span>
              </li>
            </ul>
          </div>

          {/* Columna enlaces */}
          <div className="footer-col">
            <h4 className="footer-heading">Enlaces</h4>
            <ul className="footer-links">
              <li><a href="#inicio">Inicio</a></li>
              <li><a href="/products">Productos</a></li>
              <li><a href="/opinions">Opiniones</a></li>
              <li><a href="/allies">Trabjamos Con</a></li>
              <li><a href="/contact">Contacto</a></li>
            </ul>
          </div>

        </div>

        {/* Divider */}
        <hr className="footer-divider" />

        {/* Bottom */}
        <div className="footer-bottom">
          <p className="footer-copy">
            © 2024 ProFruit. Todos los derechos reservados.
          </p>

          <div className="footer-legal">
            <a href="/terms">Términos y Condiciones</a>
            <span>•</span>
            <a href="/privacy">Política de Privacidad</a>
          </div>
        </div>

      </div>
    </footer>
  );
}