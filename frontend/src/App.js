import React, { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import Navbar from './components/NavBar/Navbar.jsx';
import About from './components/About/About.jsx';
import Products from './components/Products/Products.jsx';
import Opinions from './components/Opinions/Opinions.jsx';
import JobWithUs from './components/JobWithUs/JobWithUs.jsx';
import Footer from './components/Footer/Footer.jsx';
import './App.css';

export default function App() {
  useEffect(() => {
    document.title = 'ProFruit Col';
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
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
      </CartProvider>
    </AuthProvider>
  );
}
