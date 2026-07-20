import React from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaLeaf } from 'react-icons/fa';
import { formatPrice } from '../../utils/formatPrice';
import './ProductCard.css';

/**
 * @param {object} props
 * @param {number|string} props.id
 * @param {string} props.name
 * @param {string} [props.description]
 * @param {number} props.price
 * @param {string} props.image
 * @param {number} props.stock
 * @param {string} [props.weight]
 * @param {() => void} props.onAdd
 */
export default function ProductCard({
  id,
  name,
  description,
  price,
  originalPrice,
  promotion,
  image,
  stock,
  weight,
  onAdd,
}) {
  const qty = Number(stock);
  const soldOut = !Number.isFinite(qty) || qty <= 0;
  const hasPromo = Boolean(promotion) && Number(originalPrice) > Number(price);
  const priceLabel = formatPrice(price);
  const originalLabel = hasPromo ? formatPrice(originalPrice) : null;
  const savingsAmount = hasPromo
    ? Math.round((Number(originalPrice) - Number(price)) * 100) / 100
    : 0;
  const savingsPercent = hasPromo
    ? Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)
    : 0;
  const detailPath = `/producto/${id}`;

  return (
    <article className={`product-card ${soldOut ? 'product-card--soldout' : ''}`}>
      <Link to={detailPath} className="product-card__media-link" tabIndex={-1} aria-hidden>
        <div className="product-card__media">
          <img src={image} alt={name} loading="lazy" />
          {soldOut ? (
            <span className="product-card__badge product-card__badge--sold">Agotado</span>
          ) : hasPromo ? (
            <span className="product-card__badge product-card__badge--promo">
              {savingsPercent > 0 ? `−${savingsPercent}%` : 'Oferta'}
            </span>
          ) : qty <= 5 ? (
            <span className="product-card__badge product-card__badge--low">Últimas unidades</span>
          ) : (
            <span className="product-card__badge product-card__badge--fresh">
              <FaLeaf aria-hidden size={10} /> 100% natural
            </span>
          )}
        </div>
      </Link>

      <div className="product-card__body">
        <div className="product-card__meta-row">
          {weight ? <span className="product-card__weight">{weight}</span> : null}
          {!soldOut && qty > 0 ? (
            <span className="product-card__stock">{qty} disponibles</span>
          ) : null}
        </div>

        <h3 className="product-card__name">
          <Link to={detailPath}>{name}</Link>
        </h3>

        {description ? <p className="product-card__desc">{description}</p> : null}

        <div className="product-card__footer">
          <span className={`product-card__price${hasPromo ? ' product-card__price--promo' : ''}`}>
            {hasPromo ? <s className="product-card__price-old">{originalLabel}</s> : null}
            <span>{priceLabel}</span>
            {hasPromo && savingsAmount > 0 ? (
              <small className="product-card__savings">Ahorras {formatPrice(savingsAmount)}</small>
            ) : null}
          </span>
          <div className="product-card__actions">
            <Link to={detailPath} className="product-card__detail-btn">
              Ver producto
            </Link>
            {soldOut ? (
              <button type="button" className="product-card__cart product-card__cart--disabled" disabled>
                Sin stock
              </button>
            ) : (
              <button
                type="button"
                className="product-card__cart"
                aria-label={`Añadir ${name} al carrito`}
                onClick={onAdd}
              >
                <FaShoppingCart aria-hidden size={14} />
                Añadir
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
