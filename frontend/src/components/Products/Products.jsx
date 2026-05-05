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
import Container from '../ui/Container.jsx';
import SectionHeader from '../ui/SectionHeader.jsx';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  inferProductCategory,
} from '../../utils/inferProductCategory.js';

const defaultImages = [MangoDeshidratado, PinaDeshidratada, ChipsBanano, AnillosManzana];

function priceThresholds(prices) {
  const sorted = [...prices].filter((p) => Number.isFinite(p)).sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return { low: 0, high: 0 };
  return {
    low: sorted[Math.floor(n * 0.33)],
    high: sorted[Math.floor(n * 0.66)],
  };
}

export default function Products() {
  const API = process.env.REACT_APP_API_URL;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const {
    searchQuery,
    category,
    setCategory,
    sort,
    setSort,
    pricePreset,
    setPricePreset,
    resetFilters,
  } = useCatalog();

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

  const productsWithMeta = useMemo(() => {
    return products.map((p, index) => ({
      ...p,
      _category: inferProductCategory(p),
      _index: index,
    }));
  }, [products]);

  const thresholds = useMemo(
    () => priceThresholds(products.map((p) => Number(p.price))),
    [products],
  );

  const filteredSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = productsWithMeta.filter((p) => {
      if (category !== 'all' && p._category !== category) return false;
      if (q) {
        const hay = `${p.name} ${p.description || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const price = Number(p.price);
      if (pricePreset === 'low' && price > thresholds.low) return false;
      if (pricePreset === 'mid' && (price <= thresholds.low || price > thresholds.high)) return false;
      if (pricePreset === 'high' && price <= thresholds.high) return false;
      return true;
    });

    if (sort === 'price-asc') list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === 'price-desc') list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
    else if (sort === 'name') list = [...list].sort((a, b) => String(a.name).localeCompare(String(b.name)));
    else list = [...list];

    return list;
  }, [productsWithMeta, searchQuery, category, sort, pricePreset, thresholds]);

  const getProductImage = (product, index) => {
    if (product.image && (product.image.startsWith('http') || product.image.startsWith('data:'))) {
      return product.image;
    }
    return defaultImages[index % defaultImages.length];
  };

  const handleAdd = (product, displayIndex) => {
    const img = getProductImage(product, displayIndex);
    addToCart(product, img);
    showToast(`«${product.name}» añadido al carrito`);
  };

  if (loading) {
    return (
      <section className="products" id="products">
        <Container>
          <SectionHeader title="Nuestros productos" subtitle="Cargando catálogo…" />
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
      <section className="products" id="products">
        <Container>
          <SectionHeader
            title="Nuestros productos"
            subtitle="No hay productos en la base de datos. Revisa el seed o la documentación del proyecto."
          />
        </Container>
      </section>
    );
  }

  const priceLabel =
    products.length < 2
      ? 'Precio'
      : `Precio (${formatPrice(thresholds.low)} · ${formatPrice(thresholds.high)})`;

  return (
    <section className="products" id="products">
      <Container>
        <SectionHeader
          title="Frutas y snacks naturales"
          subtitle="Selección ProFruit: calidad de origen, listos para disfrutar o regalar. Filtra por categoría o precio y añade al carrito en un toque."
        />

        <div className="products-toolbar">
          <div className="products-chips" role="group" aria-label="Categoría">
            {CATEGORY_ORDER.map((key) => (
              <button
                key={key}
                type="button"
                className={`products-chip ${category === key ? 'products-chip--active' : ''}`}
                onClick={() => setCategory(key)}
              >
                {CATEGORY_LABELS[key]}
              </button>
            ))}
          </div>

          <div className="products-filters-row">
            <label className="products-select-wrap">
              <span className="products-select-label">Orden</span>
              <select
                className="products-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Ordenar productos"
              >
                <option value="default">Orden del catálogo</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="name">Nombre A–Z</option>
              </select>
            </label>

            <label className="products-select-wrap">
              <span className="products-select-label">{priceLabel}</span>
              <select
                className="products-select"
                value={pricePreset}
                onChange={(e) => setPricePreset(e.target.value)}
                aria-label="Rango de precio"
              >
                <option value="all">Todos los precios</option>
                <option value="low">Más accesibles</option>
                <option value="mid">Rango medio</option>
                <option value="high">Premium</option>
              </select>
            </label>
          </div>
        </div>

        {filteredSorted.length === 0 ? (
          <p className="products-empty-filter">
            No hay productos con estos filtros.{' '}
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
              Limpiar filtros
            </Button>
          </p>
        ) : (
          <ul className="products-grid">
            {filteredSorted.map((product) => {
              const isSoldOut = product.stock === 0;
              const lowStock = !isSoldOut && product.stock > 0 && product.stock <= 3;
              const imgSrc = getProductImage(product, product._index);
              const organic =
                /org[aá]nico|natural|campesino|local/i.test(
                  `${product.name} ${product.description || ''}`,
                );

              return (
                <li key={product.id}>
                  <article
                    className={`product-card ${isSoldOut ? 'product-card--soldout' : ''}`}
                  >
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
                      {!user ? (
                        <p className="product-guest-hint">
                          Puedes armar el carrito sin cuenta. Para pagar, inicia sesión al confirmar.
                        </p>
                      ) : null}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}

        <p className="products-help">
          ¿No encuentras lo que buscas? Escríbenos desde contacto o prueba otra categoría.
        </p>
      </Container>
    </section>
  );
}
