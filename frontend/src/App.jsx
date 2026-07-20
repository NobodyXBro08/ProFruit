import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
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
import AdminProducts from './pages/AdminProducts.jsx';
import AdminOrders from './pages/AdminOrders.jsx';
import AdminHome from './pages/AdminHome.jsx';
import AdminInventory from './pages/AdminInventory.jsx';
import AdminPromotions from './pages/AdminPromotions.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import RequireAdmin from './components/RequireAdmin.jsx';
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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/producto/:id" element={<ProductDetail />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminHome />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/pedidos"
        element={
          <RequireAdmin permission="orders:manage">
            <AdminOrders />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/productos"
        element={
          <RequireAdmin permission="products:manage">
            <AdminProducts />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/inventario"
        element={
          <RequireAdmin permission="inventory:manage">
            <AdminInventory />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/promociones"
        element={
          <RequireAdmin permission="promotions:manage">
            <AdminPromotions />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/usuarios"
        element={
          <RequireAdmin permission="users:manage">
            <AdminUsers />
          </RequireAdmin>
        }
      />
    </Routes>
  );
}

export default function App() {
  useEffect(() => {
    document.title = 'ProFruit Col';
  }, []);

  return (
    <BrowserRouter>
      <ScrollToHash />
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
                    <AppRoutes />
                  </main>
                  <Footer />
                </div>
              </CartUiProvider>
            </CartProvider>
          </LoginModalProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
