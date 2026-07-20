import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';
import { formatPrice } from '../utils/formatPrice';
import AdminLayout from '../components/AdminLayout.jsx';
import Container from '../components/ui/Container.jsx';
import Button from '../components/ui/Button.jsx';
import './AdminPromotions.css';

function toLocalInputValue(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyForm = {
  id: null,
  productId: '',
  name: '',
  mode: 'percent',
  discountPercent: '',
  promoPrice: '',
  startsAt: '',
  endsAt: '',
  active: true,
};

export default function AdminPromotions() {
  const { authFetch } = useAuth();
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [promoRes, prodRes] = await Promise.all([
        authFetch('/api/admin/promotions'),
        authFetch('/api/admin/products'),
      ]);
      const promoData = await promoRes.json().catch(() => ({}));
      const prodData = await prodRes.json().catch(() => ({}));
      if (!promoRes.ok) throw new Error(promoData.error || 'No se pudieron cargar las promociones.');
      if (!prodRes.ok) throw new Error(prodData.error || 'No se pudieron cargar los productos.');
      setPromotions(Array.isArray(promoData) ? promoData : []);
      setProducts(Array.isArray(prodData) ? prodData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar.');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    document.title = 'Admin · Promociones · ProFruit';
    load();
  }, [load]);

  const resetForm = () => {
    setForm(emptyForm);
    setMessage(null);
    setError(null);
  };

  const startEdit = (promo) => {
    setForm({
      id: promo.id,
      productId: String(promo.productId),
      name: promo.name || '',
      mode: promo.promoPrice != null ? 'price' : 'percent',
      discountPercent: promo.discountPercent != null ? String(promo.discountPercent) : '',
      promoPrice: promo.promoPrice != null ? String(promo.promoPrice) : '',
      startsAt: toLocalInputValue(promo.startsAt),
      endsAt: toLocalInputValue(promo.endsAt),
      active: Boolean(promo.active),
    });
    setMessage(null);
    setError(null);
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      productId: Number(form.productId),
      name: form.name.trim() || null,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
      active: form.active,
      ...(form.mode === 'percent'
        ? { discountPercent: Number(form.discountPercent) }
        : { promoPrice: Number(form.promoPrice) }),
    };

    try {
      const isEdit = form.id != null;
      const res = await authFetch('/api/admin/promotions', {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(isEdit ? { ...payload, id: form.id } : payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar la promoción.');
      setMessage(isEdit ? 'Promoción actualizada.' : 'Promoción creada.');
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (promo) => {
    setError(null);
    try {
      const res = await authFetch('/api/admin/promotions', {
        method: 'PUT',
        body: JSON.stringify({ id: promo.id, active: !promo.active }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo cambiar el estado.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar.');
    }
  };

  const handleDelete = async (promo) => {
    const ok = window.confirm(`¿Eliminar la promoción de «${promo.productName}»?`);
    if (!ok) return;
    try {
      const res = await authFetch(`/api/admin/promotions?id=${promo.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar.');
      setMessage('Promoción eliminada.');
      if (form.id === promo.id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar.');
    }
  };

  const now = Date.now();
  const isLive = (promo) => {
    if (!promo.active) return false;
    const start = new Date(promo.startsAt).getTime();
    const end = new Date(promo.endsAt).getTime();
    return start <= now && end >= now;
  };

  return (
    <div className="admin-promotions">
      <Container className="admin-promotions-container">
        <Link to="/" className="admin-promotions-back">
          <FaArrowLeft aria-hidden /> Volver a la tienda
        </Link>

        <AdminLayout
          title="Promociones"
          subtitle="Una sola promoción activa por producto: al activar o crear una, las demás del mismo producto se desactivan."
        >
          <div className="admin-promotions-layout">
            <section className="admin-promotions-panel" aria-label="Listado de promociones">
              <div className="admin-promotions-list-head">
                <h2>Promociones ({promotions.length})</h2>
                <Button type="button" variant="primary" size="sm" onClick={resetForm}>
                  <FaPlus aria-hidden /> Nueva
                </Button>
              </div>

              {loading ? <p className="admin-promotions-muted">Cargando…</p> : null}
              {!loading && promotions.length === 0 ? (
                <p className="admin-promotions-muted">No hay promociones. Crea la primera.</p>
              ) : null}

              {!loading && promotions.length > 0 ? (
                <div className="admin-promotions-table-wrap">
                  <table className="admin-promotions-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Descuento</th>
                        <th>Vigencia</th>
                        <th>Estado</th>
                        <th aria-label="Acciones" />
                      </tr>
                    </thead>
                    <tbody>
                      {promotions.map((promo) => (
                        <tr key={promo.id} className={form.id === promo.id ? 'is-active' : ''}>
                          <td>
                            <strong>{promo.productName}</strong>
                            {promo.name ? <small>{promo.name}</small> : null}
                          </td>
                          <td>
                            {promo.discountPercent != null
                              ? `${promo.discountPercent}%`
                              : formatPrice(promo.promoPrice)}
                          </td>
                          <td>
                            <small>
                              {new Date(promo.startsAt).toLocaleDateString('es-CO')} —{' '}
                              {new Date(promo.endsAt).toLocaleDateString('es-CO')}
                            </small>
                          </td>
                          <td>
                            <span
                              className={`admin-promotions-badge ${
                                isLive(promo)
                                  ? 'admin-promotions-badge--live'
                                  : promo.active
                                    ? 'admin-promotions-badge--scheduled'
                                    : 'admin-promotions-badge--off'
                              }`}
                            >
                              {isLive(promo) ? 'Vigente' : promo.active ? 'Programada' : 'Inactiva'}
                            </span>
                          </td>
                          <td className="admin-promotions-actions">
                            <button type="button" onClick={() => toggleActive(promo)}>
                              {promo.active ? 'Desactivar' : 'Activar'}
                            </button>
                            <button type="button" aria-label="Editar" onClick={() => startEdit(promo)}>
                              <FaEdit aria-hidden />
                            </button>
                            <button
                              type="button"
                              className="is-danger"
                              aria-label="Eliminar"
                              onClick={() => handleDelete(promo)}
                            >
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

            <section className="admin-promotions-panel" aria-label="Formulario de promoción">
              <h2>{form.id ? `Editar #${form.id}` : 'Nueva promoción'}</h2>
              <form className="admin-promotions-form" onSubmit={handleSubmit}>
                <label>
                  <span>Producto</span>
                  <select
                    required
                    value={form.productId}
                    onChange={(e) => setField('productId', e.target.value)}
                  >
                    <option value="">Selecciona…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {formatPrice(p.price)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Nombre interno (opcional)</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    placeholder="Ej. Promo verano"
                  />
                </label>
                <fieldset className="admin-promotions-mode">
                  <legend>Tipo de descuento</legend>
                  <label>
                    <input
                      type="radio"
                      name="mode"
                      checked={form.mode === 'percent'}
                      onChange={() => setField('mode', 'percent')}
                    />
                    Porcentaje
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="mode"
                      checked={form.mode === 'price'}
                      onChange={() => setField('mode', 'price')}
                    />
                    Precio promocional
                  </label>
                </fieldset>
                {form.mode === 'percent' ? (
                  <label>
                    <span>% de descuento</span>
                    <input
                      type="number"
                      required
                      min="0.01"
                      max="100"
                      step="0.01"
                      value={form.discountPercent}
                      onChange={(e) => setField('discountPercent', e.target.value)}
                    />
                  </label>
                ) : (
                  <label>
                    <span>Precio promocional (COP)</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={form.promoPrice}
                      onChange={(e) => setField('promoPrice', e.target.value)}
                    />
                  </label>
                )}
                <div className="admin-promotions-form-row">
                  <label>
                    <span>Inicio</span>
                    <input
                      type="datetime-local"
                      required
                      value={form.startsAt}
                      onChange={(e) => setField('startsAt', e.target.value)}
                    />
                  </label>
                  <label>
                    <span>Fin</span>
                    <input
                      type="datetime-local"
                      required
                      value={form.endsAt}
                      onChange={(e) => setField('endsAt', e.target.value)}
                    />
                  </label>
                </div>
                <label className="admin-promotions-check">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setField('active', e.target.checked)}
                  />
                  Promoción activa
                </label>

                {error ? <p className="admin-promotions-error">{error}</p> : null}
                {message ? <p className="admin-promotions-success">{message}</p> : null}

                <div className="admin-promotions-form-actions">
                  {form.id ? (
                    <Button type="button" variant="secondary" size="md" onClick={resetForm}>
                      Cancelar
                    </Button>
                  ) : null}
                  <Button type="submit" variant="dark" size="md" disabled={saving}>
                    {saving ? 'Guardando…' : form.id ? 'Guardar cambios' : 'Crear promoción'}
                  </Button>
                </div>
              </form>
            </section>
          </div>
        </AdminLayout>
      </Container>
    </div>
  );
}
