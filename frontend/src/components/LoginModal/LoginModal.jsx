import React, { useEffect, useState } from 'react';
import { FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext.jsx';
import './LoginModal.css';

export default function LoginModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [registerOk, setRegisterOk] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    setError(null);
    setRegisterOk(null);
    setShowPassword(false);
    setRegFullName('');
    setRegEmail('');
    setRegPhone('');
    setRegAddress('');
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setRegisterOk(null);
  }, [mode, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setRegisterOk(null);
    setLoading(true);
    try {
      if (mode === 'register') {
        await register({
          fullName: regFullName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim() || undefined,
          shippingAddress: regAddress.trim() || undefined,
          username: username.trim(),
          password,
        });
        setRegisterOk('Cuenta creada. Ahora puedes iniciar sesión con tu usuario y contraseña.');
        setMode('login');
        setPassword('');
        setRegFullName('');
        setRegEmail('');
        setRegPhone('');
        setRegAddress('');
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
          {mode === 'register' && (
            <>
              <p className="login-modal-section-hint">
                Estos datos se usarán para rellenar tu pedido al comprar.
              </p>
              <label className="login-modal-label">
                Nombre completo
                <input
                  className="login-modal-input"
                  name="profuit-reg-fullname"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  autoComplete="name"
                  required
                  minLength={2}
                />
              </label>
              <label className="login-modal-label">
                Correo electrónico
                <input
                  className="login-modal-input"
                  name="profuit-reg-email"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
              <label className="login-modal-label">
                Teléfono <span className="login-modal-optional">(opcional)</span>
                <input
                  className="login-modal-input"
                  name="profuit-reg-phone"
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  autoComplete="tel"
                />
              </label>
              <label className="login-modal-label">
                Dirección <span className="login-modal-optional">(opcional)</span>
                <textarea
                  className="login-modal-textarea"
                  name="profuit-reg-address"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  autoComplete="street-address"
                  rows={2}
                />
              </label>
            </>
          )}
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
                minLength={1}
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
          </label>

          {error && <p className="login-modal-msg login-modal-msg--error">{error}</p>}
          {registerOk && <p className="login-modal-msg login-modal-msg--success">{registerOk}</p>}

          <button type="submit" className="login-modal-submit" disabled={loading}>
            {loading ? 'Espera…' : mode === 'login' ? 'Entrar' : 'Registrarse'}
          </button>
        </form>
      </div>
    </div>
  );
}
