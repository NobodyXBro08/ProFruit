import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';
import AdminLayout from '../components/AdminLayout.jsx';
import Container from '../components/ui/Container.jsx';
import Button from '../components/ui/Button.jsx';
import './AdminInventory.css';

const MOVEMENT_LABELS = {
  entry: 'Entrada',
  exit: 'Salida',
  adjustment: 'Ajuste',
  sale: 'Venta',
};

export default function AdminInventory() {
  const { authFetch } = useAuth();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [movements, setMovements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [delta, setDelta] = useState('');
  const [absoluteStock, setAbsoluteStock] = useState('');
  const [mode, setMode] = useState('delta');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/admin/inventory');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar el inventario.');
      setItems(Array.isArray(data.items) ? data.items : []);
      setSummary(data.summary || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar inventario.');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  const loadMovements = useCallback(
    async (productId) => {
      try {
        const q = productId ? `?view=movements&productId=${productId}&limit=30` : '?view=movements&limit=30';
        const res = await authFetch(`/api/admin/inventory${q}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los movimientos.');
        setMovements(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar movimientos.');
      }
    },
    [authFetch],
  );

  useEffect(() => {
    document.title = 'Admin · Inventario · ProFruit';
    loadInventory();
    loadMovements();
  }, [loadInventory, loadMovements]);

  const selected = items.find((i) => i.id === selectedId) || null;

  const handleSelect = (item) => {
    setSelectedId(item.id);
    setDelta('');
    setAbsoluteStock(String(item.stock));
    setNote('');
    setMessage(null);
    setError(null);
    loadMovements(item.id);
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!selectedId || !selected) return;

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      let body;
      if (mode === 'set') {
        const stock = Number.parseInt(absoluteStock, 10);
        if (!Number.isInteger(stock) || stock < 0) {
          throw new Error('Indica un stock total entero mayor o igual a 0.');
        }
        const diff = Math.abs(stock - selected.stock);
        if (diff >= 50) {
          const ok = window.confirm(
            `Vas a fijar el stock en ${stock} (ahora ${selected.stock}, diferencia ${diff}). ¿Continuar?`,
          );
          if (!ok) {
            setSaving(false);
            return;
          }
        }
        body = {
          mode: 'set',
          productId: selectedId,
          stock,
          note: note.trim() || undefined,
        };
      } else {
        const value = Number.parseInt(delta, 10);
        if (!Number.isInteger(value) || value === 0) {
          throw new Error('Indica una cantidad entera distinta de 0.');
        }
        if (Math.abs(value) >= 50) {
          const ok = window.confirm(
            `Ajuste grande: ${value > 0 ? '+' : ''}${value} unidades. ¿Continuar?`,
          );
          if (!ok) {
            setSaving(false);
            return;
          }
        }
        body = {
          productId: selectedId,
          delta: value,
          note: note.trim() || undefined,
        };
      }

      const res = await authFetch('/api/admin/inventory', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo ajustar el stock.');
      setMessage(mode === 'set' ? 'Stock absoluto actualizado.' : valueMsg(body.delta));
      setDelta('');
      setNote('');
      await loadInventory();
      await loadMovements(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ajustar.');
    } finally {
      setSaving(false);
    }
  };

  const valueMsg = (value) => (value > 0 ? 'Entrada registrada.' : 'Salida registrada.');

  const statusLabel = (status) => {
    if (status === 'out') return 'Agotado';
    if (status === 'low') return 'Bajo';
    return 'OK';
  };

  return (
    <div className="admin-inventory">
      <Container className="admin-inventory-container">
        <Link to="/" className="admin-inventory-back">
          <FaArrowLeft aria-hidden /> Volver a la tienda
        </Link>

        <AdminLayout
          title="Inventario"
          subtitle="Controla el stock, registra entradas/salidas y revisa alertas."
        >
          {summary ? (
            <div className="admin-inventory-summary">
              <div>
                <span>Productos</span>
                <strong>{summary.totalProducts}</strong>
              </div>
              <div>
                <span>Disponibles</span>
                <strong>{summary.availableUnits}</strong>
              </div>
              <div>
                <span>Reservados</span>
                <strong>{summary.reservedUnits}</strong>
              </div>
              <div className="admin-inventory-summary--warn">
                <span>Stock bajo</span>
                <strong>{summary.lowStockCount}</strong>
              </div>
              <div className="admin-inventory-summary--danger">
                <span>Agotados</span>
                <strong>{summary.outOfStockCount}</strong>
              </div>
            </div>
          ) : null}

          <div className="admin-inventory-layout">
            <section className="admin-inventory-panel" aria-label="Estado del inventario">
              <h2>Estado actual</h2>
              {loading ? <p className="admin-inventory-muted">Cargando…</p> : null}
              {!loading && items.length === 0 ? (
                <p className="admin-inventory-muted">No hay productos en inventario.</p>
              ) : null}
              {!loading && items.length > 0 ? (
                <div className="admin-inventory-table-wrap">
                  <table className="admin-inventory-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Total</th>
                        <th>Reservado</th>
                        <th>Disponible</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr
                          key={item.id}
                          className={`${selectedId === item.id ? 'is-active' : ''} ${
                            item.status !== 'ok' ? `is-${item.status}` : ''
                          }`}
                          onClick={() => handleSelect(item)}
                        >
                          <td>
                            <strong>{item.name}</strong>
                            {item.weight ? <small>{item.weight}</small> : null}
                          </td>
                          <td>{item.stock}</td>
                          <td>{item.stockReserved}</td>
                          <td>{item.available}</td>
                          <td>
                            <span className={`admin-inventory-badge admin-inventory-badge--${item.status}`}>
                              {statusLabel(item.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>

            <section className="admin-inventory-panel" aria-label="Ajuste de stock">
              <h2>{selected ? `Movimiento · ${selected.name}` : 'Registrar movimiento'}</h2>
              {!selected ? (
                <p className="admin-inventory-muted">Selecciona un producto de la tabla.</p>
              ) : (
                <form className="admin-inventory-form" onSubmit={handleAdjust}>
                  <p className="admin-inventory-muted">
                    Disponible: <strong>{selected.available}</strong> · Total: {selected.stock} · Reservado:{' '}
                    {selected.stockReserved}
                  </p>
                  <div className="admin-inventory-mode" role="group" aria-label="Tipo de ajuste">
                    <button
                      type="button"
                      className={mode === 'delta' ? 'is-active' : ''}
                      onClick={() => setMode('delta')}
                    >
                      Entrada / salida
                    </button>
                    <button
                      type="button"
                      className={mode === 'set' ? 'is-active' : ''}
                      onClick={() => setMode('set')}
                    >
                      Stock absoluto
                    </button>
                  </div>
                  {mode === 'delta' ? (
                    <label>
                      <span>Cantidad (+ entrada / − salida)</span>
                      <input
                        type="number"
                        required
                        step="1"
                        value={delta}
                        onChange={(e) => setDelta(e.target.value)}
                        placeholder="Ej. 10 o -3"
                      />
                    </label>
                  ) : (
                    <label>
                      <span>Stock total (absoluto)</span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1"
                        value={absoluteStock}
                        onChange={(e) => setAbsoluteStock(e.target.value)}
                        placeholder="Ej. 120"
                      />
                    </label>
                  )}
                  <label>
                    <span>Nota (opcional)</span>
                    <input
                      type="text"
                      maxLength={512}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Compra a proveedor, merma…"
                    />
                  </label>
                  {error ? <p className="admin-inventory-error">{error}</p> : null}
                  {message ? <p className="admin-inventory-success">{message}</p> : null}
                  <Button type="submit" variant="dark" size="md" disabled={saving}>
                    {saving ? 'Guardando…' : mode === 'set' ? 'Fijar stock' : 'Registrar movimiento'}
                  </Button>
                </form>
              )}

              <h3 className="admin-inventory-movements-title">Historial reciente</h3>
              {movements.length === 0 ? (
                <p className="admin-inventory-muted">Sin movimientos registrados.</p>
              ) : (
                <ul className="admin-inventory-movements">
                  {movements.map((m) => (
                    <li key={m.id}>
                      <div>
                        <strong>{MOVEMENT_LABELS[m.movementType] || m.movementType}</strong>
                        <span>
                          {m.productName || `#${m.productId}`} · {m.quantity} u. ({m.stockBefore} → {m.stockAfter})
                        </span>
                        {m.note ? <small>{m.note}</small> : null}
                      </div>
                      <time>{new Date(m.createdAt).toLocaleString('es-CO')}</time>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </AdminLayout>
      </Container>
    </div>
  );
}
