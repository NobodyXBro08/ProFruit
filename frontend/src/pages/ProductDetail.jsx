import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaShoppingCart, FaLeaf } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useLoginModal } from '../context/LoginModalContext.jsx';
import { useCartUi } from '../context/CartUiContext.jsx';
import { getProductImage } from '../utils/productImages';
import { formatPrice } from '../utils/formatPrice';
import { api } from '../config/api';
import Container from '../components/ui/Container.jsx';
import Button from '../components/ui/Button.jsx';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { openLogin } = useLoginModal();
  const { openCart } = useCartUi();

  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(api('/api/products'));
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al cargar producto');
        const list = Array.isArray(data) ? data : [];
        setAllProducts(list);
        const found = list.find((p) => String(p.id) === String(id));
        if (!found) {
          setError('Producto no encontrado.');
        } else {
          setProduct(found);
          document.title = `${found.name} · ProFruit`;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar.');
      } finally {
        setLoading(false);
      }
    }
    load();
    window.scrollTo(0, 0);
  }, [id]);

  const productIndex = allProducts.findIndex((p) => String(p.id) === String(id));
  const image = product ? getProductImage(product, productIndex >= 0 ? productIndex : 0) : '';
  const qty = Number(product?.stock);
  const soldOut = !Number.isFinite(qty) || qty <= 0;

  const handleAdd = () => {
    if (!user) {
      showToast('Inicia sesión para añadir productos a tu bolsa.', 'error');
      openLogin();
      return;
    }
    addToCart(product, image);
    showToast(`«${product.name}» añadido al carrito`);
    openCart();
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <Container>
          <p className="product-detail-loading">Cargando producto…</p>
        </Container>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <Container className="product-detail-notfound">
          <h1>Producto no encontrado</h1>
          <p>{error || 'El producto que buscas no existe.'}</p>
          <Button type="button" variant="primary" size="md" onClick={() => navigate('/#products')}>
            Volver a la tienda
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <Container className="product-detail-container">
        <Link to="/#products" className="product-detail-back">
          <FaArrowLeft aria-hidden /> Volver al catálogo
        </Link>

        <article className="product-detail">
          <div className="product-detail-gallery">
            <img src={image} alt={product.name} />
            {!soldOut && (
              <span className="product-detail-badge">
                <FaLeaf aria-hidden size={12} /> 100% natural
              </span>
            )}
          </div>

          <div className="product-detail-info">
            {product.weight ? <span className="product-detail-weight">{product.weight}</span> : null}
            <h1 className="product-detail-name">{product.name}</h1>
            <p className="product-detail-price">{formatPrice(product.price)}</p>

            {product.description ? (
              <p className="product-detail-desc">{product.description}</p>
            ) : null}

            <dl className="product-detail-meta">
              <div>
                <dt>Disponibilidad</dt>
                <dd className={soldOut ? 'product-detail-meta--out' : 'product-detail-meta--in'}>
                  {soldOut ? 'Agotado' : `${qty} unidades en stock`}
                </dd>
              </div>
              {product.weight ? (
                <div>
                  <dt>Presentación</dt>
                  <dd>{product.weight}</dd>
                </div>
              ) : null}
            </dl>

            <div className="product-detail-actions">
              {soldOut ? (
                <Button type="button" variant="secondary" size="md" disabled>
                  Sin existencias
                </Button>
              ) : !user ? (
                <Button type="button" variant="primary" size="md" onClick={openLogin}>
                  Iniciar sesión para comprar
                </Button>
              ) : (
                <Button type="button" variant="primary" size="md" onClick={handleAdd}>
                  <FaShoppingCart aria-hidden />
                  Añadir al carrito
                </Button>
              )}
            </div>
          </div>
        </article>
      </Container>
    </div>
  );
}
