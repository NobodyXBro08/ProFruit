import React, { useEffect, useState } from 'react';
import { FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext.jsx';
import './LoginModal.css';

const MIN_PASSWORD = 8;

export default function LoginModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    setError(null);
    setShowPassword(false);
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
  }, [mode, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'register') {
        if (password.length < MIN_PASSWORD) {
          throw new Error(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
        }
        const user = username.trim();
        await register({ username: user, password });
        await login(user, password);
        setUsername('');
        setPassword('');
        onClose();
      } else {
        await login(username, password);
        setUsername('');
        setPassword('');
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="login-modal-root" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
      <button type="button" className="login-modal-backdrop" aria-label="Cerrar" onClick={onClose} />
      <div className="login-modal-panel">
        <header className="login-modal-header">
          <h2 id="login-modal-title" className="login-modal-title">
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h2>
          <button type="button" className="login-modal-close" onClick={onClose} aria-label="Cerrar">
            <FaTimes size={20} />
          </button>
        </header>

        <div className="login-modal-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`login-modal-tab ${mode === 'login' ? 'login-modal-tab--active' : ''}`}
            onClick={() => setMode('login')}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={`login-modal-tab ${mode === 'register' ? 'login-modal-tab--active' : ''}`}
            onClick={() => setMode('register')}
          >
            Registro
          </button>
        </div>

        <form className="login-modal-form" onSubmit={handleSubmit} autoComplete="off">
          <label className="login-modal-label">
            Usuario
            <input
              className="login-modal-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              minLength={1}
            />
          </label>
          <label className="login-modal-label">
            Contraseña
            <div className="login-modal-password-wrap">
              <input
                className="login-modal-input login-modal-input--password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                required
                minLength={mode === 'register' ? MIN_PASSWORD : 1}
              />
              <button
                type="button"
                className="login-modal-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
              >
                {showPassword ? <FaEyeSlash size={18} aria-hidden /> : <FaEye size={18} aria-hidden />}
              </button>
            </div>
            {mode === 'register' ? (
              <span className="login-modal-hint">Mínimo {MIN_PASSWORD} caracteres. Al registrarte entrarás automáticamente.</span>
            ) : null}
          </label>

          {error && (
            <div className="login-modal-msg login-modal-msg--error" role="alert">
              <p className="login-modal-msg-main">{error.split(' — ')[0]}</p>
              {error.includes(' — ') ? (
                <p className="login-modal-msg-detail">{error.split(' — ').slice(1).join(' — ')}</p>
              ) : null}
            </div>
          )}

          <button type="submit" className="login-modal-submit" disabled={loading}>
            {loading ? 'Espera…' : mode === 'login' ? 'Entrar' : 'Crear cuenta y entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
