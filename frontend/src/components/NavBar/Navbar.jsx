import React, { useEffect, useState } from 'react';
import { FaRegUser, FaBars, FaTimes, FaSearch } from 'react-icons/fa';
import { IoCartOutline } from 'react-icons/io5';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useCatalog } from '../../context/CatalogContext.jsx';
import CartDrawer from '../CartDrawer/CartDrawer.jsx';
import LoginModal from '../LoginModal/LoginModal.jsx';
import './Navbar.css';

function NavbarActions({ className, cartCount, user, onCartClick, onLoginOpen, onLogout }) {
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
          <span>Entrar</span>
        </button>
      )}
    </div>
  );
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { searchQuery, setSearchQuery } = useCatalog();
  const { totalQuantity, clearCart } = useCart();
  const { user, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  const openCart = () => {
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

  const navLinks = (
    <>
      <li>
        <a href="#inicio" onClick={closeMenu}>
          Inicio
        </a>
      </li>
      <li>
        <a href="#about" onClick={closeMenu}>
          Nosotros
        </a>
      </li>
      <li>
        <a href="#products" onClick={closeMenu}>
          Productos
        </a>
      </li>
      <li>
        <a href="#opinions" onClick={closeMenu}>
          Opiniones
        </a>
      </li>
      <li>
        <a href="#jobs" onClick={closeMenu}>
          Aliados
        </a>
      </li>
      <li>
        <a href="#contact" onClick={closeMenu}>
          Contacto
        </a>
      </li>
    </>
  );

  return (
    <>
      <header className={`navbar-container ${isMenuOpen ? 'navbar-container--open' : ''} ${scrolled ? 'navbar-container--scrolled' : ''}`}>
        <div className="navbar-top">
          <a className="navbar-brand" href="#inicio" onClick={closeMenu}>
            <span className="navbar-brand-mark">ProFruit</span>
            <span className="navbar-brand-tagline">Fruta &amp; natural</span>
          </a>

          <label className="navbar-search navbar-search--desktop" htmlFor="catalog-search">
            <span className="visually-hidden">Buscar productos</span>
            <FaSearch className="navbar-search-icon" aria-hidden size={16} />
            <input
              id="catalog-search"
              type="search"
              className="navbar-search-input"
              placeholder="Buscar frutas, snacks…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
          </label>

          <nav className="navbar-links navbar-links--desktop" aria-label="Principal">
            <ul className="navbar-menu">{navLinks}</ul>
          </nav>

          <div className="navbar-tools">
            <button
              type="button"
              className="navbar-icon-btn navbar-search-toggle"
              aria-expanded={searchOpen}
              aria-controls="navbar-search-mobile"
              aria-label={searchOpen ? 'Cerrar búsqueda' : 'Buscar'}
              onClick={() => setSearchOpen((v) => !v)}
            >
              <FaSearch size={20} />
            </button>

            <NavbarActions
              className="navbar-actions navbar-actions--desktop"
              cartCount={totalQuantity}
              user={user}
              onCartClick={openCart}
              onLoginOpen={openLogin}
              onLogout={handleLogout}
            />

            <button
              type="button"
              className="navbar-icon-btn navbar-hamburger"
              aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
            </button>
          </div>
        </div>

        <div
          id="navbar-mobile-panel"
          className={`navbar-mobile-panel ${isMenuOpen ? 'navbar-mobile-panel--open' : ''}`}
        >
          <nav aria-label="Móvil">
            <ul className="navbar-menu navbar-menu--stack">{navLinks}</ul>
          </nav>
          <NavbarActions
            className="navbar-actions navbar-actions--mobile"
            cartCount={totalQuantity}
            user={user}
            onCartClick={openCart}
            onLoginOpen={openLogin}
            onLogout={handleLogout}
          />
        </div>
      </header>

      <div
        id="navbar-search-mobile"
        className={`navbar-search-mobile ${searchOpen ? 'navbar-search-mobile--open' : ''}`}
        hidden={!searchOpen}
      >
        <label className="navbar-search navbar-search--mobile" htmlFor="catalog-search-mobile">
          <FaSearch className="navbar-search-icon" aria-hidden size={16} />
          <input
            id="catalog-search-mobile"
            type="search"
            className="navbar-search-input"
            placeholder="Buscar productos…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
        </label>
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onRequestLogin={openLogin} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}
