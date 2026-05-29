import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { CatalogProvider } from './context/CatalogContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { LoginModalProvider } from './context/LoginModalContext.jsx';
import { CartUiProvider } from './context/CartUiContext.jsx';
import ToastViewport from './components/ui/ToastViewport.jsx';
import Navbar from './components/NavBar/Navbar.jsx';
import Footer from './components/Footer/Footer.jsx';
import SyncGuestCart from './components/SyncGuestCart.jsx';
import Home from './pages/Home.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Checkout from './pages/Checkout.jsx';
import './App.css';

function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    if (pathname !== '/' || !hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

export default function App() {
  useEffect(() => {
    document.title = 'ProFruit Col';
  }, []);

  return (
    <BrowserRouter>
      <ScrollToHash />
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
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/producto/:id" element={<ProductDetail />} />
                        <Route path="/checkout" element={<Checkout />} />
                      </Routes>
                    </main>
                    <Footer />
                  </div>
                </CartUiProvider>
              </CartProvider>
            </LoginModalProvider>
          </AuthProvider>
        </ToastProvider>
      </CatalogProvider>
    </BrowserRouter>
  );
}
