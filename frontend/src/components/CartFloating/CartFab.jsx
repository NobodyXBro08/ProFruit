import React from 'react';
import { IoCartOutline } from 'react-icons/io5';
import { useCart } from '../../context/CartContext.jsx';
import './CartFab.css';

export default function CartFab({ onOpen }) {
  const { totalQuantity } = useCart();
  const badge =
    totalQuantity > 0 ? (
      <span className="cart-fab-badge">{totalQuantity > 99 ? '99+' : totalQuantity}</span>
    ) : null;

  return (
    <button
      type="button"
      className="cart-fab"
      onClick={onOpen}
      aria-label={`Bolsa de compras${totalQuantity ? `, ${totalQuantity} productos` : ', vacía'}`}
    >
      <IoCartOutline className="cart-fab-icon" aria-hidden size={26} />
      {badge}
    </button>
  );
}
