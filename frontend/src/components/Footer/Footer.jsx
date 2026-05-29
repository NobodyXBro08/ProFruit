import React from 'react';
import './Footer.css';
import { FaFacebookF, FaInstagram, FaYoutube } from 'react-icons/fa';
import { FiPhone, FiMail, FiMapPin, FiClock } from 'react-icons/fi';
import Container from '../ui/Container.jsx';
import { SITE } from '../../config/site';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" id="contact">
      <div className="footer-glow" aria-hidden />
      <Container className="footer-inner">
        <div className="footer-top">
          <p className="footer-eyebrow">{SITE.name}</p>
          <div className="footer-social" aria-label="Redes sociales">
            <a
              href={SITE.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="footer-social-link"
            >
              <FaFacebookF aria-hidden />
            </a>
            <a
              href={SITE.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="footer-social-link"
            >
              <FaInstagram aria-hidden />
            </a>
            <a
              href={SITE.social.youtube}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="footer-social-link"
            >
              <FaYoutube aria-hidden />
            </a>
          </div>
        </div>

        <ul className="footer-contact">
          <li>
            <FiPhone className="footer-contact-icon" aria-hidden />
            <a href={`tel:${SITE.phoneTel}`}>{SITE.phone}</a>
          </li>
          <li>
            <FiMail className="footer-contact-icon" aria-hidden />
            <span className="footer-emails">
              {SITE.emails.map((email) => (
                <a key={email} href={`mailto:${email}`}>
                  {email}
                </a>
              ))}
            </span>
          </li>
          <li>
            <FiMapPin className="footer-contact-icon" aria-hidden />
            <span>
              {SITE.address.line1}
              <br />
              {SITE.address.city}, {SITE.address.country}
            </span>
          </li>
          <li>
            <FiClock className="footer-contact-icon" aria-hidden />
            <span>
              {SITE.hours.weekdays}
              <br />
              {SITE.hours.saturday}
            </span>
          </li>
        </ul>

        <p className="footer-payments">{SITE.payments}</p>

        <p className="footer-help">
          ¿Necesitas ayuda?{' '}
          <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">
            Escríbenos por WhatsApp
          </a>
        </p>

        <p className="footer-copy">
          © {year} {SITE.name.toUpperCase()} ·{' '}
          <a href={SITE.website} target="_blank" rel="noopener noreferrer">
            profruitcol.com
          </a>
        </p>
      </Container>
    </footer>
  );
}
