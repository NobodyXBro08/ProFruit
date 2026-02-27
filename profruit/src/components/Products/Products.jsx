import React, { useState, useEffect, useRef } from 'react';
import './Products.css';
import { FaStar, FaRegStar, FaShoppingCart, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

import MangoDeshidratado from '../../assets/images/MangoDeshidratado.jpg';
import PinaDeshidratada from '../../assets/images/PiñaAnillos.jpg';
import ChipsBanano from '../../assets/images/ChipsDeBanano.jpg';
import AnillosManzana from '../../assets/images/AnillosDeManzana.jpg';

const defaultImages = [MangoDeshidratado, PinaDeshidratada, ChipsBanano, AnillosManzana];

function formatPrice(value) {
  if (value == null) return '';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function renderStars() {
  const total = 5;
  return Array.from({ length: total }).map((_, idx) =>
    idx < 4 ? <FaStar key={idx} /> : <FaRegStar key={idx} />,
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const carouselRef = useRef(null);

  useEffect(() => {
    fetch('/api/products')
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data.error || data.message || 'Error al cargar productos';
          throw new Error(msg);
        }
        return data;
      })
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const getProductImage = (product, index) => {
    if (product.image && (product.image.startsWith('http') || product.image.startsWith('data:'))) {
      return product.image;
    }
    return defaultImages[index % defaultImages.length];
  };

  const scrollCarousel = (direction) => {
    const el = carouselRef.current;
    if (!el) return;
    const cardWidth = el.querySelector('.product-card')?.offsetWidth ?? 300;
    const gap = 24;
    const scrollAmount = (cardWidth + gap) * (direction === 'next' ? 1 : -1);
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <section className="products" id="products">
        <div className="products-header">
          <h2 className="products-title">Nuestros Productos</h2>
          <p className="products-subtitle">Cargando productos desde la base de datos…</p>
        </div>
        <div className="products-carousel-loading">
          <p>Cargando…</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="products" id="products">
        <div className="products-header">
          <h2 className="products-title">Nuestros Productos</h2>
          <p className="products-subtitle" style={{ color: '#c00' }}>
            {error}. Asegúrate de que el backend esté corriendo en el puerto 3000.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="products" id="products">
      <div className="products-header">
        <h2 className="products-title">Nuestros Productos</h2>
        <p className="products-subtitle">
          Descubre nuestra selección de frutas deshidratadas de la más alta calidad,
          cultivadas y procesadas con el máximo cuidado.
        </p>
      </div>

      <div className="products-carousel-wrapper">
        <button
          type="button"
          className="products-carousel-btn products-carousel-btn--prev"
          onClick={() => scrollCarousel('prev')}
          aria-label="Anterior"
        >
          <FaChevronLeft />
        </button>

        <div className="products-carousel" ref={carouselRef}>
          {products.map((product, index) => {
            const isSoldOut = product.stock === 0;
            return (
              <article
                key={product.id}
                className={`product-card ${isSoldOut ? 'product-card--soldout' : ''}`}
              >
                <div className="product-card-image">
                  <img src={getProductImage(product, index)} alt={product.name} />
                  {isSoldOut && (
                    <span className="product-tag product-tag--soldout">Agotado</span>
                  )}
                </div>

                <div className="product-card-body">
                  <h3 className="product-name">{product.name}</h3>
                  <div className="product-rating-row">
                    <div className="product-stars">{renderStars()}</div>
                  </div>
                  <p className="product-description">{product.description}</p>
                  <div className="product-price-row">
                    <span className="product-price">{formatPrice(product.price)}</span>
                    {product.weight && (
                      <span className="product-weight">{product.weight}</span>
                    )}
                  </div>
                </div>

                <div className="product-card-footer">
                  {isSoldOut ? (
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
            );
          })}
        </div>

        <button
          type="button"
          className="products-carousel-btn products-carousel-btn--next"
          onClick={() => scrollCarousel('next')}
          aria-label="Siguiente"
        >
          <FaChevronRight />
        </button>
      </div>

      <p className="products-help">
        ¿No encuentras lo que buscas? Tenemos muchos más productos disponibles.
      </p>
    </section>
  );
}
