import React, { useMemo, useState, useEffect } from 'react';
import './Products.css';
import { useCart } from '../../context/CartContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { getProductImage } from '../../utils/productImages';
import { api } from '../../config/api';
import { SITE } from '../../config/site';
import Container from '../ui/Container.jsx';
import SectionHeader from '../ui/SectionHeader.jsx';
import ProductCard from './ProductCard.jsx';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch(api('/api/products'));
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
  }, []);

  const productsIndexed = useMemo(
    () => products.map((p, index) => ({ ...p, _index: index })),
    [products],
  );

  const handleAdd = (product, displayIndex) => {
    const img = getProductImage(product, displayIndex);
    addToCart(product, img);
    showToast(`«${product.name}» añadido al carrito`);
  };

  if (loading) {
    return (
      <section className="products products--catalog" id="products">
        <Container>
          <SectionHeader title="Nuestros productos" subtitle="Cargando catálogo…" />
          <p className="products-loading-msg">Cargando…</p>
        </Container>
      </section>
    );
  }

  if (error) {
    return (
      <section className="products products--catalog" id="products">
        <Container>
          <SectionHeader
            title="Nuestros productos"
            subtitle={error}
            subtitleClassName="section-header-subtitle--error"
          />
        </Container>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="products products--catalog" id="products">
        <Container>
          <SectionHeader
            title="Nuestros productos"
            subtitle="No hay productos en la base de datos. Revisa el seed o la documentación del proyecto."
          />
        </Container>
      </section>
    );
  }

  return (
    <section className="products products--catalog" id="products">
      <Container>
        <SectionHeader
          title="Nuestros productos"
          subtitle="Frutas deshidratadas 100% naturales. Elige tu favorito, conoce el detalle y llévalo a tu bolsa."
        />

        <ul className="products-trust" aria-label="Beneficios de compra">
          <li>Origen Colombia</li>
          <li>Sin azúcar añadida</li>
          <li>{SITE.payments}</li>
        </ul>

        <div className="products-grid-wrap">
          <p className="products-count" aria-live="polite">
            {productsIndexed.length} {productsIndexed.length === 1 ? 'producto' : 'productos'}
          </p>
          <ul className="products-grid">
            {productsIndexed.map((product) => {
              const imgSrc = getProductImage(product, product._index);
              return (
                <li key={product.id}>
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    description={product.description}
                    price={product.price}
                    originalPrice={product.originalPrice}
                    promotion={product.promotion}
                    image={imgSrc}
                    stock={product.stock}
                    weight={product.weight}
                    onAdd={() => handleAdd(product, product._index)}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </section>
  );
}
