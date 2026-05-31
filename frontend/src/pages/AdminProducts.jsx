import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';
import { formatPrice } from '../utils/formatPrice';
import Container from '../components/ui/Container.jsx';
import Button from '../components/ui/Button.jsx';
import './AdminProducts.css';

const emptyForm = {
  id: null,
  name: '',
  description: '',
  price: '',
  stock: '',
  weight: '',
  image: '',
};

export default function AdminProducts() {
  const { authFetch } = useAuth();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/admin/products');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los productos.');
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos.');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    document.title = 'Admin · Productos · ProFruit';
    loadProducts();
  }, [loadProducts]);

  const resetForm = () => {
    setForm(emptyForm);
    setMessage(null);
    setError(null);
  };

  const startCreate = () => {
    resetForm();
    setMessage(null);
  };

  const startEdit = (product) => {
    setForm({
      id: product.id,
      name: product.name ?? '',
      description: product.description ?? '',
      price: String(product.price ?? ''),
      stock: String(product.stock ?? ''),
      weight: product.weight ?? '',
      image: product.image ?? '',
    });
    setMessage(null);
    setError(null);
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number.parseInt(form.stock, 10),
      weight: form.weight.trim() || undefined,
      image: form.image.trim() || undefined,
    };

    try {
      const isEdit = form.id != null;
      const res = await authFetch('/api/products', {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(isEdit ? { ...payload, id: form.id } : payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar el producto.');

      setMessage(isEdit ? 'Producto actualizado.' : 'Producto creado.');
      resetForm();
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const ok = window.confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`);
    if (!ok) return;

    setError(null);
    setMessage(null);
    try {
      const res = await authFetch(`/api/products?id=${product.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar el producto.');
      setMessage('Producto eliminado.');
      if (form.id === product.id) resetForm();
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar.');
    }
  };

  return (
    <div className="admin-products">
      <Container className="admin-products-container">
        <header className="admin-products-header">
          <Link to="/" className="admin-products-back">
            <FaArrowLeft aria-hidden /> Volver a la tienda
          </Link>
          <h1>Administración de productos</h1>
          <p>Solo usuarios con rol administrador pueden gestionar el catálogo.</p>
        </header>

        <div className="admin-products-layout">
          <section className="admin-products-list" aria-label="Listado de productos">
            <div className="admin-products-list-head">
              <h2>Productos ({products.length})</h2>
              <Button type="button" variant="primary" size="sm" onClick={startCreate}>
                <FaPlus aria-hidden /> Nuevo
              </Button>
            </div>

            {loading ? <p className="admin-products-muted">Cargando…</p> : null}
            {error && !form.id ? <p className="admin-products-error">{error}</p> : null}

            {!loading && products.length === 0 ? (
              <p className="admin-products-muted">No hay productos. Crea el primero con el formulario.</p>
            ) : null}

            {!loading && products.length > 0 ? (
              <div className="admin-products-table-wrap">
                <table className="admin-products-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th>Reservado</th>
                      <th aria-label="Acciones" />
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className={form.id === product.id ? 'admin-products-row--active' : ''}>
                        <td>
                          <strong>{product.name}</strong>
                          {product.weight ? <small>{product.weight}</small> : null}
                        </td>
                        <td>{formatPrice(product.price)}</td>
                        <td>{product.stock}</td>
                        <td>{product.stock_reserved ?? 0}</td>
                        <td className="admin-products-actions">
                          <button type="button" className="admin-products-icon-btn" onClick={() => startEdit(product)} aria-label={`Editar ${product.name}`}>
                            <FaEdit aria-hidden />
                          </button>
                          <button type="button" className="admin-products-icon-btn admin-products-icon-btn--danger" onClick={() => handleDelete(product)} aria-label={`Eliminar ${product.name}`}>
                            <FaTrash aria-hidden />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>

          <section className="admin-products-form-panel" aria-label="Formulario de producto">
            <h2>{form.id ? `Editar #${form.id}` : 'Nuevo producto'}</h2>

            <form className="admin-products-form" onSubmit={handleSubmit}>
              <label>
                <span>Nombre</span>
                <input type="text" required value={form.name} onChange={(e) => setField('name', e.target.value)} />
              </label>
              <label>
                <span>Descripción</span>
                <textarea required rows={4} value={form.description} onChange={(e) => setField('description', e.target.value)} />
              </label>
              <div className="admin-products-form-row">
                <label>
                  <span>Precio (COP)</span>
                  <input type="number" required min="0" step="0.01" value={form.price} onChange={(e) => setField('price', e.target.value)} />
                </label>
                <label>
                  <span>Stock total</span>
                  <input type="number" required min="0" step="1" value={form.stock} onChange={(e) => setField('stock', e.target.value)} />
                </label>
              </div>
              <label>
                <span>Peso / presentación</span>
                <input type="text" placeholder="Ej. 250 g" value={form.weight} onChange={(e) => setField('weight', e.target.value)} />
              </label>
              <label>
                <span>URL de imagen</span>
                <input type="url" placeholder="https://…" value={form.image} onChange={(e) => setField('image', e.target.value)} />
              </label>

              {error ? <p className="admin-products-error">{error}</p> : null}
              {message ? <p className="admin-products-success">{message}</p> : null}

              <div className="admin-products-form-actions">
                {form.id ? (
                  <Button type="button" variant="secondary" size="md" onClick={resetForm}>
                    Cancelar edición
                  </Button>
                ) : null}
                <Button type="submit" variant="dark" size="md" disabled={saving}>
                  {saving ? 'Guardando…' : form.id ? 'Guardar cambios' : 'Crear producto'}
                </Button>
              </div>
            </form>
          </section>
        </div>
      </Container>
    </div>
  );
}
