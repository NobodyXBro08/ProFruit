import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaRegUser,
  FaTimes,
  FaSearch,
  FaHome,
  FaShoppingBag,
  FaEllipsisH,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useCatalog } from '../../context/CatalogContext.jsx';
import { useLoginModal } from '../../context/LoginModalContext.jsx';
import { useCartUi } from '../../context/CartUiContext.jsx';
import ProFruitLogo from '../../assets/images/ProFruit.png';
import './Navbar.css';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { searchQuery, setSearchQuery } = useCatalog();
  const { clearCart } = useCart();
  const { user, logout } = useAuth();
  const { openLogin } = useLoginModal();
  const { closeCart } = useCartUi();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = () => {
    clearCart();
    closeCart();
    logout();
    closeMenu();
  };

  const navLinks = (
    <>
      <li>
        <Link to="/#inicio" onClick={closeMenu}>
          Inicio
        </Link>
      </li>
      <li>
        <Link to="/#about" onClick={closeMenu}>
          Historia
        </Link>
      </li>
      <li>
        <Link to="/#products" onClick={closeMenu}>
          Tienda
        </Link>
      </li>
      <li>
        <Link to="/#opinions" onClick={closeMenu}>
          Reseñas
        </Link>
      </li>
      <li>
        <Link to="/#jobs" onClick={closeMenu}>
          Aliados
        </Link>
      </li>
      <li>
        <Link to="/#contact" onClick={closeMenu}>
          Contacto
        </Link>
      </li>
    </>
  );

  return (
    <>
      <div className="navbar-ribbon">
        <p className="navbar-ribbon-text">
          Origen Colombia · Campo a tu mesa · Empaque cuidadoso
        </p>
      </div>

      <header
        className={`navbar-masthead ${scrolled ? 'navbar-masthead--scrolled' : ''} ${isMenuOpen ? 'navbar-masthead--menu' : ''}`}
      >
        <div className="navbar-masthead-inner">
          <Link className="navbar-brand" to="/" onClick={closeMenu}>
            <img
              className="navbar-brand-logo"
              src={ProFruitLogo}
              alt="ProFruit"
              width={120}
              height={40}
            />
            <span className="navbar-brand-text">
              <span className="navbar-brand-mark">ProFruit</span>
              <span className="navbar-brand-tagline">mercado en línea</span>
            </span>
          </Link>

          <label className="navbar-search navbar-search--desktop" htmlFor="catalog-search">
            <span className="visually-hidden">Buscar en la tienda</span>
            <FaSearch className="navbar-search-icon" aria-hidden size={15} />
            <input
              id="catalog-search"
              type="search"
              className="navbar-search-input"
              placeholder="Buscar productos…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
            {searchQuery ? (
              <button
                type="button"
                className="navbar-search-clear"
                aria-label="Limpiar búsqueda"
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            ) : null}
          </label>

          <nav className="navbar-links-desktop" aria-label="Secciones">
            <ul className="navbar-pills">{navLinks}</ul>
          </nav>

          <div className="navbar-actions-row">
            <button
              type="button"
              className="navbar-icon-btn navbar-search-toggle"
              aria-expanded={searchOpen}
              aria-controls="navbar-search-mobile"
              aria-label={searchOpen ? 'Cerrar búsqueda' : 'Buscar'}
              onClick={() => {
                setSearchOpen((v) => !v);
                closeMenu();
              }}
            >
              <FaSearch size={18} />
            </button>

            {user ? (
              <div className="navbar-account navbar-account--desktop">
                <span className="navbar-account-name" title={user.fullName || user.username}>
                  {user.fullName || user.username}
                </span>
                <button className="navbar-btn-ghost" type="button" onClick={handleLogout}>
                  Salir
                </button>
              </div>
            ) : (
              <button className="navbar-btn-account navbar-btn-account--desktop" type="button" onClick={openLogin}>
                <FaRegUser size={17} aria-hidden />
                <span>Cuenta</span>
              </button>
            )}
          </div>
        </div>

        <div
          id="navbar-flyout"
          className={`navbar-flyout ${isMenuOpen ? 'navbar-flyout--open' : ''}`}
          hidden={!isMenuOpen}
        >
          <div className="navbar-flyout-head">
            <span className="navbar-flyout-title">Menú</span>
            <button
              type="button"
              className="navbar-icon-btn"
              aria-label="Cerrar menú"
              onClick={() => setIsMenuOpen(false)}
            >
              <FaTimes size={20} />
            </button>
          </div>
          <nav aria-label="Móvil">
            <ul className="navbar-flyout-list">{navLinks}</ul>
          </nav>
          <div className="navbar-flyout-footer">
            {user ? (
              <>
                <p className="navbar-flyout-user">{user.fullName || user.username}</p>
                <button type="button" className="navbar-btn-ghost navbar-btn-ghost--block" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button type="button" className="navbar-btn-account navbar-btn-account--block" onClick={openLogin}>
                <FaRegUser aria-hidden />
                Iniciar sesión o registrarse
              </button>
            )}
          </div>
        </div>
      </header>

      {isMenuOpen ? (
        <button type="button" className="navbar-overlay" aria-label="Cerrar menú" onClick={closeMenu} />
      ) : null}

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
          {searchQuery ? (
            <button
              type="button"
              className="navbar-search-clear"
              aria-label="Limpiar"
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          ) : null}
        </label>
      </div>

      <nav className="navbar-dock" aria-label="Accesos rápidos móvil">
        <Link className="navbar-dock-item" to="/#inicio" onClick={closeMenu}>
          <FaHome size={22} aria-hidden />
          <span>Inicio</span>
        </Link>
        <Link className="navbar-dock-item" to="/#products" onClick={closeMenu}>
          <FaShoppingBag size={20} aria-hidden />
          <span>Tienda</span>
        </Link>
        <button
          type="button"
          className={`navbar-dock-item ${isMenuOpen ? 'navbar-dock-item--active' : ''}`}
          aria-expanded={isMenuOpen}
          aria-controls="navbar-flyout"
          onClick={() => {
            setSearchOpen(false);
            setIsMenuOpen((v) => !v);
          }}
        >
          <FaEllipsisH size={22} aria-hidden />
          <span>Más</span>
        </button>
      </nav>
    </>
  );
}
