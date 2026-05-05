import React, { useMemo, useState, useEffect } from 'react';
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
          subtitle="Catálogo claro y rápido de leer. Usa la búsqueda en la barra superior."
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
          <ul className="products-list">
            {visibleProducts.map((product) => {
              const imgSrc = getProductImage(product, product._index);
              return (
                <li key={product.id} className="products-list-item">
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
        )}
      </Container>
    </section>
  );
}
