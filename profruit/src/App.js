import React, { useEffect } from 'react';
import Navbar from './components/NavBar/Navbar.jsx';
import About from './components/About/About.jsx';
import Products from './components/Products/Products.jsx';
import Opinions from './components/Opinions/Opinions.jsx';
import JobWithUs from './components/JobWithUs/JobWithUs.jsx';
import Footer from './components/Footer/Footer.jsx';
import './App.css';

/**
 * Componente raíz de la aplicación ProFruit (landing de una sola página).
 * Orden visual: barra fija → secciones en flujo vertical → pie de página.
 */
export default function App() {
  useEffect(() => {
    document.title = 'ProFruit Col';
  }, []);

  return (
    <div className="app-root">
      <Navbar />
      <main id="inicio" className="app-main" tabIndex={-1}>
        <About />
        <Products />
        <Opinions />
        <JobWithUs />
      </main>
      <Footer />
    </div>
  );
}
