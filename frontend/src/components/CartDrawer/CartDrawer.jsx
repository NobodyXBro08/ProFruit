import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaMinus, FaPlus, FaTrash, FaLeaf, FaArrowRight } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { formatPrice } from '../../utils/formatPrice';
import Button from '../ui/Button.jsx';
import './CartDrawer.css';

export default function CartDrawer({ isOpen, onClose, onRequestLogin }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lines, bumpQuantity, removeLine, subtotal } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const goShop = () => {
    onClose();
    if (window.location.pathname !== '/') {
      navigate('/#products');
    } else {
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const goCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <div className="cart-drawer-root" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
      <button type="button" className="cart-drawer-backdrop" aria-label="Cerrar carrito" onClick={onClose} />
      <aside className="cart-drawer-panel">
        <header className="cart-drawer-header">
          <div className="cart-drawer-header-text">
            <h2 id="cart-drawer-title" className="cart-drawer-title">
              Tu bolsa
            </h2>
            <p className="cart-drawer-sub">
              {lines.length === 0
                ? 'Vacía por ahora'
                : `${lines.length} ${lines.length === 1 ? 'producto' : 'productos'} · ${formatPrice(subtotal)}`}
            </p>
          </div>
          <button type="button" className="cart-drawer-close" onClick={onClose} aria-label="Cerrar">
            <FaTimes size={20} />
          </button>
        </header>

        <div className="cart-drawer-scroll">
          {lines.length === 0 ? (
            <div className="cart-drawer-empty">
              <div className="cart-drawer-empty-icon" aria-hidden>
                <FaLeaf />
              </div>
              <h3 className="cart-drawer-empty-title">Tu bolsa está vacía</h3>
              <p className="cart-drawer-empty-text">
                {user ? (
                  <>
                    Explora la tienda y pulsa <strong>Añadir</strong> en los productos que quieras.
                  </>
                ) : (
                  <>
                    <strong>Inicia sesión</strong> para añadir productos y completar tu compra.
                  </>
                )}
              </p>
              <Button type="button" variant="primary" size="md" className="cart-drawer-empty-cta" onClick={goShop}>
                Ir a la tienda
                <FaArrowRight aria-hidden />
              </Button>
              {!user ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="cart-drawer-empty-cta"
                  onClick={() => onRequestLogin?.()}
                >
                  Iniciar sesión
                </Button>
              ) : null}
            </div>
          ) : (
            <ul className="cart-drawer-lines">
              {lines.map((line) => (
                <li key={line.productId} className="cart-drawer-line">
                  {line.image ? (
                    <div className="cart-drawer-thumb">
                      <img src={line.image} alt="" />
                    </div>
                  ) : (
                    <div className="cart-drawer-thumb cart-drawer-thumb--placeholder" aria-hidden />
                  )}

                  <div className="cart-drawer-line-main">
                    <div className="cart-drawer-line-head">
                      <span className="cart-drawer-line-name">{line.name}</span>
                      <button
                        type="button"
                        className="cart-drawer-remove"
                        aria-label={`Quitar ${line.name}`}
                        onClick={() => removeLine(line.productId)}
                      >
                        <FaTrash size={13} />
                      </button>
                    </div>
                    <span className="cart-drawer-line-meta">
                      {formatPrice(line.price)} c/u · Máx. {line.maxStock}
                    </span>
                    <div className="cart-drawer-line-controls">
                      <div className="cart-drawer-qty">
                        <button
                          type="button"
                          className="cart-drawer-qty-btn"
                          aria-label="Quitar una unidad"
                          onClick={() => bumpQuantity(line.productId, -1)}
                        >
                          <FaMinus size={12} />
                        </button>
                        <span className="cart-drawer-qty-value">{line.quantity}</span>
                        <button
                          type="button"
                          className="cart-drawer-qty-btn"
                          aria-label="Añadir una unidad"
                          disabled={line.quantity >= line.maxStock}
                          onClick={() => bumpQuantity(line.productId, 1)}
                        >
                          <FaPlus size={12} />
                        </button>
                      </div>
                      <span className="cart-drawer-line-total">{formatPrice(line.quantity * line.price)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 ? (
          <div className="cart-drawer-footer">
            <div className="cart-drawer-summary">
              <div className="cart-drawer-summary-row">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <p className="cart-drawer-summary-hint">Envío e impuestos se calculan en el checkout.</p>
            </div>

            {!user ? (
              <div className="cart-drawer-guest">
                <p className="cart-drawer-guest-title">Inicia sesión para continuar</p>
                <p className="cart-drawer-guest-text">Guardamos tu pedido de forma segura antes del pago.</p>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="cart-drawer-guest-btn"
                  onClick={() => onRequestLogin?.()}
                >
                  Entrar o registrarse
                </Button>
              </div>
            ) : (
              <Button type="button" variant="dark" size="md" className="cart-drawer-checkout-btn" onClick={goCheckout}>
                Proceder al checkout
                <FaArrowRight aria-hidden />
              </Button>
            )}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
