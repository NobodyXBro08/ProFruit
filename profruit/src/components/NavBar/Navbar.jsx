import React, { useState } from 'react';
import { FaRegUser, FaBars, FaTimes } from 'react-icons/fa';
import { IoCartOutline } from 'react-icons/io5';
import './Navbar.css';

/** Botones Carrito y Login (misma UI en móvil dentro del menú y en escritorio). */
function NavbarActions({ className, onActionClick }) {
  return (
    <div className={className}>
      <button className="button-cart" type="button" aria-label="Carrito" onClick={onActionClick}>
        <IoCartOutline size={22} aria-hidden />
        <span className="badge-cart">1</span>
      </button>
      <button className="button-login" type="button" onClick={onActionClick}>
        <FaRegUser size={18} aria-hidden />
        <span>Login</span>
      </button>
    </div>
  );
}

/**
 * Barra de navegación fija. Enlace a secciones de la misma página mediante anclas (#about, #products, etc.).
 * En móvil muestra menú hamburguesa con los mismos enlaces.
 */
export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className={`navbar-container ${isMenuOpen ? 'navbar-container--open' : ''}`}>
      <a className="navbar-brand" href="#inicio" onClick={closeMenu}>ProFruit</a>

      <button
        type="button"
        className="navbar-hamburger"
        aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      <nav className={`navbar-nav ${isMenuOpen ? 'navbar-nav--open' : ''}`}>
        <ul className="navbar-menu">
          <li><a href="#inicio" onClick={closeMenu}>Inicio</a></li>
          <li><a href="#about" onClick={closeMenu}>Nosotros</a></li>
          <li><a href="#products" onClick={closeMenu}>Productos</a></li>
          <li><a href="#opinions" onClick={closeMenu}>Opiniones</a></li>
          <li><a href="#jobs" onClick={closeMenu}>Trabajamos</a></li>
          <li><a href="#contact" onClick={closeMenu}>Contacto</a></li>
        </ul>

        <NavbarActions className="navbar-actions navbar-actions--mobile" onActionClick={closeMenu} />
      </nav>

      <NavbarActions className="navbar-actions navbar-actions--desktop" />
    </header>
  );
}
