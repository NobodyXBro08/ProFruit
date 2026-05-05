import React from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { formatPrice } from '../../utils/formatPrice';
import './ProductCard.css';

/**
 * @param {object} props
 * @param {string} props.name
 * @param {string} [props.description]
 * @param {number} props.price
 * @param {string} props.image
 * @param {number} props.stock
 * @param {string} [props.weight]
 * @param {boolean} props.userLoggedIn
 * @param {() => void} props.onAdd
 * @param {() => void} props.onLoginRequest
 */
export default function ProductCard({
  name,
  description,
  price,
  image,
  stock,
  weight,
  userLoggedIn,
  onAdd,
  onLoginRequest,
}) {
  const qty = Number(stock);
  const soldOut = !Number.isFinite(qty) || qty <= 0;
  const priceLabel = formatPrice(price);

  return (
    <article
      className={`product-card-row ${soldOut ? 'product-card-row--soldout' : ''}`}
      aria-disabled={soldOut}
    >
      <div className="product-card-row__media">
        <img src={image} alt="" />
      </div>

      <div className="product-card-row__body">
        <h3 className="product-card-row__name">{name}</h3>

        {description ? <p className="product-card-row__desc">{description}</p> : null}

        <div className="product-card-row__price-block">
          <span className="product-card-row__price">{priceLabel}</span>
          {weight ? <span className="product-card-row__weight">{weight}</span> : null}
        </div>
      </div>

      <div className="product-card-row__cta">
        {soldOut ? (
          <button
            type="button"
            className="product-card-row__cart product-card-row__cart--disabled"
            disabled
            aria-label={`${name}: sin existencias`}
          >
            <FaShoppingCart aria-hidden size={15} />
          </button>
        ) : !userLoggedIn ? (
          <button type="button" className="product-card-row__login" onClick={onLoginRequest}>
            Entrar
          </button>
        ) : (
          <button
            type="button"
            className="product-card-row__cart"
            aria-label={`Añadir ${name} al carrito`}
            onClick={onAdd}
          >
            <FaShoppingCart aria-hidden size={15} />
          </button>
        )}
      </div>
    </article>
  );
}
