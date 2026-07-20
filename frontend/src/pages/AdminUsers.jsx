import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaTrash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';
import { ASSIGNABLE_ROLES, roleLabel } from '../utils/roles';
import AdminLayout from '../components/AdminLayout.jsx';
import Container from '../components/ui/Container.jsx';
import Button from '../components/ui/Button.jsx';
import './AdminUsers.css';

export default function AdminUsers() {
  const { authFetch, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/users');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los usuarios.');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios.');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    document.title = 'Admin · Usuarios · ProFruit';
    load();
  }, [load]);

  const updateRole = async (user, role) => {
    setSavingId(user.id);
    setError(null);
    setMessage(null);
    try {
      const res = await authFetch('/api/users', {
        method: 'PUT',
        body: JSON.stringify({ id: user.id, username: user.username, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el rol.');
      setMessage(`Rol de «${user.username}» actualizado a ${roleLabel(role)}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (user) => {
    if (user.id === currentUser?.id) {
      setError('No puedes eliminar tu propia cuenta.');
      return;
    }
    const ok = window.confirm(`¿Eliminar al usuario «${user.username}»?`);
    if (!ok) return;
    setError(null);
    try {
      const res = await authFetch(`/api/users?id=${user.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar.');
      setMessage('Usuario eliminado.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar.');
    }
  };

  return (
    <div className="admin-users">
      <Container className="admin-users-container">
        <Link to="/" className="admin-users-back">
          <FaArrowLeft aria-hidden /> Volver a la tienda
        </Link>

        <AdminLayout
          title="Usuarios y roles"
          subtitle="Solo el super administrador puede gestionar roles y accesos."
        >
          {error ? <p className="admin-users-error">{error}</p> : null}
          {message ? <p className="admin-users-success">{message}</p> : null}

          <section className="admin-users-panel">
            {loading ? <p className="admin-users-muted">Cargando…</p> : null}
            {!loading && users.length === 0 ? (
              <p className="admin-users-muted">No hay usuarios registrados.</p>
            ) : null}

            {!loading && users.length > 0 ? (
              <div className="admin-users-table-wrap">
                <table className="admin-users-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Usuario</th>
                      <th>Rol</th>
                      <th aria-label="Acciones" />
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>
                          <strong>{u.username}</strong>
                          {u.id === currentUser?.id ? <small>Tú</small> : null}
                        </td>
                        <td>
                          <select
                            value={u.role}
                            disabled={savingId === u.id}
                            onChange={(e) => updateRole(u, e.target.value)}
                            aria-label={`Rol de ${u.username}`}
                          >
                            {ASSIGNABLE_ROLES.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={u.id === currentUser?.id}
                            onClick={() => handleDelete(u)}
                          >
                            <FaTrash aria-hidden /> Eliminar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>

          <aside className="admin-users-help">
            <h2>Niveles de acceso</h2>
            <ul>
              <li>
                <strong>Editor:</strong> productos e inventario.
              </li>
              <li>
                <strong>Administrador:</strong> pedidos, promociones y estadísticas.
              </li>
              <li>
                <strong>Super administrador:</strong> todo lo anterior más usuarios y roles.
              </li>
            </ul>
          </aside>
        </AdminLayout>
      </Container>
    </div>
  );
}
