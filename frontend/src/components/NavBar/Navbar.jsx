import React, { useState } from 'react';
import { FaRegUser, FaBars, FaTimes } from 'react-icons/fa';
import { IoCartOutline } from 'react-icons/io5';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import CartDrawer from '../CartDrawer/CartDrawer.jsx';
import LoginModal from '../LoginModal/LoginModal.jsx';
import './Navbar.css';

function NavbarActions({ className, cartCount, user, onCartClick, onLoginOpen, onLogout }) {
  const cartEnabled = Boolean(user);
  const badge =
    cartEnabled && cartCount > 0 ? (
      <span className="badge-cart">{cartCount > 99 ? '99+' : cartCount}</span>
    ) : null;
  return (
    <div className={className}>
      <button
        className={`button-cart ${!cartEnabled ? 'button-cart--disabled' : ''}`}
        type="button"
        aria-label={cartEnabled ? 'Carrito' : 'Carrito: inicia sesión para usarlo'}
        aria-disabled={!cartEnabled}
        disabled={!cartEnabled}
        title={cartEnabled ? undefined : 'Inicia sesión para usar el carrito'}
        onClick={onCartClick}
      >
        <IoCartOutline size={22} aria-hidden />
        {badge}
      </button>
      {user ? (
        <div className="navbar-user-wrap">
          <span className="navbar-user-name" title={user.fullName || user.username}>
            {user.fullName || user.username}
          </span>
          <button className="button-logout" type="button" onClick={onLogout}>
            Salir
          </button>
        </div>
      ) : (
        <button className="button-login" type="button" onClick={onLoginOpen}>
          <FaRegUser size={18} aria-hidden />
          <span>Login</span>
        </button>
      )}
    </div>
  );
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { totalQuantity, clearCart } = useCart();
  const { user, logout } = useAuth();

  const closeMenu = () => setIsMenuOpen(false);

  const openCart = () => {
    if (!user) return;
    setIsLoginOpen(false);
    setIsMenuOpen(false);
    setIsCartOpen(true);
  };

  const openLogin = () => {
    setIsCartOpen(false);
    closeMenu();
    setIsLoginOpen(true);
  };

  const handleLogout = () => {
    clearCart();
    setIsCartOpen(false);
    logout();
    closeMenu();
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
          user={user}
          onCartClick={openCart}
          onLoginOpen={openLogin}
          onLogout={handleLogout}
        />
      </nav>

      <NavbarActions
        className="navbar-actions navbar-actions--desktop"
        cartCount={totalQuantity}
        user={user}
        onCartClick={openCart}
        onLoginOpen={openLogin}
        onLogout={handleLogout}
      />
    </header>
    <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}
