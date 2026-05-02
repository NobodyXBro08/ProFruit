import React, { useState } from 'react';
import { FaRegUser, FaBars, FaTimes } from 'react-icons/fa';
import { IoCartOutline } from 'react-icons/io5';
import { useCart } from '../../context/CartContext.jsx';
import CartDrawer from '../CartDrawer/CartDrawer.jsx';
import './Navbar.css';

/** Botones Carrito y Login (misma UI en móvil dentro del menú y en escritorio). */
function NavbarActions({ className, cartCount, onCartClick, onLoginClick }) {
  const badge =
    cartCount > 0 ? (
      <span className="badge-cart">{cartCount > 99 ? '99+' : cartCount}</span>
    ) : null;
  return (
    <div className={className}>
      <button className="button-cart" type="button" aria-label="Carrito" onClick={onCartClick}>
        <IoCartOutline size={22} aria-hidden />
        {badge}
      </button>
      <button className="button-login" type="button" onClick={onLoginClick}>
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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { totalQuantity } = useCart();

  const closeMenu = () => setIsMenuOpen(false);

  const openCart = () => {
    setIsMenuOpen(false);
    setIsCartOpen(true);
  };

  const goLogin = () => {
    closeMenu();
    window.location.hash = '#contact';
  };

  return (
    <>
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

        <NavbarActions
          className="navbar-actions navbar-actions--mobile"
          cartCount={totalQuantity}
          onCartClick={openCart}
          onLoginClick={goLogin}
        />
      </nav>

      <NavbarActions
        className="navbar-actions navbar-actions--desktop"
        cartCount={totalQuantity}
        onCartClick={openCart}
        onLoginClick={goLogin}
      />
    </header>
    <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
