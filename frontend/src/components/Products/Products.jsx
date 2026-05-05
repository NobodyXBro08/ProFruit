import React, { useMemo, useState, useEffect } from 'react';
import './Products.css';
import { FaShoppingCart } from 'react-icons/fa';

import MangoDeshidratado from '../../assets/images/MangoDeshidratado.jpg';
import PinaDeshidratada from '../../assets/images/PiñaAnillos.jpg';
import ChipsBanano from '../../assets/images/ChipsDeBanano.jpg';
import AnillosManzana from '../../assets/images/AnillosDeManzana.jpg';
import { formatPrice } from '../../utils/formatPrice';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useCatalog } from '../../context/CatalogContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useLoginModal } from '../../context/LoginModalContext.jsx';
import Container from '../ui/Container.jsx';
import SectionHeader from '../ui/SectionHeader.jsx';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';

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
      <section className="products" id="products">
        <Container>
          <SectionHeader title="La tienda" subtitle="Cargando catálogo…" />
          <p className="products-loading-msg">Cargando…</p>
        </Container>
      </section>
    );
  }

  if (error) {
    return (
      <section className="products" id="products">
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
      <section className="products" id="products">
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
    <section className="products" id="products">
      <Container>
        <SectionHeader
          title="La tienda"
          subtitle="Todo el catálogo en un vistazo. Usa la búsqueda arriba si buscas algo concreto."
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
          <ul className="products-grid">
            {visibleProducts.map((product) => {
              const isSoldOut = product.stock === 0;
              const lowStock = !isSoldOut && product.stock > 0 && product.stock <= 3;
              const imgSrc = getProductImage(product, product._index);
              const organic =
                /org[aá]nico|natural|campesino|local/i.test(
                  `${product.name} ${product.description || ''}`,
                );

              return (
                <li key={product.id}>
                  <article className={`product-card ${isSoldOut ? 'product-card--soldout' : ''}`}>
                    <div className="product-card-image">
                      <img src={imgSrc} alt={product.name} />
                      <div className="product-card-badges">
                        {organic ? <Badge tone="organic">Natural</Badge> : null}
                        {lowStock ? <Badge tone="stock">Últimas unidades</Badge> : null}
                        {isSoldOut ? <Badge tone="soldout">Agotado</Badge> : null}
                      </div>
                    </div>

                    <div className="product-card-body">
                      <h3 className="product-name">{product.name}</h3>
                      <p className="product-description">{product.description}</p>
                      <div className="product-price-row">
                        <span className="product-price">{formatPrice(product.price)}</span>
                        {product.weight ? (
                          <span className="product-weight">{product.weight}</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="product-card-footer">
                      {isSoldOut ? (
                        <Button variant="secondary" size="md" className="product-btn-full" disabled>
                          No disponible
                        </Button>
                      ) : !user ? (
                        <Button
                          variant="secondary"
                          size="md"
                          className="product-btn-full"
                          type="button"
                          onClick={() => {
                            showToast('Necesitas una cuenta para comprar.', 'error');
                            openLogin();
                          }}
                        >
                          Inicia sesión para comprar
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="md"
                          className="product-btn-full"
                          type="button"
                          onClick={() => handleAdd(product, product._index)}
                        >
                          <FaShoppingCart aria-hidden />
                          <span>Añadir al carrito</span>
                        </Button>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}

        <p className="products-help">¿Dudas? Escríbenos desde el pie de página.</p>
      </Container>
    </section>
  );
}
