import React from 'react';
import { FaRegUser } from 'react-icons/fa';
import { IoCartOutline } from 'react-icons/io5';
import './Navbar.css';

export default function Navbar() {
  return (
    <header className="navbar-container">
      <a className="navbar-brand" href="/">ProFruit</a>

      <nav>
        <ul className="navbar-menu">
          <li><a href="/">Inicio</a></li>
          <li><a href="/products">Productos</a></li>
          <li><a href="/opinions">Opiniones</a></li>
          <li><a href="/jobs">Trabajamos</a></li>
          <li><a href="/contact">Contacto</a></li>
        </ul>
      </nav>

      <div className="navbar-actions">
        {/* Carrito */}
        <button className="button-cart" type="button" aria-label="Carrito">
          <IoCartOutline size={22} aria-hidden />
          <span className="badge-cart">1</span>
        </button>

        {/* Login */}
        <button className="button-login" type="button">
          <FaRegUser size={18} aria-hidden />
          <span>Login</span>
        </button>
      </div>
    </header>
  );
}
