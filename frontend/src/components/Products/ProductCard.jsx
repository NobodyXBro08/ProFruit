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
    <article className={`product-card-row ${soldOut ? 'product-card-row--soldout' : ''}`}>
      <div className="product-card-row__media">
        <img src={image} alt={name} />
      </div>

      <div className="product-card-row__body">
        <div className="product-card-row__title-line">
          <h3 className="product-card-row__name">{name}</h3>
          <span
            className={
              soldOut ? 'product-card-row__availability product-card-row__availability--out' : 'product-card-row__availability product-card-row__availability--ok'
            }
          >
            {soldOut ? 'Agotado' : 'Disponible'}
          </span>
        </div>

        {description ? <p className="product-card-row__desc">{description}</p> : null}

        <div className="product-card-row__price-block">
          <span className="product-card-row__price">{priceLabel}</span>
          {weight ? <span className="product-card-row__weight">{weight}</span> : null}
        </div>
      </div>

      <div className="product-card-row__cta">
        {soldOut ? (
          <span className="product-card-row__cta-placeholder" aria-hidden />
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
            <FaShoppingCart aria-hidden size={18} />
          </button>
        )}
      </div>
    </article>
  );
}
