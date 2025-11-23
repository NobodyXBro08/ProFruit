import React from 'react';
import './Products.css';
import { FaStar, FaRegStar, FaShoppingCart } from 'react-icons/fa';

import MangoDeshidratado from '../../assets/images/MangoDeshidratado.jpg';
import PinaDeshidratada from '../../assets/images/PiñaAnillos.jpg';
import ChipsBanano from '../../assets/images/ChipsDeBanano.jpg';
import AnillosManzana from '../../assets/images/AnillosDeManzana.jpg';

const products = [
  {
    id: 1,
    name: 'Mango Deshidratado Premium',
    tag: '¡Oferta!',
    rating: 4,
    ratingValue: 4.8,
    description:
      'Deliciosos trozos de mango deshidratado, naturalmente dulces y llenos de sabor tropical.',
    price: '$15.000',
    oldPrice: '$18.000',
    status: 'default',
    Image: MangoDeshidratado,
  },
  {
    id: 2,
    name: 'Piña Deshidratada en Anillos',
    tag: '',
    rating: 4,
    ratingValue: 4.6,
    description:
      'Anillos de piña deshidratada, perfectos para snacks saludables o postres naturales.',
    price: '$12.000',
    oldPrice: '',
    status: 'default',
    Image: PinaDeshidratada,
  },
  {
    id: 3,
    name: 'Chips de Banano Crujientes',
    tag: '¡Oferta!',
    rating: 5,
    ratingValue: 4.9,
    description:
      'Chips de banano naturalmente dulces y crujientes, ideales para cualquier momento del día.',
    price: '$8.000',
    oldPrice: '$10.000',
    status: 'default',
    Image: ChipsBanano,
  },
  {
    id: 4,
    name: 'Anillos de Manzana Mixta',
    tag: 'Agotado',
    rating: 5,
    ratingValue: 4.5,
    description:
      'Mezcla de manzanas rojas y verdes deshidratadas, conservando todo su sabor natural.',
    price: '$10.000',
    oldPrice: '',
    status: 'soldout',
    Image: AnillosManzana,
  },
];

function renderStars(count) {
  const total = 5;
  return Array.from({ length: total }).map((_, idx) =>
    idx < count ? <FaStar key={idx} /> : <FaRegStar key={idx} />,
  );
}

export default function Products() {
  return (
    <section className="products" id="products">
      <div className="products-header">
        <h2 className="products-title">Nuestros Productos</h2>
        <p className="products-subtitle">
          Descubre nuestra selección de frutas deshidratadas de la más alta calidad,
          cultivadas y procesadas con el máximo cuidado.
        </p>
      </div>

      <div className="products-grid">
        {products.map((product) => (
          <article
            key={product.id}
            className={`product-card ${
              product.status === 'soldout' ? 'product-card--soldout' : ''
            }`}
          >
            {/* Imagen + etiqueta */}
            <div className="product-card-image">
              <img src={product.Image} alt={product.name} />

              {product.tag && (
                <span
                  className={`product-tag ${
                    product.status === 'soldout' ? 'product-tag--soldout' : ''
                  }`}
                >
                  {product.tag}
                </span>
              )}
            </div>

            {/* Contenido */}
            <div className="product-card-body">
              <h3 className="product-name">{product.name}</h3>

              <div className="product-rating-row">
                <div className="product-stars">{renderStars(product.rating)}</div>
                <span className="product-rating-value">({product.ratingValue})</span>
              </div>

              <p className="product-description">{product.description}</p>

              <div className="product-price-row">
                <span className="product-price">{product.price}</span>
                {product.oldPrice && (
                  <span className="product-old-price">{product.oldPrice}</span>
                )}
              </div>
            </div>

            {/* Footer (botón) */}
            <div className="product-card-footer">
              {product.status === 'soldout' ? (
                <button className="product-btn product-btn--disabled" disabled>
                  No disponible
                </button>
              ) : (
                <button className="product-btn">
                  <FaShoppingCart />
                  <span>Agregar al carrito</span>
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      <p className="products-help">
        ¿No encuentras lo que buscas? Tenemos muchos más productos disponibles.
      </p>
    </section>
  );
}