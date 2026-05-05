import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../config/api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'profruit-auth-v1';

function normalizeUserId(value) {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    const id = normalizeUserId(o?.id);
    if (!o || id === null || typeof o.username !== 'string' || !o.username.trim()) return null;
    return {
      id,
      username: o.username.trim(),
      ...(typeof o.fullName === 'string' && o.fullName.trim() && { fullName: o.fullName.trim() }),
      ...(typeof o.email === 'string' && o.email.trim() && { email: o.email.trim() }),
      ...(typeof o.phone === 'string' && o.phone.trim() && { phone: o.phone.trim() }),
      ...(typeof o.shippingAddress === 'string' && o.shippingAddress.trim() && {
        shippingAddress: o.shippingAddress.trim(),
      }),
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadUser());

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [user]);

  const login = useCallback(async (username, password) => {
    const res = await fetch(api('/api/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.message || 'No se pudo iniciar sesión.');
    }
    const uid = normalizeUserId(data.user?.id);
    if (!data.user || uid === null || typeof data.user.username !== 'string' || !String(data.user.username).trim()) {
      throw new Error('Respuesta del servidor inválida.');
    }
    const u = data.user;
    setUser({
      id: uid,
      username: String(u.username).trim(),
      ...(u.fullName && { fullName: u.fullName }),
      ...(u.email && { email: u.email }),
      ...(u.phone && { phone: u.phone }),
      ...(u.shippingAddress && { shippingAddress: u.shippingAddress }),
    });
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await fetch(api('/api/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.message || 'No se pudo registrar.');
    }
    return data;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const value = useMemo(() => ({ user, login, register, logout }), [user, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
