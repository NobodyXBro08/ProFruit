import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLoginModal } from '../context/LoginModalContext.jsx';
import Container from './ui/Container.jsx';
import Button from './ui/Button.jsx';
import './RequireAdmin.css';

/**
 * Protege rutas del panel. Opcionalmente exige un permiso concreto.
 * @param {{ children: React.ReactNode, permission?: string }} props
 */
export default function RequireAdmin({ children, permission = 'panel:access' }) {
  const { user, isAdmin, can, sessionReady } = useAuth();
  const { openLogin } = useLoginModal();

  if (!sessionReady) {
    return (
      <Container className="require-admin require-admin--loading">
        <p>Verificando acceso…</p>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="require-admin">
        <h1>Acceso restringido</h1>
        <p>Inicia sesión con una cuenta de personal autorizado.</p>
        <Button type="button" variant="primary" size="md" onClick={openLogin}>
          Iniciar sesión
        </Button>
        <p className="require-admin-back">
          <Link to="/">Volver al inicio</Link>
        </p>
      </Container>
    );
  }

  if (!isAdmin || !can(permission)) {
    return <Navigate to={isAdmin ? '/admin' : '/'} replace />;
  }

  return children;
}
