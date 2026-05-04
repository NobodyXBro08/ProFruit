import React, { useState, useEffect, useRef } from 'react';
import './Products.css';
import { FaShoppingCart, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

import MangoDeshidratado from '../../assets/images/MangoDeshidratado.jpg';
import PinaDeshidratada from '../../assets/images/PiñaAnillos.jpg';
import ChipsBanano from '../../assets/images/ChipsDeBanano.jpg';
import AnillosManzana from '../../assets/images/AnillosDeManzana.jpg';
import { formatPrice } from '../../utils/formatPrice';
import { CatalogProductStars } from '../../utils/stars';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';

const defaultImages = [MangoDeshidratado, PinaDeshidratada, ChipsBanano, AnillosManzana];

function ProductsSectionHeader({ subtitle, subtitleClassName = 'products-subtitle' }) {
  return (
    <div className="products-header">
      <h2 className="products-title">Nuestros Productos</h2>
      <p className={subtitleClassName}>{subtitle}</p>
    </div>
  );
}

/**
 * Catálogo: solo URL absoluta desde REACT_APP_API_URL (incrustada en build por CRA).
 */
export default function Products() {
  const API = process.env.REACT_APP_API_URL;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const carouselRef = useRef(null);
  const { user } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    async function loadProducts() {
      try {
        if (!API) {
          throw new Error('REACT_APP_API_URL no está definido');
        }
        const base = String(API).trim().replace(/\/$/, '');
        const res = await fetch(`${base}/api/products`);
        const data = await res.json();
        console.log('API DATA:', data);
        if (!res.ok) {
          const msg = (data && (data.error || data.message)) || 'Error al cargar productos';
          throw new Error(typeof msg === 'string' ? msg : 'Error al cargar productos');
        }
        setProducts(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('FETCH ERROR:', err);
        setError(err instanceof Error ? err.message : String(err));
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [API]);

  const getProductImage = (product, index) => {
    if (product.image && (product.image.startsWith('http') || product.image.startsWith('data:'))) {
      return product.image;
    }
    return defaultImages[index % defaultImages.length];
  };

  /** Desplaza el carrusel una tarjeta hacia la izquierda o la derecha. */
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
        <ProductsSectionHeader subtitle="Cargando productos desde la base de datos…" />
        <div className="products-carousel-loading">
          <p>Cargando…</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="products" id="products">
        <ProductsSectionHeader
          subtitle={error}
          subtitleClassName="products-subtitle products-subtitle--error"
        />
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="products" id="products">
        <ProductsSectionHeader
          subtitle="No hay productos en la base de datos. Revisa la tabla products o el seed de Docker (ver documentación del proyecto)."
          subtitleClassName="products-subtitle"
        />
      </section>
    );
  }

  return (
    <section className="products" id="products">
      <ProductsSectionHeader
        subtitle="Descubre nuestra selección de frutas deshidratadas de la más alta calidad, cultivadas y procesadas con el máximo cuidado."
      />

      {/* Carrusel: flechas + contenedor con scroll horizontal */}
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
                    <div className="product-stars">
                      <CatalogProductStars />
                    </div>
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
                  ) : !user ? (
                    <button
                      type="button"
                      className="product-btn product-btn--disabled"
                      disabled
                      title="Inicia sesión para añadir productos al carrito"
                    >
                      <FaShoppingCart />
                      <span>Inicia sesión para comprar</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="product-btn"
                      onClick={() => addToCart(product)}
                    >
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
