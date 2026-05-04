import React, { useEffect, useState } from 'react';
import { FaTimes, FaMinus, FaPlus, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { formatPrice } from '../../utils/formatPrice';
import { api } from '../../config/api';
import './CartDrawer.css';

export default function CartDrawer({ isOpen, onClose }) {
  const { user } = useAuth();
  const { lines, bumpQuantity, removeLine, subtotal, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    setError(null);
    setSuccess(null);
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !user) onClose();
  }, [isOpen, user, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (lines.length === 0) {
      setError('El carrito está vacío.');
      return;
    }
    if (!user?.id) {
      setError('Debes iniciar sesión para confirmar el pedido.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(api('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.message || 'No se pudo crear el pedido.');
      }
      clearCart();
      setSuccess(`Pedido #${data.id} registrado. Total: ${formatPrice(data.total)}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cart-drawer-root" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
      <button type="button" className="cart-drawer-backdrop" aria-label="Cerrar carrito" onClick={onClose} />
      <aside className="cart-drawer-panel">
        <header className="cart-drawer-header">
          <h2 id="cart-drawer-title" className="cart-drawer-title">
            Carrito
          </h2>
          <button type="button" className="cart-drawer-close" onClick={onClose} aria-label="Cerrar">
            <FaTimes size={20} />
          </button>
        </header>

        <div className="cart-drawer-body">
          {lines.length === 0 ? (
            <p className="cart-drawer-empty">No hay productos. Añade ítems desde el catálogo.</p>
          ) : (
            <ul className="cart-drawer-lines">
              {lines.map((line) => (
                <li key={line.productId} className="cart-drawer-line">
                  <div className="cart-drawer-line-info">
                    <span className="cart-drawer-line-name">{line.name}</span>
                    <span className="cart-drawer-line-price">{formatPrice(line.price)} c/u</span>
                  </div>
                  <div className="cart-drawer-line-actions">
                    <div className="cart-drawer-qty">
                      <button
                        type="button"
                        className="cart-drawer-qty-btn"
                        aria-label="Menos"
                        onClick={() => bumpQuantity(line.productId, -1)}
                      >
                        <FaMinus size={12} />
                      </button>
                      <span className="cart-drawer-qty-value">{line.quantity}</span>
                      <button
                        type="button"
                        className="cart-drawer-qty-btn"
                        aria-label="Más"
                        disabled={line.quantity >= line.maxStock}
                        onClick={() => bumpQuantity(line.productId, 1)}
                      >
                        <FaPlus size={12} />
                      </button>
                    </div>
                    <span className="cart-drawer-line-sub">
                      {formatPrice(line.quantity * line.price)}
                    </span>
                    <button
                      type="button"
                      className="cart-drawer-remove"
                      aria-label={`Quitar ${line.name}`}
                      onClick={() => removeLine(line.productId)}
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {lines.length > 0 && (
            <div className="cart-drawer-total-row">
              <span>Subtotal</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>
          )}

          <form className="cart-drawer-form" onSubmit={handleSubmit} autoComplete="off">
            <p className="cart-drawer-form-title">Confirmar pedido</p>
            <p className="cart-drawer-form-hint">Se usará tu cuenta ({user?.username}) como titular del pedido.</p>

            {error && <p className="cart-drawer-msg cart-drawer-msg--error">{error}</p>}
            {success && <p className="cart-drawer-msg cart-drawer-msg--success">{success}</p>}

            <button
              type="submit"
              className="cart-drawer-submit"
              disabled={submitting || lines.length === 0}
            >
              {submitting ? 'Enviando…' : 'Confirmar pedido'}
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
