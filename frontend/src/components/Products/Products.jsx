import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './Products.css';

import MangoDeshidratado from '../../assets/images/MangoDeshidratado.jpg';
import PinaDeshidratada from '../../assets/images/PiñaAnillos.jpg';
import ChipsBanano from '../../assets/images/ChipsDeBanano.jpg';
import AnillosManzana from '../../assets/images/AnillosDeManzana.jpg';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useCatalog } from '../../context/CatalogContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useLoginModal } from '../../context/LoginModalContext.jsx';
import Container from '../ui/Container.jsx';
import SectionHeader from '../ui/SectionHeader.jsx';
import Button from '../ui/Button.jsx';
import ProductCard from './ProductCard.jsx';

const defaultImages = [MangoDeshidratado, PinaDeshidratada, ChipsBanano, AnillosManzana];

export default function Products() {
  const API = process.env.REACT_APP_API_URL;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { openLogin } = useLoginModal();
  const { searchQuery, setSearchQuery } = useCatalog();
  const carouselRef = useRef(null);

  const scrollCarousel = useCallback((direction) => {
    const el = carouselRef.current;
    if (!el) return;
    const step = Math.max(220, Math.floor(el.clientWidth * 0.72));
    el.scrollBy({ left: direction === 'next' ? step : -step, behavior: 'smooth' });
  }, []);

  const onCarouselKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollCarousel('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollCarousel('next');
      }
    },
    [scrollCarousel],
  );

  useEffect(() => {
    async function loadProducts() {
      try {
        if (!API) {
          throw new Error('REACT_APP_API_URL no está definido');
        }
        const base = String(API).trim().replace(/\/$/, '');
        const res = await fetch(`${base}/api/products`);
        const data = await res.json();
        if (!res.ok) {
          const msg = (data && (data.error || data.message)) || 'Error al cargar productos';
          throw new Error(typeof msg === 'string' ? msg : 'Error al cargar productos');
        }
        setProducts(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('loadProducts:', err);
        setError(err instanceof Error ? err.message : String(err));
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [API]);

  const productsIndexed = useMemo(
    () => products.map((p, index) => ({ ...p, _index: index })),
    [products],
  );

  const visibleProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return productsIndexed;
    return productsIndexed.filter((p) => {
      const hay = `${p.name} ${p.description || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [productsIndexed, searchQuery]);

  const getProductImage = (product, index) => {
    if (product.image && (product.image.startsWith('http') || product.image.startsWith('data:'))) {
      return product.image;
    }
    return defaultImages[index % defaultImages.length];
  };

  const handleAdd = (product, displayIndex) => {
    if (!user) {
      showToast('Inicia sesión para añadir productos a tu bolsa.', 'error');
      openLogin();
      return;
    }
    const img = getProductImage(product, displayIndex);
    addToCart(product, img);
    showToast(`«${product.name}» añadido al carrito`);
  };

  if (loading) {
    return (
      <section className="products products--tropical-menu" id="products">
        <Container>
          <SectionHeader title="La tienda" subtitle="Cargando catálogo…" />
          <p className="products-loading-msg">Cargando…</p>
        </Container>
      </section>
    );
  }

  if (error) {
    return (
      <section className="products products--tropical-menu" id="products">
        <Container>
          <SectionHeader
            title="La tienda"
            subtitle={error}
            subtitleClassName="section-header-subtitle--error"
          />
        </Container>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="products products--tropical-menu" id="products">
        <Container>
          <SectionHeader
            title="La tienda"
            subtitle="No hay productos en la base de datos. Revisa el seed o la documentación del proyecto."
          />
        </Container>
      </section>
    );
  }

  return (
    <section className="products products--tropical-menu" id="products">
      <Container>
        <SectionHeader
          title="Carta tropical"
          subtitle="Una fila ligera estilo menú: desliza o usa las flechas. La búsqueda sigue arriba."
        />

        {visibleProducts.length === 0 ? (
          <div className="products-no-results">
            <p className="products-no-results-title">Nada coincide con «{searchQuery.trim()}»</p>
            <p className="products-no-results-hint">Prueba otra palabra o borra la búsqueda.</p>
            <Button type="button" variant="primary" size="md" onClick={() => setSearchQuery('')}>
              Ver todo el catálogo
            </Button>
          </div>
        ) : (
          <div className="products-menu-panel">
            <p className="products-menu-kicker" aria-hidden>
              Fresco · Simple · Del día
            </p>
            <div className="products-carousel-shell">
              <button
                type="button"
                className="products-carousel-nav products-carousel-nav--prev"
                aria-label="Ver productos anteriores"
                onClick={() => scrollCarousel('prev')}
              >
                <FaChevronLeft aria-hidden />
              </button>
              <div
                className="products-carousel"
                ref={carouselRef}
                tabIndex={0}
                role="region"
                aria-label="Carrusel de productos"
                onKeyDown={onCarouselKeyDown}
              >
                <ul className="products-carousel__track">
                  {visibleProducts.map((product) => {
                    const imgSrc = getProductImage(product, product._index);
                    return (
                      <li key={product.id} className="products-carousel__slide">
                        <ProductCard
                          name={product.name}
                          description={product.description}
                          price={product.price}
                          image={imgSrc}
                          stock={product.stock}
                          weight={product.weight}
                          userLoggedIn={!!user}
                          onAdd={() => handleAdd(product, product._index)}
                          onLoginRequest={() => {
                            showToast('Necesitas una cuenta para comprar.', 'error');
                            openLogin();
                          }}
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
              <button
                type="button"
                className="products-carousel-nav products-carousel-nav--next"
                aria-label="Ver más productos"
                onClick={() => scrollCarousel('next')}
              >
                <FaChevronRight aria-hidden />
              </button>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
