import React, { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { CatalogProvider } from './context/CatalogContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { LoginModalProvider } from './context/LoginModalContext.jsx';
import { CartUiProvider } from './context/CartUiContext.jsx';
import ToastViewport from './components/ui/ToastViewport.jsx';
import Navbar from './components/NavBar/Navbar.jsx';
import About from './components/About/About.jsx';
import Products from './components/Products/Products.jsx';
import Opinions from './components/Opinions/Opinions.jsx';
import JobWithUs from './components/JobWithUs/JobWithUs.jsx';
import Footer from './components/Footer/Footer.jsx';
import SyncGuestCart from './components/SyncGuestCart.jsx';
import './App.css';

export default function App() {
  useEffect(() => {
    document.title = 'ProFruit Col';
  }, []);

  return (
    <CatalogProvider>
      <ToastProvider>
        <ToastViewport />
        <AuthProvider>
          <LoginModalProvider>
            <CartProvider>
              <CartUiProvider>
                <SyncGuestCart />
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
              </CartUiProvider>
            </CartProvider>
          </LoginModalProvider>
        </AuthProvider>
      </ToastProvider>
    </CatalogProvider>
  );
}
