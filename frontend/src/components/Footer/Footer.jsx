import React from 'react';
import './Footer.css';
import { FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa';
import { FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import Container from '../ui/Container.jsx';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" id="contact">
      <div className="footer-glow" aria-hidden />
      <Container className="footer-inner">
        <div className="footer-top">
          <p className="footer-eyebrow">ProFruit</p>
          <div className="footer-social" aria-label="Redes sociales">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="footer-social-link"
            >
              <FaFacebookF aria-hidden />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="footer-social-link"
            >
              <FaInstagram aria-hidden />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="footer-social-link"
            >
              <FaTwitter aria-hidden />
            </a>
          </div>
        </div>

        <ul className="footer-contact">
          <li>
            <FiPhone className="footer-contact-icon" aria-hidden />
            <a href="tel:+573001234567">+57 300 123 4567</a>
          </li>
          <li>
            <FiMail className="footer-contact-icon" aria-hidden />
            <a href="mailto:info@profruit.co">info@profruit.co</a>
          </li>
          <li>
            <FiMapPin className="footer-contact-icon" aria-hidden />
            <span>
              Calle 123 #45-67
              <br />
              Bogotá, Colombia
            </span>
          </li>
        </ul>

        <p className="footer-copy">© {year} ProFruit. Todos los derechos reservados.</p>
      </Container>
    </footer>
  );
}
