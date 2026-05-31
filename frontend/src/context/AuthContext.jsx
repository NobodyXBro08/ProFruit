import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../config/api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'profruit-auth-v2';

function normalizeUserId(value) {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

function normalizeRole(value) {
  return value === 'admin' ? 'admin' : 'client';
}

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    const id = normalizeUserId(o?.id);
    const token = typeof o?.token === 'string' ? o.token.trim() : '';
    if (!o || id === null || !token || typeof o.username !== 'string' || !o.username.trim()) return null;
    return {
      id,
      username: o.username.trim(),
      role: normalizeRole(o.role),
      token,
      ...(typeof o.fullName === 'string' && o.fullName.trim() && { fullName: o.fullName.trim() }),
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
  const [user, setUser] = useState(() => loadSession());
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      if (!user?.token) {
        if (!cancelled) setSessionReady(true);
        return;
      }

      try {
        const res = await fetch(api('/api/me'), {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (!res.ok) throw new Error('invalid');
        const data = await res.json();
        const uid = normalizeUserId(data.user?.id);
        if (!data.user || uid === null) throw new Error('invalid');
        if (!cancelled) {
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  id: uid,
                  username: String(data.user.username).trim(),
                  role: normalizeRole(data.user.role),
                }
              : null,
          );
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    }

    verifySession();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- solo al montar

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
    const token = typeof data.token === 'string' ? data.token.trim() : '';
    if (!data.user || uid === null || !token || typeof data.user.username !== 'string' || !String(data.user.username).trim()) {
      throw new Error('Respuesta del servidor inválida.');
    }
    const u = data.user;
    const session = {
      id: uid,
      username: String(u.username).trim(),
      role: normalizeRole(u.role),
      token,
      ...(u.fullName && { fullName: u.fullName }),
      ...(u.phone && { phone: u.phone }),
      ...(u.shippingAddress && { shippingAddress: u.shippingAddress }),
    };
    setUser(session);
    setSessionReady(true);
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

  const authFetch = useCallback(
    async (path, options = {}) => {
      if (!user?.token) {
        throw new Error('Debes iniciar sesión.');
      }
      const headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${user.token}`,
      };
      if (options.body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
      return fetch(api(path), { ...options, headers });
    },
    [user?.token],
  );

  const isAdmin = user?.role === 'admin';

  const value = useMemo(
    () => ({ user, login, register, logout, authFetch, isAdmin, sessionReady }),
    [user, login, register, logout, authFetch, isAdmin, sessionReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
